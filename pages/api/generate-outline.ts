import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import type { HeroProfile, ReaderProfile, StorySettings, StoryOutline } from "../../lib/models/types";
import { generateOutline as generateOutlineLocal } from "../../lib/storyEngine";

type SuccessOut = { outline: StoryOutline; reqId: string };
type ErrorOut = { error: string; message: string; reqId: string };

type OutlineRequestBody =
  | { hero: HeroProfile; reader: ReaderProfile; settings: StorySettings }
  | { state: { hero: HeroProfile; reader: ReaderProfile; settings: StorySettings } };

function getProvider(): "ollama" | "local" {
  const raw = (process.env.AI_PROVIDER || "ollama").toLowerCase();
  return raw === "local" ? "local" : "ollama";
}

async function ollamaOutline(reqId: string, hero: HeroProfile, reader: ReaderProfile, settings: StorySettings): Promise<StoryOutline> {
  const base = (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL || "dolphin-llama3:latest";
  const temperature = process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) : 0.7;

  const heroName = (hero.childName || "the hero").trim();
  const readerLabel = (reader.relationshipDescription || reader.childName || "their favorite grown-up").trim();

  // Try to infer a “length” field if present; otherwise default to 3 scenes.
  const lenRaw = String((settings as any).length ?? "").toLowerCase();
  const sceneCount = lenRaw.includes("long") ? 8 : lenRaw.includes("medium") ? 6 : 3;

  const system = [
    "You are StorySmith's Outline Generator.",
    "Audience: children + a tired adult reader; warm, safe, non-scary, gently playful.",
    "Return ONLY valid JSON. No markdown. No extra text.",
    "CRITICAL: never duplicate names (e.g., never output 'Chantal and Chantal and Adam').",
    `Output JSON must match exactly: { "scenes": [ { "index": number, "title": string, "summary": string } ] }`,
    `Number of scenes: ${sceneCount}.`,
  ].join("\n");

  const user = [
    `Hero name: ${heroName}`,
    `Reader label: ${readerLabel}`,
    `Setting: ${(settings as any).setting ?? (settings as any).place ?? "a cozy place"}`,
    `Vibe: ${(settings as any).adventureType ?? (settings as any).vibe ?? "gentle"}`,
    (settings as any).userIdea ? `Idea: ${(settings as any).userIdea}` : "",
    "",
    "Write a simple outline. Each summary is 1–2 sentences. Child-friendly. Clear progression.",
  ].filter(Boolean).join("\n");

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      options: { temperature },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as any;
  const content = data?.message?.content;

  if (!content || typeof content !== "string") {
    throw new Error("Ollama response missing message.content");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ollama returned non-JSON content (despite format=json)");
  }

  const rawScenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  const scenes = rawScenes.slice(0, sceneCount).map((s: any, i: number) => ({
    id: `outline-${i + 1}`,
    index: Number.isFinite(Number(s?.index)) ? Number(s.index) : i + 1,
    title: typeof s?.title === "string" ? s.title : `Scene ${i + 1}`,
    summary: typeof s?.summary === "string" ? s.summary : "",
  }));

  while (scenes.length < sceneCount) {
    const i = scenes.length;
    scenes.push({ id: `outline-${i + 1}`, index: i + 1, title: `Scene ${i + 1}`, summary: "" });
  }

  return { scenes } as StoryOutline;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessOut | ErrorOut>) {
  const reqId = randomUUID();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", message: "Method not allowed", reqId });
    }

    const rawBody = req.body ?? {};
    const body =
      typeof rawBody === "string"
        ? (JSON.parse(rawBody) as Partial<OutlineRequestBody>)
        : (rawBody as Partial<OutlineRequestBody>);

    const hero = (body as any)?.hero ?? (body as any)?.state?.hero;
    const reader = (body as any)?.reader ?? (body as any)?.state?.reader;
    const settings = (body as any)?.settings ?? (body as any)?.state?.settings;

    if (!hero || !reader || !settings) {
      return res.status(400).json({
        error: "Missing required parameters (hero, reader, settings).",
        message: "Missing required parameters (hero, reader, settings).",
        reqId,
      });
    }

    const provider = getProvider();
    const outline =
      provider === "local"
        ? await generateOutlineLocal(hero, reader, settings)
        : await ollamaOutline(reqId, hero, reader, settings);

    return res.status(200).json({ outline, reqId });
  } catch (err: any) {
    console.error(`[generate-outline ${reqId}] error:`, err);
    return res.status(500).json({
      error: err?.message || "Unknown error",
      message: err?.message || "Unknown error",
      reqId,
    });
  }
}
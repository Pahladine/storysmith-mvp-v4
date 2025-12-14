import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import type { HeroProfile, ReaderProfile, StorySettings, StoryOutline } from "../../lib/models/types";
import { generateScenes as generateScenesLocal } from "../../lib/storyEngine";

type StoryScene = {
  id: string;
  index: number;
  title: string;
  text: string;
  illustrationPrompt: string;
};

type SuccessOut = { scenes: StoryScene[]; reqId: string };
type ErrorOut = { error: string; message: string; reqId: string };

function getProvider(): "ollama" | "local" {
  const raw = (process.env.AI_PROVIDER || "ollama").toLowerCase();
  return raw === "local" ? "local" : "ollama";
}

async function ollamaScenes(
  reqId: string,
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline
): Promise<StoryScene[]> {
  const base = (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL || "dolphin-llama3:latest";
  const temperature = process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) : 0.7;

  const heroName = (hero.childName || "the hero").trim();
  const readerLabel = (reader.relationshipDescription || reader.childName || "their favorite grown-up").trim();
  const tone = (settings as any).tone ?? (settings as any).vibe ?? "gentle";
  const place = (settings as any).setting ?? (settings as any).place ?? "a cozy place";

  const sceneLines = (outline.scenes || []).map((s: any) => `(${s.index}) ${s.title}: ${s.summary}`).join("\n");
  const n = (outline.scenes || []).length || 3;

  const system = [
    "You are StorySmith's Scene Weaver.",
    "Audience: children + a tired adult reader; warm, safe, non-scary, gently playful.",
    "QUALITY MANDATE: vary pacing to match action (short sentences for excitement, longer for wonder).",
    "QUALITY MANDATE: include at least TWO sensory details per scene (sound/smell/touch/taste, not just sight).",
    "QUALITY MANDATE: each scene has a simple emotional arc stated plainly (e.g., curious -> surprised -> proud).",
    "QUALITY MANDATE: Scene 2+ MUST start by anchoring the reader to the end of the previous scene (clear transition).",
    "STYLE: warm, inviting, lightly theatrical, zero jargon, never condescending. No peril or scary imagery.",
    "STYLE: keep names consistent; never duplicate names; never invent extra character names unless supplied.",
    "Return ONLY valid JSON. No markdown. No extra text.",
    "CRITICAL: never duplicate names (e.g., never output 'Chantal and Chantal and Adam').",
    'Output JSON must match exactly: { "scenes": [ { "id": string, "index": number, "title": string, "text": string, "illustrationPrompt": string } ] }',
    `Number of scenes: ${n}.`,
  ].join("\n");

  const user = [
    `Hero: ${heroName}`,
    `Reader label: ${readerLabel}`,
    `Tone: ${tone}`,
    `Place: ${place}`,
    "",
    "Outline:",
    sceneLines,
    "",
    "Write each scene as 150â€“250 words, cozy and age-appropriate.",
    "Also return a concise children's-book illustration prompt per scene.",
  ].join("\n");

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
  if (!content || typeof content !== "string") throw new Error("Ollama response missing message.content");

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ollama returned non-JSON content (despite format=json)");
  }

  const rawScenes = Array.isArray(parsed?.scenes) ? parsed.scenes : [];
  const scenes: StoryScene[] = rawScenes.slice(0, n).map((s: any, i: number) => ({
    id: String(s?.id ?? `scene-${i + 1}`),
    index: Number.isFinite(Number(s?.index)) ? Number(s.index) : i + 1,
    title: typeof s?.title === "string" ? s.title : `Scene ${i + 1}`,
    text: typeof s?.text === "string" ? s.text : "",
    illustrationPrompt: typeof s?.illustrationPrompt === "string" ? s.illustrationPrompt : "",
  }));

  while (scenes.length < n) {
    const i = scenes.length;
    scenes.push({ id: `scene-${i + 1}`, index: i + 1, title: `Scene ${i + 1}`, text: "", illustrationPrompt: "" });
  }

  return scenes;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessOut | ErrorOut>) {
  const reqId = randomUUID();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", message: "Method not allowed", reqId });
    }

    const b = req.body ?? {};
    const state = (b as any).state;

    // Accept either { state } or { hero, reader, settings, outline }
    const hero: HeroProfile = (b as any).hero ?? state?.hero;
    const reader: ReaderProfile = (b as any).reader ?? state?.reader;
    const settings: StorySettings = (b as any).settings ?? state?.settings;
    const outline: StoryOutline = (b as any).outline ?? state?.outline;

    if (!hero || !reader || !settings || !outline) {
      return res.status(400).json({
        error: "Missing required parameters (hero, reader, settings, outline).",
        message: "Missing required parameters (hero, reader, settings, outline).",
        reqId,
      });
    }

    const provider = getProvider();

    if (provider === "local") {
      const result = await generateScenesLocal(hero, reader, settings, outline);
      return res.status(200).json({ scenes: (result as any).scenes ?? result, reqId });
    }

    const scenes = await ollamaScenes(reqId, hero, reader, settings, outline);
    return res.status(200).json({ scenes, reqId });
  } catch (err: any) {
    console.error(`[generate-scenes ${reqId}] error:`, err);
    return res.status(500).json({
      error: err?.message || "Unknown error",
      message: err?.message || "Unknown error",
      reqId,
    });
  }
}
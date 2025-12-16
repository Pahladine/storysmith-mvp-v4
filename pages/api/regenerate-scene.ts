import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import type { HeroProfile, ReaderProfile, StorySettings, StoryOutline, StoryScene } from "../../lib/models/types";
import { regenerateScene as regenerateSceneLocal } from "../../lib/storyEngine";

type SuccessOut = { scene: StoryScene; reqId: string };
type ErrorOut = { error: string; message: string; reqId: string };

function getProvider(): "ollama" | "local" {
  const raw = (process.env.AI_PROVIDER || "ollama").toLowerCase();
  return raw === "local" ? "local" : "ollama";
}

async function ollamaRegenerate(
  reqId: string,
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline,
  sceneId: string,
  instructions: string
): Promise<StoryScene> {
  const base = (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL || "dolphin-llama3:latest";
  const temperature = process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) : 0.7;

  const heroName = (hero.childName || "the hero").trim();
  const readerLabel = (reader.relationshipDescription || reader.childName || "their favorite grown-up").trim();
  const tone = (settings as any).tone ?? (settings as any).vibe ?? "gentle";
  const place = (settings as any).setting ?? (settings as any).place ?? "a cozy place";

  const sceneIndexMatch = sceneId.split("-").pop() || "1";
  const outlineScene = (outline.scenes || []).find((s: any) => String(s.id || "").endsWith(sceneIndexMatch));
  const originalSummary = outlineScene?.summary || "A fun moment in the story.";

  const system = [
    "You are StorySmith's Scene Polisher.",
    "Audience: children + a tired adult reader; warm, safe, non-scary, gently playful.",
    "QUALITY MANDATE: improve pacing (match rhythm to action) and clarity without changing the core events.",
    "QUALITY MANDATE: include at least TWO sensory details (sound/smell/touch/taste) and a simple emotional arc stated plainly.",
    "QUALITY MANDATE: preserve continuity with the outline summary; do not introduce new named characters.",
    "STYLE: warm, inviting, lightly theatrical, zero jargon, never condescending. No peril or scary imagery.",
    "STYLE: keep names consistent; never duplicate names; never output repeated name sequences.",
    "Return ONLY valid JSON. No markdown. No extra text.",
    "CRITICAL: never duplicate names (e.g., never output 'Chantal and Chantal and Adam').",
    'Output JSON must match exactly: { "scene": { "id": string, "index": number, "title": string, "summary": string, "text": string, "illustrationPrompt": string } }'
  ].join("\n");

  const user = [
    `Hero: ${heroName}`,
    `Reader label: ${readerLabel}`,
    `Tone: ${tone}`,
    `Place: ${place}`,
    "",
    `Scene ID to rewrite: ${sceneId}`,
    `Original outline summary: ${originalSummary}`,
    "",
    "Instructions:",
    instructions || "(none)",
    "",
    "Rewrite the scene in a cozy, child-friendly way (150Ã¢â‚¬â€œ250 words).",
    "Keep it consistent with the outline summary, but apply the instructions.",
    "STORYBOOK FORMAT: The rewritten scene text must follow this structure:",
    "1) Title line (max 7 words).",
    "2) Blank line, then 2 short paragraphs (2-4 sentences each).",
    "3) Blank line, then a gentle page-turn closing line that tees up what happens next.",
    "RULES: No bullet lists, no markdown headings, no extra sections.",
    "If this is Scene 2+, ensure the first sentence clearly connects from what happened just before.",
    "ILLUSTRATION PROMPT TEMPLATE: keep the illustrationPrompt consistent with the rewritten scene using:",
    "Subject; Setting; Composition; Lighting/Color; Mood; Consistency notes; Avoid text in image.",
    "Also provide a concise children's-book illustrationPrompt that matches the rewritten scene."
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
        { role: "user", content: user }
      ]
    })
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

  const s = parsed?.scene ?? {};
  const index = Number.isFinite(Number(s?.index)) ? Number(s.index) : (outlineScene?.index ?? 1);

  return {
    id: String(s?.id ?? sceneId),
    index,
    title: typeof s?.title === "string" ? s.title : `[Rewritten] ${outlineScene?.title || "New Scene"}`,
    summary: typeof s?.summary === "string" ? s.summary : (outlineScene?.summary || "A refreshed chapter summary."),
    text: typeof s?.text === "string" ? s.text : "",
    illustrationPrompt: typeof s?.illustrationPrompt === "string" ? s.illustrationPrompt : ""
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessOut | ErrorOut>) {
  const reqId = randomUUID();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", message: "Method not allowed", reqId });
    }

    const b = req.body ?? {};
    const state = (b as any).state;

    // Accept either { state } or flat fields
    const hero: HeroProfile = (b as any).hero ?? state?.hero;
    const reader: ReaderProfile = (b as any).reader ?? state?.reader;
    const settings: StorySettings = (b as any).settings ?? state?.settings;
    const outline: StoryOutline = (b as any).outline ?? state?.outline;

    const sceneId = String((b as any).sceneId ?? (b as any).id ?? "").trim();
    const instructions = String((b as any).instructions ?? (b as any).notes ?? "").trim();

    if (!hero || !reader || !settings || !outline || !sceneId) {
      return res.status(400).json({
        error: "Missing required parameters (hero, reader, settings, outline, sceneId).",
        message: "Missing required parameters (hero, reader, settings, outline, sceneId).",
        reqId
      });
    }

    const provider = getProvider();

    if (provider === "local") {
      // Local engine signature: (hero, reader, settings, outline, sceneId)
      // Note: local engine does NOT accept freeform instructions; those are Ollama-only for now.
      const scene = await regenerateSceneLocal(hero, reader, settings, outline, sceneId);
      return res.status(200).json({ scene, reqId });
    }

    const scene = await ollamaRegenerate(reqId, hero, reader, settings, outline, sceneId, instructions);
    return res.status(200).json({ scene, reqId });

  } catch (err: any) {
    console.error(`[regenerate-scene ${reqId}] error:`, err);
    return res.status(500).json({
      error: err?.message || "Unknown error",
      message: err?.message || "Unknown error",
      reqId
    });
  }
}

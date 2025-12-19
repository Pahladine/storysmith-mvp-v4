import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import type { HeroProfile, ReaderProfile, StorySettings, StoryOutline, StoryScene } from "../../lib/models/types";
import { generateScenes as generateScenesLocal } from "../../lib/storyEngine";

type SuccessOut = { scenes: StoryScene[]; reqId: string };
type ErrorOut = { error: string; message: string; reqId: string };

type Provider = "ollama" | "local" | "openai";

function getProvider(): Provider {
  const raw = String(process.env.AI_PROVIDER || "ollama").toLowerCase().trim();
  if (raw === "local") return "local";
  if (raw === "openai") return "openai";
  return "ollama";
}

function normalizeText(x: any) {
  return String(x ?? "").replace(/\s+/g, " ").trim();
}

function hasImageData(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  for (const k of ["heroPhotoDataUrl", "photoDataUrl", "imageDataUrl", "dataUrl", "photo", "image"]) {
    const v = (obj as any)[k];
    if (typeof v === "string" && v.startsWith("data:image/")) return true;
  }
  for (const [, v] of Object.entries(obj)) {
    if (typeof v === "string" && v.length > 2000 && v.startsWith("data:image/")) return true;
  }
  return false;
}

function stripLargeFields(obj: any) {
  if (!obj || typeof obj !== "object") return obj;
  const clone: any = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "string") {
      if (v.startsWith("data:image/") || v.length > 2000) continue;
      clone[k] = v;
      continue;
    }
    clone[k] = v;
  }
  delete clone.heroPhotoDataUrl;
  delete clone.photoDataUrl;
  delete clone.imageDataUrl;
  delete clone.dataUrl;
  return clone;
}

function buildHeroVisualNotes(hero: any): string {
  if (!hero || typeof hero !== "object") return "";
  const h = stripLargeFields(hero);
  const parts: string[] = [];
  const add = (label: string, val: any) => {
    const t = normalizeText(val);
    if (t) parts.push(`${label}: ${t}`);
  };

  add("heroType", (h as any).heroType);
  add("species", (h as any).species);
  add("age", (h as any).age);
  add("skin", (h as any).skinTone || (h as any).skin);
  add("eyes", (h as any).eyeColor || (h as any).eyes);
  add("hair", (h as any).hairColor || (h as any).hair);
  add("outfit", (h as any).outfit || (h as any).clothing);
  add("accessory", (h as any).accessory);
  add("companion", (h as any).companionName || (h as any).companion);

  if (Array.isArray((h as any).traits) && (h as any).traits.length) {
    const t = (h as any).traits.map(normalizeText).filter(Boolean).slice(0, 6).join(", ");
    if (t) parts.push(`traits: ${t}`);
  }

  return parts.join("; ");
}

function buildDesignSchema(settings: any): string {
  const fromSettings =
    normalizeText(settings?.designSchema) ||
    normalizeText(settings?.illustrationStyle) ||
    normalizeText(settings?.artStyle) ||
    normalizeText(settings?.visualStyle) ||
    "";
  if (fromSettings) return fromSettings;

  // MVP default (locked)
  return "Children's storybook illustration; warm, gentle, safe; painterly watercolor/gouache feel; soft lighting; clean shapes; cohesive character design across scenes; no on-image text; no watermarks; no scary/peril imagery; no weapons; no injuries.";
}

function extractResponseText(resp: any): string {
  if (typeof resp?.output_text === "string" && resp.output_text.trim()) return resp.output_text.trim();

  const out: string[] = [];
  for (const item of resp?.output ?? []) {
    if (item?.type !== "message") continue;
    for (const c of item?.content ?? []) {
      if (c?.type === "output_text" && typeof c?.text === "string") out.push(c.text);
    }
  }
  return out.join("\n").trim();
}

async function openaiJson<T>(args: {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  schemaName: string;
  schema: any;
  input: Array<{ role: "system" | "user"; content: string }>;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const body = {
    model: args.model,
    input: args.input,
    temperature: args.temperature,
    max_output_tokens: args.maxOutputTokens,
    text: {
      format: {
        type: "json_schema",
        name: args.schemaName,
        strict: true,
        schema: args.schema,
      },
    },
  };

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${rawText.slice(0, 800)}`);

  let envelope: any;
  try {
    envelope = JSON.parse(rawText);
  } catch {
    throw new Error("OpenAI returned non-JSON response envelope.");
  }

  const outputText = extractResponseText(envelope);
  if (!outputText) throw new Error("OpenAI response missing output text.");

  try {
    return JSON.parse(outputText) as T;
  } catch {
    // fallback: json_object mode
    const body2 = {
      model: args.model,
      input: [
        ...args.input,
        { role: "system" as const, content: "Return ONLY valid JSON. No markdown. No extra text." },
      ],
      temperature: args.temperature,
      max_output_tokens: args.maxOutputTokens,
      text: { format: { type: "json_object" } },
    };

    const res2 = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body2),
    });

    const rawText2 = await res2.text();
    if (!res2.ok) throw new Error(`OpenAI error ${res2.status}: ${rawText2.slice(0, 800)}`);

    let envelope2: any;
    try {
      envelope2 = JSON.parse(rawText2);
    } catch {
      throw new Error("OpenAI returned non-JSON response envelope (fallback).");
    }

    const outputText2 = extractResponseText(envelope2);
    if (!outputText2) throw new Error("OpenAI response missing output text (fallback).");
    return JSON.parse(outputText2) as T;
  }
}

const SYSTEM = [
  "You are StorySmith's Scene Weaver.",
  "Audience: children + a tired adult reader; warm, safe, non-scary, gently playful.",
  "QUALITY MANDATE: clear, concrete, sensory; keep names consistent; no new named characters.",
  "Return ONLY valid JSON. No markdown. No extra text.",
].join("\n");

function buildUserPrompt(hero: HeroProfile, reader: ReaderProfile, settings: StorySettings, outline: StoryOutline) {
  const heroName = normalizeText((hero as any).childName || (hero as any).name || "the hero");
  const readerLabel = normalizeText((reader as any).relationshipDescription || (reader as any).childName || "their favorite grown-up");
  const tone = normalizeText((settings as any).tone ?? (settings as any).vibe ?? "gentle");
  const place = normalizeText((settings as any).setting ?? (settings as any).place ?? "a cozy place");
  const schema = buildDesignSchema(settings);

  const refPhoto = hasImageData(hero) ? "yes (use it only as consistency guidance; do NOT mention it in the prompt)" : "no";
  const heroNotes = buildHeroVisualNotes(hero) || "(none provided)";

  const outlineText =
    (outline as any)?.scenes && Array.isArray((outline as any).scenes)
      ? (outline as any).scenes
          .map((s: any) => `Scene ${s.index || ""}: ${s.title || ""} — ${s.summary || ""}`.trim())
          .join("\n")
      : normalizeText((outline as any) as any);

  return [
    `Hero: ${heroName}`,
    `Reader label: ${readerLabel}`,
    `Tone: ${tone}`,
    `Place: ${place}`,
    `Reference photo provided: ${refPhoto}`,
    `Hero visual notes (best-effort): ${heroNotes}`,
    `Design schema (locked): ${schema}`,
    "",
    "Outline:",
    outlineText || "(missing outline text)",
    "",
    "Write each scene as 150-250 words, cozy and age-appropriate.",
    "STORYBOOK FORMAT: For each scene text, use plain text with this structure:",
    "1) Title line (max 7 words).",
    "2) Blank line, then 2 short paragraphs (2-4 sentences each).",
    "3) Blank line, then a gentle page-turn closing line that tees up the next scene.",
    "RULES: No bullet lists, no markdown headings, no quotes around the title, no extra sections.",
    "RULES: Scene 2+ first sentence must connect clearly from the end of the previous scene.",
    "",
    "ILLUSTRATION PROMPT OUTPUT (professional, schema-driven):",
    "For each scene, illustrationPrompt MUST be a SINGLE LINE using semicolon-separated labeled segments in this exact order:",
    "STYLE: ...; CHARACTERS: ...; SETTING: ...; ACTION: ...; COMPOSITION: ...; LIGHTING/COLOR: ...; MOOD: ...; CONSISTENCY: ...; NEGATIVE: ...",
    "Rules:",
    "- Use the locked design schema style.",
    "- Keep hero/companion physical features and outfits consistent across all scenes.",
    "- No scary imagery, no weapons, no injuries, and NO written text in the image.",
    "- Do not include markdown, bullets, or quotes in illustrationPrompt.",
  ].join("\n");
}

async function ollamaGenerateScenes(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline
): Promise<StoryScene[]> {
  const base = (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL || "dolphin-llama3:latest";
  const temperature = process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) : 0.7;

  const user = buildUserPrompt(hero, reader, settings, outline);

  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      options: { temperature },
      messages: [
        { role: "system", content: SYSTEM },
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

  const desired = typeof (settings as any)?.numScenes === "number" ? (settings as any).numScenes : 6;

  const scenes = (Array.isArray(parsed?.scenes) ? parsed.scenes : [])
    .slice(0, desired)
    .map((s: any, i: number) => ({
      id: String(s?.id ?? `scene-${i + 1}`),
      index: Number.isFinite(Number(s?.index)) ? Number(s.index) : i + 1,
      title: typeof s?.title === "string" ? s.title : `Scene ${i + 1}`,
      text: typeof s?.text === "string" ? s.text : "",
      illustrationPrompt: typeof s?.illustrationPrompt === "string" ? s.illustrationPrompt : "",
    }));

  while (scenes.length < desired) {
    const i = scenes.length;
    scenes.push({ id: `scene-${i + 1}`, index: i + 1, title: `Scene ${i + 1}`, text: "", illustrationPrompt: "" });
  }

  return scenes as any;
}

async function openaiGenerateScenes(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline
): Promise<StoryScene[]> {
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const temperature =
    process.env.OPENAI_TEMPERATURE ? Number(process.env.OPENAI_TEMPERATURE) :
    process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) :
    0.7;

  const desired = typeof (settings as any)?.numScenes === "number" ? (settings as any).numScenes : 6;
  const user = buildUserPrompt(hero, reader, settings, outline);

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["scenes"],
    properties: {
      scenes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["id", "index", "title", "text", "illustrationPrompt"],
          properties: {
            id: { type: "string" },
            index: { type: "number" },
            title: { type: "string" },
            text: { type: "string" },
            illustrationPrompt: { type: "string" },
          },
        },
      },
    },
  };

  const data = await openaiJson<{ scenes: Array<{ id: string; index: number; title: string; text: string; illustrationPrompt: string }> }>({
    model,
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    maxOutputTokens: 2200,
    schemaName: "story_scenes",
    schema,
    input: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
  });

  const scenes = (Array.isArray(data?.scenes) ? data.scenes : [])
    .slice(0, desired)
    .map((s, i) => ({
      id: String((s as any)?.id ?? `scene-${i + 1}`),
      index: Number.isFinite(Number((s as any)?.index)) ? Number((s as any).index) : i + 1,
      title: typeof (s as any)?.title === "string" ? (s as any).title : `Scene ${i + 1}`,
      text: typeof (s as any)?.text === "string" ? (s as any).text : "",
      illustrationPrompt: typeof (s as any)?.illustrationPrompt === "string" ? (s as any).illustrationPrompt : "",
    }));

  while (scenes.length < desired) {
    const i = scenes.length;
    scenes.push({ id: `scene-${i + 1}`, index: i + 1, title: `Scene ${i + 1}`, text: "", illustrationPrompt: "" });
  }

  return scenes as any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessOut | ErrorOut>) {
  const reqId = randomUUID();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", message: "Method not allowed", reqId });
    }

    const b = req.body ?? {};
    const state = (b as any).state;

    const hero: HeroProfile = (b as any).hero ?? state?.hero;
    const reader: ReaderProfile = (b as any).reader ?? state?.reader;
    const settings: StorySettings = (b as any).settings ?? state?.settings;
    const outline: StoryOutline = (b as any).outline ?? state?.outline;

    if (!hero || !reader || !settings || !outline) {
      return res.status(400).json({
        error: "Missing required parameters (hero, reader, settings, outline).",
        message: "Missing required parameters (hero, reader, settings, outline).",
        reqId
      });
    }

    const provider = getProvider();

    if (provider === "local") {
      const scenes = await generateScenesLocal(hero, reader, settings, outline);
      return res.status(200).json({ scenes: (scenes as any).scenes ?? (scenes as any), reqId });
    }

    const scenes =
      provider === "openai"
        ? await openaiGenerateScenes(hero, reader, settings, outline)
        : await ollamaGenerateScenes(hero, reader, settings, outline);

    return res.status(200).json({ scenes, reqId });

  } catch (err: any) {
    console.error(`[generate-scenes ${reqId}] error:`, err);
    return res.status(500).json({
      error: err?.message || "Unknown error",
      message: err?.message || "Unknown error",
      reqId
    });
  }
}

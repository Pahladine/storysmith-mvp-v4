import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import type { HeroProfile, ReaderProfile, StorySettings, StoryOutline, StoryScene } from "../../lib/models/types";
import { regenerateScene as regenerateSceneLocal } from "../../lib/storyEngine";

type SuccessOut = { scene: StoryScene; reqId: string };
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

  return "Children's storybook illustration; warm, gentle, safe; painterly watercolor/gouache feel; soft lighting; clean shapes; cohesive character design across scenes; no on-image text; no watermarks; no scary/peril imagery; no weapons; no injuries.";
}

function extractResponseText(resp: any): string {
  // Some SDKs provide resp.output_text, but raw Responses API may not.
  if (typeof resp?.output_text === "string" && resp.output_text.trim()) return resp.output_text.trim();

  const out: string[] = [];
  const output = resp?.output;

  if (Array.isArray(output)) {
    for (const item of output) {
      if (!item) continue;

      // Case A: item is a message with content parts
      if (item?.type === "message") {
        const content = item?.content;

        if (Array.isArray(content)) {
          for (const c of content) {
            if (!c) continue;

            // Typical text content parts
            if ((c?.type === "output_text" || c?.type === "text") && typeof c?.text === "string" && c.text.trim()) {
              out.push(c.text);
              continue;
            }

            // JSON content parts
            if ((c?.type === "output_json" || c?.type === "json") && c?.json && typeof c.json === "object") {
              out.push(JSON.stringify(c.json));
              continue;
            }

            // Refusal content parts
            if (c?.type === "refusal" && typeof c?.refusal === "string" && c.refusal.trim()) {
              out.push(c.refusal);
              continue;
            }
          }
        } else if (typeof content === "string" && content.trim()) {
          out.push(content);
        }

        continue;
      }

      // Case B: item itself is a text-ish object
      if ((item?.type === "output_text" || item?.type === "text") && typeof item?.text === "string" && item.text.trim()) {
        out.push(item.text);
        continue;
      }

      // Case C: item itself contains JSON
      if ((item?.type === "output_json" || item?.type === "json") && item?.json && typeof item.json === "object") {
        out.push(JSON.stringify(item.json));
        continue;
      }
    }
  }

  return out.join("\n").trim();
}

function modelDisallowsTemperature(model: string): boolean {
  const m = String(model || "").toLowerCase().trim();
  // Conservative allowlist/heuristic: reasoning/thinking model families often reject temperature.
  // Add patterns as needed, but keep narrow.
  return (
    m.includes("o1") ||
    m.includes("o3") ||
    m.includes("gpt-5") ||
    m.includes("reasoning") ||
    m.includes("thinking")
  );
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

  if (modelDisallowsTemperature(args.model)) {

    delete (body as any).temperature;

  }

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
  if (!outputText) {
    const o = (envelope as any)?.output;
    const outputTypes = Array.isArray(o) ? o.map((i: any) => i?.type).filter(Boolean) : [];
    const contentTypes = Array.isArray(o)
      ? o.flatMap((i: any) => Array.isArray(i?.content) ? i.content.map((c: any) => c?.type).filter(Boolean) : [])
      : [];
    throw new Error(
      `OpenAI response missing output text. outputTypes=${outputTypes.join(",") || "(none)"} contentTypes=${contentTypes.join(",") || "(none)"}`
    );
  }

  try {
    return JSON.parse(outputText) as T;
  } catch {
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

    if (modelDisallowsTemperature(args.model)) {

      delete (body2 as any).temperature;

    }

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
    if (!outputText2) {
      const o2 = (envelope2 as any)?.output;
      const outputTypes2 = Array.isArray(o2) ? o2.map((i: any) => i?.type).filter(Boolean) : [];
      const contentTypes2 = Array.isArray(o2)
        ? o2.flatMap((i: any) => Array.isArray(i?.content) ? i.content.map((c: any) => c?.type).filter(Boolean) : [])
        : [];
      throw new Error(
        `OpenAI response missing output text (fallback). outputTypes=${outputTypes2.join(",") || "(none)"} contentTypes=${contentTypes2.join(",") || "(none)"}`
      );
    }return JSON.parse(outputText2) as T;
  }
}

const SYSTEM = [
  "You are StorySmith's Scene Polisher.",
  "Audience: children + a tired adult reader; warm, safe, non-scary, gently playful.",
  "QUALITY MANDATE: improve pacing (match rhythm to action) and clarity without changing core events.",
  "QUALITY MANDATE: include at least TWO sensory details and a simple emotional arc stated plainly.",
  "QUALITY MANDATE: preserve continuity with the outline summary; do not introduce new named characters.",
  "STYLE: warm, inviting, lightly theatrical, zero jargon, never condescending. No peril or scary imagery.",
  "Return ONLY valid JSON. No markdown. No extra text.",
].join("\n");

function buildUserPrompt(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline,
  sceneId: string,
  instructions: string
) {
  const heroName = normalizeText((hero as any).childName || (hero as any).name || "the hero");
  const readerLabel = normalizeText((reader as any).relationshipDescription || (reader as any).childName || "their favorite grown-up");
  const tone = normalizeText((settings as any).tone ?? (settings as any).vibe ?? "gentle");
  const place = normalizeText((settings as any).setting ?? (settings as any).place ?? "a cozy place");
  const schema = buildDesignSchema(settings);

  const refPhoto = hasImageData(hero) ? "yes (use it only as consistency guidance; do NOT mention it in the prompt)" : "no";
  const heroNotes = buildHeroVisualNotes(hero) || "(none provided)";

  const sceneIndexMatch = sceneId.split("-").pop() || "1";
  const outlineScene = ((outline as any).scenes || []).find((s: any) => String(s.id || "").endsWith(sceneIndexMatch));
  const originalSummary = outlineScene?.summary || "A fun moment in the story.";

  return [
    `Hero: ${heroName}`,
    `Reader label: ${readerLabel}`,
    `Tone: ${tone}`,
    `Place: ${place}`,
    `Reference photo provided: ${refPhoto}`,
    `Hero visual notes (best-effort): ${heroNotes}`,
    `Design schema (locked): ${schema}`,
    "",
    `Scene ID to rewrite: ${sceneId}`,
    `Original outline summary: ${originalSummary}`,
    "",
    "Instructions:",
    instructions || "(none)",
    "",
    "Rewrite the scene in a cozy, child-friendly way (150-250 words).",
    "Keep it consistent with the outline summary, but apply the instructions.",
    "STORYBOOK FORMAT: The rewritten scene text must follow this structure:",
    "1) Title line (max 7 words).",
    "2) Blank line, then 2 short paragraphs (2-4 sentences each).",
    "3) Blank line, then a gentle page-turn closing line that tees up what happens next.",
    "RULES: No bullet lists, no markdown headings, no extra sections.",
    "If this is Scene 2+, ensure the first sentence clearly connects from what happened just before.",
    "",
    "ILLUSTRATION PROMPT OUTPUT (professional, schema-driven):",
    "illustrationPrompt MUST be a SINGLE LINE using semicolon-separated labeled segments in this exact order:",
    "STYLE: ...; CHARACTERS: ...; SETTING: ...; ACTION: ...; COMPOSITION: ...; LIGHTING/COLOR: ...; MOOD: ...; CONSISTENCY: ...; NEGATIVE: ...",
    "Rules:",
    "- Use the locked design schema style.",
    "- Keep hero/companion physical features and outfits consistent across scenes.",
    "- No scary imagery, no weapons, no injuries, and NO written text in the image.",
    "- Do not include markdown, bullets, or quotes in illustrationPrompt.",
  ].join("\n");
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

  const user = buildUserPrompt(hero, reader, settings, outline, sceneId, instructions);

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

  const outlineSceneIndexMatch = sceneId.split("-").pop() || "1";
  const outlineScene = ((outline as any).scenes || []).find((s: any) => String(s.id || "").endsWith(outlineSceneIndexMatch));

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

async function openaiRegenerate(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline,
  sceneId: string,
  instructions: string
): Promise<StoryScene> {
    const primaryModel = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const fallbackModel = process.env.OPENAI_MODEL_FALLBACK?.trim() || "gpt-4o-mini";
  const temperature =
    process.env.OPENAI_TEMPERATURE ? Number(process.env.OPENAI_TEMPERATURE) :
    process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) :
    0.7;

  const user = buildUserPrompt(hero, reader, settings, outline, sceneId, instructions);

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["scene"],
    properties: {
      scene: {
        type: "object",
        additionalProperties: false,
        required: ["id", "index", "title", "summary", "text", "illustrationPrompt"],
        properties: {
          id: { type: "string" },
          index: { type: "number" },
          title: { type: "string" },
          summary: { type: "string" },
          text: { type: "string" },
          illustrationPrompt: { type: "string" },
        },
      },
    },
  };

    let data: { scene: StoryScene };

  try {
    data = await openaiJson<{ scene: StoryScene }>({
      model: primaryModel,
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    maxOutputTokens: 1400,
    schemaName: "regenerated_scene",
    schema,
    input: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    });
  } catch (err: any) {
    const msg = String(err?.message || "");
    const shouldFallback =
      primaryModel !== fallbackModel &&
      (
        msg.includes("OpenAI response missing output text") ||
        msg.includes("outputTypes=reasoning") ||
        msg.includes("Unsupported parameter: 'temperature'")
      );

    if (!shouldFallback) throw err;

    data = await openaiJson<{ scene: StoryScene }>({
      model: fallbackModel,
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    maxOutputTokens: 1400,
    schemaName: "regenerated_scene",
    schema,
    input: [
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ],
    });
  }const scene = (data as any)?.scene ?? {};
  return {
    id: String(scene?.id ?? sceneId),
    index: Number.isFinite(Number(scene?.index)) ? Number(scene.index) : 1,
    title: typeof scene?.title === "string" ? scene.title : "Rewritten Scene",
    summary: typeof scene?.summary === "string" ? scene.summary : "",
    text: typeof scene?.text === "string" ? scene.text : "",
    illustrationPrompt: typeof scene?.illustrationPrompt === "string" ? scene.illustrationPrompt : "",
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
      // Note: local engine does NOT accept freeform instructions; those are AI-provider-only.
      const scene = await regenerateSceneLocal(hero, reader, settings, outline, sceneId);
      return res.status(200).json({ scene, reqId });
    }

    const scene =
      provider === "openai"
        ? await openaiRegenerate(hero, reader, settings, outline, sceneId, instructions)
        : await ollamaRegenerate(reqId, hero, reader, settings, outline, sceneId, instructions);

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






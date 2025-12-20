import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { generateOutline } from "../../lib/storyEngine";

type Provider = "local" | "ollama" | "openai";

function getProvider(): Provider {
  const raw = String(process.env.AI_PROVIDER || "ollama").toLowerCase().trim();
  if (raw === "local") return "local";
  if (raw === "openai") return "openai";
  return "ollama";
}

function normalizeText(x: any) {
  return String(x ?? "").replace(/\s+/g, " ").trim();
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

function isReasoningModel(model: string): boolean {
  const m = String(model || "").toLowerCase().trim();
  // Reasoning-style model families often reject temperature/top_p in the Responses API.
  // We treat any "o*" model (o1/o3/o4/...) and "gpt-5*" as reasoning here.
  return m.startsWith("o") || m.startsWith("gpt-5");
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

  // Primary attempt: json_schema (strict)
  const body = {
    model: args.model,
    input: args.input,
    ...(isReasoningModel(args.model) ? {} : { temperature: args.temperature }),
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
    // Fallback: json_object mode (looser) on parse failures only
    const body2 = {
      model: args.model,
      input: [
        ...args.input,
        { role: "system" as const, content: "Return ONLY valid JSON. No markdown. No extra text." },
      ],
    ...(isReasoningModel(args.model) ? {} : { temperature: args.temperature }),
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
    try {
      return JSON.parse(outputText2) as T;
    } catch (e) {
      // Likely truncated/incomplete JSON; retry once with a larger output budget.
      const res3 = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
        },
        body: JSON.stringify({
          model: args.model,
          input: args.input,
          ...(isReasoningModel(args.model) ? {} : { temperature: args.temperature }),
          max_output_tokens: Math.max(args.maxOutputTokens, 3500),
          text: { format: { type: "json_object" } },
        }),
      });

      const rawText3 = await res3.text();
      if (!res3.ok) throw new Error(`OpenAI error ${res3.status}: ${rawText3.slice(0, 800)}`);

      let envelope3: any;
      try {
        envelope3 = JSON.parse(rawText3);
      } catch {
        throw new Error(`OpenAI returned non-JSON envelope (retry): ${rawText3.slice(0, 800)}`);
      }

      const outputText3 = extractResponseText(envelope3);
      if (!outputText3) throw new Error("OpenAI response missing output text (retry).");
      return JSON.parse(outputText3) as T;
    }
  }
}

async function createOpenAIOutline(
  hero: any,
  reader: any,
  settings: any
): Promise<{ scenes: { id: string; index: number; title: string; summary: string }[] }> {
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const temperature =
    process.env.OPENAI_TEMPERATURE ? Number(process.env.OPENAI_TEMPERATURE) :
    process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) :
    0.7;

  const numScenes =
    typeof settings?.numScenes === "number" ? settings.numScenes :
    typeof settings?.length === "number" ? settings.length :
    6;

  const heroName = normalizeText(hero?.childName || hero?.name || "the hero");
  const readerLabel = normalizeText(reader?.relationshipDescription || reader?.childName || reader?.label || "their favorite grown-up");
  const tone = normalizeText(settings?.tone || settings?.vibe || "gentle");
  const place = normalizeText(settings?.setting || settings?.place || "a cozy place");
  const idea = normalizeText(settings?.userIdea || "");

  const prompt = [
    `Hero name: ${heroName}`,
    `Reader label: ${readerLabel}`,
    `Setting: ${place}`,
    `Vibe: ${tone}`,
    idea ? `Idea: ${idea}` : "",
    "",
    `Number of scenes: ${numScenes}.`,
    "Write a simple outline. Each summary is 1–2 sentences. Child-friendly. Clear progression.",
  ].filter(Boolean).join("\n");

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
          required: ["index", "title", "summary"],
          properties: {
            index: { type: "number" },
            title: { type: "string" },
            summary: { type: "string" },
          },
        },
      },
    },
  };

  const data = await openaiJson<{ scenes: Array<{ index: number; title: string; summary: string }> }>({
    model,
    temperature: Number.isFinite(temperature) ? temperature : 0.7,
    maxOutputTokens: 2200,
    schemaName: "story_outline",
    schema,
    input: [
      {
        role: "system",
        content:
          "You generate short, child-friendly story outlines for StorySmith. Keep it warm, safe, and non-scary. Return ONLY valid JSON that matches the schema.",
      },
      { role: "user", content: prompt },
    ],
  });

  const target = Number(numScenes) || 6;

  const scenes = (Array.isArray(data?.scenes) ? data.scenes : [])
    .slice(0, target)
    .map((s, i) => ({
      id: `outline-${i + 1}`,
      index: Number.isFinite(Number((s as any)?.index)) ? Number((s as any).index) : i + 1,
      title: typeof (s as any)?.title === "string" ? (s as any).title : `Scene ${i + 1}`,
      summary: typeof (s as any)?.summary === "string" ? (s as any).summary : "",
    }));

  while (scenes.length < target) {
    const i = scenes.length;
    scenes.push({ id: `outline-${i + 1}`, index: i + 1, title: `Scene ${i + 1}`, summary: "" });
  }

  return { scenes };
}

async function createOllamaOutline(
  hero: any,
  reader: any,
  settings: any
): Promise<{ scenes: { id: string; index: number; title: string; summary: string }[] }> {
  const numScenes = typeof settings?.numScenes === "number" ? settings.numScenes : 6;

  const heroName = normalizeText(hero?.childName || hero?.name || "the hero");
  const readerLabel = normalizeText(reader?.relationshipDescription || reader?.childName || reader?.label || "their favorite grown-up");
  const place = normalizeText(settings?.setting || settings?.place || "a cozy place");
  const vibe = normalizeText(settings?.adventureType || settings?.vibe || "gentle");
  const idea = normalizeText(settings?.userIdea || "");

  const system = "You are StorySmith's Outline Generator. Return ONLY valid JSON. No markdown. No extra text.";

  const user = [
    `Hero name: ${heroName}`,
    `Reader label: ${readerLabel}`,
    `Setting: ${place}`,
    `Vibe: ${vibe}`,
    idea ? `Idea: ${idea}` : "",
    "",
    `Number of scenes: ${numScenes}.`,
    "Write a simple outline. Each summary is 1–2 sentences. Child-friendly. Clear progression.",
  ].filter(Boolean).join("\n");

  const baseUrl = (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/g, "");
  const model = process.env.OLLAMA_MODEL || "dolphin-llama3:latest";
  const temperature = process.env.OLLAMA_TEMPERATURE ? Number(process.env.OLLAMA_TEMPERATURE) : 0.7;

  const resp = await fetch(`${baseUrl}/api/chat`, {
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

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Ollama error ${resp.status}: ${text}`);
  }

  const json = await resp.json();
  const content = json?.message?.content;
  if (!content || typeof content !== "string") throw new Error("Ollama response missing message.content");

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Ollama returned non-JSON content (despite format=json)");
  }

  const scenes = (Array.isArray(parsed?.scenes) ? parsed.scenes : [])
    .slice(0, numScenes)
    .map((s: any, i: number) => ({
      id: `outline-${i + 1}`,
      index: Number.isFinite(Number(s?.index)) ? Number(s.index) : i + 1,
      title: typeof s?.title === "string" ? s.title : `Scene ${i + 1}`,
      summary: typeof s?.summary === "string" ? s.summary : "",
    }));

  while (scenes.length < numScenes) {
    const i = scenes.length;
    scenes.push({ id: `outline-${i + 1}`, index: i + 1, title: `Scene ${i + 1}`, summary: "" });
  }

  return { scenes };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const reqId = randomUUID();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", message: "Method not allowed", reqId });
    }

    const rawBody = (req as any).body ?? {};
    const body = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

    const hero = body?.hero ?? body?.state?.hero;
    const reader = body?.reader ?? body?.state?.reader;
    const settings = body?.settings ?? body?.state?.settings;

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
        ? await generateOutline(hero, reader, settings)
        : provider === "openai"
          ? await createOpenAIOutline(hero, reader, settings)
          : await createOllamaOutline(hero, reader, settings);

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



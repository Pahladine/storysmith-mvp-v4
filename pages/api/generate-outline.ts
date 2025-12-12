import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { generateOutline } from "../../lib/storyEngine";
import { HeroProfile, ReaderProfile, StorySettings } from "../../lib/models/types";

interface OutlineRequestBody {
  hero: HeroProfile;
  reader: ReaderProfile;
  settings: StorySettings;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const reqId = randomUUID();

  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed", message: "Method not allowed", reqId });
    }

    // Optional but recommended: fail loudly if no provider key is set
    if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error:
          "Missing AI provider key. Set OPENAI_API_KEY or GEMINI_API_KEY in .env.local and restart the dev server.",
        message:
          "Missing AI provider key. Set OPENAI_API_KEY or GEMINI_API_KEY in .env.local and restart the dev server.",
        reqId,
      });
    }

    // Helpful log (shows what the client is sending)
    console.log(
      `[generate-outline ${reqId}] body keys:`,
      Object.keys((req.body ?? {}) as Record<string, unknown>)
    );

    // Be tolerant if body arrives as a string (e.g., misconfigured client)
    const rawBody = req.body ?? {};
    const body =
      typeof rawBody === "string"
        ? (JSON.parse(rawBody) as Partial<OutlineRequestBody>)
        : (rawBody as Partial<OutlineRequestBody>);

    const { hero, reader, settings } = body ?? {};

    if (!hero || !reader || !settings) {
      return res.status(400).json({
        error: "Missing required parameters (hero, reader, settings).",
        message: "Missing required parameters (hero, reader, settings).",
        reqId,
      });
    }

    const outline = await generateOutline(hero, reader, settings);
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

import type { NextApiRequest, NextApiResponse } from "next";
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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as Partial<OutlineRequestBody>;
  const { hero, reader, settings } = body;

  if (!hero || !reader || !settings) {
    return res
      .status(400)
      .json({ message: "Missing required parameters (hero, reader, settings)." });
  }

  try {
    const outline = await generateOutline(hero, reader, settings);
    res.status(200).json({ outline });
  } catch (error) {
    console.error("Outline generation failed:", error);
    res.status(500).json({ message: "Failed to generate story outline." });
  }
}

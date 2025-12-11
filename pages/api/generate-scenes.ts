import type { NextApiRequest, NextApiResponse } from "next";
import { generateScenes } from "../../lib/storyEngine";
import {
  HeroProfile,
  ReaderProfile,
  StorySettings,
  StoryOutline,
} from "../../lib/models/types";

interface ScenesRequestBody {
  hero: HeroProfile;
  reader: ReaderProfile;
  settings: StorySettings;
  outline: StoryOutline;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as Partial<ScenesRequestBody>;
  const { hero, reader, settings, outline } = body;

  if (!hero || !reader || !settings || !outline) {
    return res.status(400).json({
      message: "Missing required parameters (hero, reader, settings, outline).",
    });
  }

  try {
    const scenes = await generateScenes(hero, reader, settings, outline);
    res.status(200).json({ scenes });
  } catch (error) {
    console.error("Scene generation failed:", error);
    res.status(500).json({ message: "Failed to generate story scenes." });
  }
}

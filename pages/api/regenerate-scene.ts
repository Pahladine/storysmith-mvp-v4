import type { NextApiRequest, NextApiResponse } from "next";
import { regenerateScene } from "../../lib/storyEngine";
import {
  HeroProfile,
  ReaderProfile,
  StorySettings,
  StoryOutline,
} from "../../lib/models/types";

interface RegenerateRequestBody {
  hero: HeroProfile;
  reader: ReaderProfile;
  settings: StorySettings;
  outline: StoryOutline;
  sceneId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const body = req.body as Partial<RegenerateRequestBody>;
  const { hero, reader, settings, outline, sceneId } = body;

  if (!hero || !reader || !settings || !outline || !sceneId) {
    return res
      .status(400)
      .json({ message: "Missing required parameters." });
  }

  try {
    const scene = await regenerateScene(hero, reader, settings, outline, sceneId);
    res.status(200).json({ scene });
  } catch (error) {
    console.error("Scene regeneration failed:", error);
    res.status(500).json({ message: "Failed to regenerate scene." });
  }
}

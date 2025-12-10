import type { NextApiRequest, NextApiResponse } from 'next';
import { storyEngine } from '../../lib/storyEngine';
import { HeroProfile, ReaderProfile, StorySettings, StoryOutline } from '../../lib/models/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: true, message: 'Method not allowed' });
  try {
    const { hero, reader, settings, outline } = req.body;
    if (!outline || !hero) return res.status(400).json({ error: true, message: 'Missing data.' });
    const scenes = await storyEngine.generateScenes(hero, reader, settings, outline);
    res.status(200).json({ scenes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: true, message: 'Failed to generate scenes.' });
  }
}

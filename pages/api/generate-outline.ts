import type { NextApiRequest, NextApiResponse } from 'next';
import { storyEngine } from '../../lib/storyEngine';
import { HeroProfile, ReaderProfile, StorySettings } from '../../lib/models/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: true, message: 'Method not allowed' });
  try {
    const { hero, reader, settings } = req.body;
    if (!hero || !settings) return res.status(400).json({ error: true, message: 'Missing parameters.' });
    const outline = await storyEngine.generateOutline(hero, reader, settings);
    res.status(200).json({ outline });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: true, message: 'Failed to generate outline.' });
  }
}

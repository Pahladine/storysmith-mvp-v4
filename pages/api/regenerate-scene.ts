import type { NextApiRequest, NextApiResponse } from 'next';
import { storyEngine } from '../../lib/storyEngine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: true, message: 'Method not allowed' });
  try {
    const { hero, reader, settings, outline, sceneId } = req.body;
    if (!sceneId || !outline) return res.status(400).json({ error: true, message: 'Missing data.' });
    const scene = await storyEngine.regenerateScene(hero, reader, settings, outline, sceneId);
    res.status(200).json({ scene });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: true, message: 'Failed to regenerate scene.' });
  }
}

import { HeroProfile, ReaderProfile, StorySettings, StoryOutline, StoryScene } from './models/types';

export class StoryEngine {
  private async simulateDelay(ms: number = 1500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateOutline(hero: HeroProfile, reader: ReaderProfile, settings: StorySettings): Promise<StoryOutline> {
    await this.simulateDelay();
    const settingName = settings.setting || "magical world";
    const heroName = hero.childName;

    return {
      scenes: [
        { id: 'scene-1', index: 1, title: 'The Adventure Begins', summary: `${heroName} discovers a strange path leading into the ${settingName}.` },
        { id: 'scene-2', index: 2, title: 'A Helpful Friend', summary: `${heroName} meets a character who needs help and shows ${hero.traits[0] || 'kindness'}.` },
        { id: 'scene-3', index: 3, title: 'The Way Home', summary: `After a fun journey, ${heroName} finds their way back to ${reader.childName}'s favorite reading spot.` },
      ]
    };
  }

  async generateScenes(hero: HeroProfile, reader: ReaderProfile, settings: StorySettings, outline: StoryOutline): Promise<StoryScene[]> {
    await this.simulateDelay(2500);
    return outline.scenes.map(s => ({
      id: s.id,
      index: s.index,
      title: s.title,
      summary: s.summary,
      text: `Once upon a time, ${hero.childName} was exploring the ${settings.setting || 'world'}. ${s.summary} It was a very ${settings.adventureType} day. The end.`,
      illustrationPrompt: `Children's book illustration: ${hero.childName} in a ${settings.setting}, style: ${settings.adventureType}`
    }));
  }

  async regenerateScene(hero: HeroProfile, reader: ReaderProfile, settings: StorySettings, outline: StoryOutline, sceneId: string): Promise<StoryScene> {
    await this.simulateDelay();
    const originalScene = outline.scenes.find(s => s.id === sceneId);
    return {
      id: sceneId,
      index: originalScene?.index || 0,
      title: originalScene?.title || "Remixed Scene",
      summary: originalScene?.summary || "",
      text: `(Regenerated) ${hero.childName} decided to try something different!`,
      illustrationPrompt: `Regenerated illustration for ${hero.childName}`
    };
  }
}
export const storyEngine = new StoryEngine();

import {
  StoryOutline,
  StoryScene,
  HeroProfile,
  ReaderProfile,
  StorySettings,
} from "./models/types";

// Derive the outline scene type from StoryOutline, no extra import needed
type OutlineScene = StoryOutline["scenes"][number];

// Simple utility to simulate network delay
const simulateDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const baseIllustrationPrompt = (heroName: string) =>
  `A cozy, high-quality children's book illustration, UPA mid-century style. Features the hero, ${heroName}, and the reader.`;

// Helper to get how we refer to the adult/reader in text
const getReaderLabel = (hero: HeroProfile, reader: ReaderProfile): string => {
  return (
    hero.readerName ||
    reader.relationshipDescription ||
    "the grown-up"
  );
};

/**
 * GENERATE OUTLINE LOGIC
 */
export async function generateOutline(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings
): Promise<StoryOutline> {
  await simulateDelay(1500); // Simulate API latency

  const heroName = hero.childName || "Your hero";
  const readerLabel = getReaderLabel(hero, reader);
  const setting = settings.setting || "a bright meadow";
  const vibe = settings.adventureType;
  const customIdea = settings.userIdea;

  let scenes: OutlineScene[] = [];

  if (settings.mode === "custom" && customIdea) {
    // --- CUSTOM MODE OUTLINE LOGIC ---
    const idea = customIdea.trim();
    const ideaShort =
      idea.length > 50 ? idea.substring(0, 50).trimEnd() + "..." : idea;

    scenes = [
      {
        id: "outline-1",
        index: 1,
        title: `A Big Idea`,
        summary: `${heroName} has a special idea: "${ideaShort}". Together with ${readerLabel}, they decide to turn it into a real adventure.`,
      },
      {
        id: "outline-2",
        index: 2,
        title: "The Trickiest Part",
        summary: `On the journey, ${heroName} and ${readerLabel} face the hardest part of the idea and must stay calm, kind, and clever.`,
      },
      {
        id: "outline-3",
        index: 3,
        title: "A Cozy Ending",
        summary: `They discover a happy way to finish the idea. Everyone feels proud, safe, and very close after the adventure.`,
      },
    ];
  } else {
    // --- GUIDED MODE OUTLINE LOGIC (Existing/Default-ish) ---
    scenes = [
      {
        id: "outline-1",
        index: 1,
        title: "The Curious Map",
        summary: `${heroName} and ${readerLabel} find a strange little map near ${setting}, leading them to a gentle mystery.`,
      },
      {
        id: "outline-2",
        index: 2,
        title: "A Tunnel and a Friend",
        summary: `Following the map, they crawl through a cozy tunnel and meet a helpful, slightly silly animal who needs a favor.`,
      },
      {
        id: "outline-3",
        index: 3,
        title: "The Cabin of Cookies",
        summary: `They solve the puzzle together, earn a small reward, and walk home feeling brave and peaceful.`,
      },
    ];
  }

  return { scenes };
}

/**
 * GENERATE SCENES LOGIC
 */
export async function generateScenes(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline
): Promise<StoryScene[]> {
  await simulateDelay(2500); // Simulate API latency

  const heroName = hero.childName || "your hero";
  const readerLabel = getReaderLabel(hero, reader);
  const customIdea = settings.userIdea;

  return outline.scenes.map((outlineScene) => {
    let textContent = "";
    let illustrationPrompt = baseIllustrationPrompt(heroName);

    if (settings.mode === "custom" && customIdea) {
      // --- CUSTOM MODE SCENE CONTENT ---
      switch (outlineScene.index) {
        case 1:
          textContent = `One morning, ${heroName} had a bright idea: "${customIdea}". It felt big and exciting. ${readerLabel} smiled and said, "That sounds wonderful. Let us see where this idea takes us." They packed a small bag and stepped into their new adventure.`;
          illustrationPrompt += ` ${heroName} and ${readerLabel} are in a cozy room, getting ready for an adventure inspired by the idea: ${customIdea}.`;
          break;
        case 2:
          textContent = `Soon, they reached the trickiest part of the idea. It felt a little bit hard, but ${heroName} remembered how ${hero.traits[0] || "brave"} they could be. With gentle encouragement from ${readerLabel}, they took a slow, careful step forward, then another. The hard part began to feel smaller and smaller.`;
          illustrationPrompt += ` ${heroName} and ${readerLabel} are gently facing a soft, friendly-looking challenge that represents the hardest part of the idea.`;
          break;
        case 3:
          textContent = `At last, they found a kind, peaceful way to finish the idea. "${customIdea}" had become a happy memory. ${heroName} and ${readerLabel} sat together, sharing a snack and a quiet hug. They talked about how proud they felt for trying something new and finishing it together.`;
          illustrationPrompt += ` ${heroName} and ${readerLabel} are sitting together, sharing a cozy moment after finishing their adventure. Warm, gentle lighting.`;
          break;
        default:
          textContent = `This scene is part of the custom story about "${customIdea}". ${heroName} and ${readerLabel} continue their gentle adventure together.`;
          illustrationPrompt += ` The scene shows ${heroName} and ${readerLabel} continuing their custom idea adventure.`;
      }
    } else {
      // --- GUIDED MODE SCENE CONTENT (Existing/Default-style) ---
      switch (outlineScene.index) {
        case 1:
          textContent = `${readerLabel} and ${heroName} found the map tucked inside a tiny bottle. "A map to a secret," said ${readerLabel}, "but we must be ${hero.traits[0] || "clever"}." The map showed a path leading into a shimmering forest, so they decided to follow it very carefully.`;
          illustrationPrompt += ` ${heroName} and ${readerLabel} are holding a small map and looking toward a shimmering forest.`;
          break;
        case 2:
          textContent = `The tunnel they found was short but dark. ${heroName} used a small light to see a fuzzy otter waiting on the other side. The otter had lost a favorite striped sock. ${heroName} was very ${hero.traits[1] || "kind"} and helped search under a big, flat rock until they found it. The otter thanked them with a happy wiggle.`;
          illustrationPrompt += ` ${heroName} hands a striped sock to a smiling otter near a small rock in the forest.`;
          break;
        case 3:
          textContent = `The otter showed them a tiny cabin where warm cookies were baking. The cookies were a sweet reward for being so helpful and brave. As the sun set, ${heroName} and ${readerLabel} snuggled up and talked about their day, feeling safe, cozy, and proud.`;
          illustrationPrompt += ` ${heroName} and ${readerLabel} are sitting on a comfy rug inside a wooden cabin, holding warm cookies.`;
          break;
        default:
          textContent = `${heroName} and ${readerLabel} shared a quiet moment, remembering everything they had done together on their adventure.`;
          illustrationPrompt += ` The scene shows ${heroName} and ${readerLabel} sharing a calm, reflective moment.`;
      }
    }

    return {
      id: outlineScene.id.replace("outline", "scene"),
      index: outlineScene.index,
      title: outlineScene.title,
      summary: outlineScene.summary,
      text: textContent,
      illustrationPrompt,
    };
  });
}

/**
 * REGENERATE SCENE LOGIC
 */
export async function regenerateScene(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline,
  sceneId: string
): Promise<StoryScene> {
  await simulateDelay(1500); // Simulate API latency

  const heroName = hero.childName || "your hero";
  const readerLabel = getReaderLabel(hero, reader);
  const customIdea = settings.userIdea;

  // Map `scene-1` -> `outline-1` to find base scene
  const outlineSceneId = sceneId.replace("scene", "outline");
  const outlineScene =
    outline.scenes.find((s) => s.id === outlineSceneId) || outline.scenes[0];

  const originalSummary =
    outlineScene?.summary || "A fun moment in the story.";
  const index = outlineScene?.index || 1;

  let rewrittenText = "";

  if (settings.mode === "custom" && customIdea) {
    // --- CUSTOM MODE REGENERATE LOGIC ---
    rewrittenText = `${heroName} and ${readerLabel} decided to try the idea "${customIdea}" in a slightly different way. They talked softly, changed one small thing, and suddenly the moment felt even more special. It was still the same story, but now it felt even more theirs.`;
  } else {
    // --- GUIDED MODE REGENERATE LOGIC ---
    rewrittenText = `This part of the adventure changed just a little. ${heroName} showed even more ${hero.traits[0] || "bravery"}, which helped ${readerLabel} feel calm and safe. Together, they found a gentle way to solve the moment from the chapter that said: "${originalSummary}".`;
  }

  return {
    id: sceneId,
    index,
    title: `[Rewritten] ${outlineScene?.title || "New Scene"}`,
    summary: outlineScene?.summary || "A refreshed chapter summary.",
    text: rewrittenText,
    illustrationPrompt:
      baseIllustrationPrompt(heroName) +
      " The illustration should match the updated, gentle version of this scene.",
  };
}

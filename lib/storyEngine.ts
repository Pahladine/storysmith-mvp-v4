import {
  StoryOutline,
  StoryScene,
  HeroProfile,
  ReaderProfile,
  StorySettings,
  StoryOutlineScene,
} from "./models/types";

// Simple utility to simulate network delay
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- PRIVATE HELPER: NAME AND LABEL DERIVATION ---

const getSafeHeroName = (hero: HeroProfile) =>
  hero.childName && hero.childName.trim().length > 0 ? hero.childName.trim() : "the child hero";

const getSafeReaderLabel = (reader: ReaderProfile) =>
  reader.relationshipDescription && reader.relationshipDescription.trim().length > 0
    ? reader.relationshipDescription.trim()
    : "their favorite grown-up";

// --- PRIVATE HELPER: ILLUSTRATION PROMPT BUILDER ---

/**
 * Builds a structured, consistent illustration prompt based on scene and state.
 * This function is fixed to avoid placeholder bugs and use safe names/labels.
 */
function buildIllustrationPrompt(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  scene: { title: string; summary: string; index: number },
): string {
  const heroName = getSafeHeroName(hero);
  const readerLabel = getSafeReaderLabel(reader);

  // 1. Art style & camera language (constant core)
  const styleBlock =
    "children's storybook illustration, soft watercolor style, warm colors, clean outlines, soft lighting, 3/4 view, medium shot.";

  // 2. Base hero description
  let heroTypePhrase: string;
  switch (hero.heroType) {
    case "human":
      heroTypePhrase = "a young child hero";
      break;
    case "animal":
      heroTypePhrase = "a cute animal hero";
      break;
    case "fantasy":
      heroTypePhrase = "a whimsical fantasy hero";
      break;
    default:
      heroTypePhrase = "a young child hero";
  }

  let heroDescription = heroTypePhrase;
  if (hero.traits.length > 0) {
    const traits = hero.traits.slice(0, 2).join(" and ");
    heroDescription += ` who is ${traits}`;
  }

  // 3. Setting phrase from settings.setting
  let settingPhrase: string;
  switch (settings.setting) {
    case "forest":
      settingPhrase = "in a cozy magical forest clearing";
      break;
    case "space":
      settingPhrase = "floating in a friendly outer space scene with stars and planets";
      break;
    case "underwater":
      settingPhrase = "in a gentle underwater world with fish and soft light";
      break;
    case "garden":
      settingPhrase = "in a sunny backyard garden";
      break;
    case "castle":
      settingPhrase = "near a friendly storybook castle";
      break;
    default:
      settingPhrase = "in a warm, child-friendly setting";
  }

  // 4. Vibe → visual mood
  let moodPhrase: string;
  switch (settings.adventureType) {
    case "cozy":
      moodPhrase = "soft, cozy mood, bedtime atmosphere";
      break;
    case "silly":
      moodPhrase = "playful, silly mood with light humor";
      break;
    case "brave":
      moodPhrase = "gentle adventure mood with a hint of courage";
      break;
    case "mystery":
      moodPhrase = "soft mystery mood, gentle curiosity, not scary";
      break;
    default:
      moodPhrase = "gentle, friendly mood";
  }

  // 5. Scene-specific focus (Use the summary to describe the action)
  const actionFocus = scene.summary
    ? `The scene shows ${heroName} and ${readerLabel} during the event: ${scene.summary}.`
    : `The scene shows ${heroName} and ${readerLabel} having a fun moment.`;

  // 6. Custom vs guided
  let customIdeaHint = "";
  if (settings.mode === "custom" && settings.userIdea) {
    const ideaShort =
      settings.userIdea.length > 80 ? settings.userIdea.substring(0, 80) + "..." : settings.userIdea;
    customIdeaHint = ` The image should clearly relate to the custom idea: ${ideaShort}.`;
  }

  // Combine all parts into a coherent prompt sentence
  return [
    styleBlock,
    `Features the hero, ${heroName} (${heroDescription}), and ${readerLabel} ${settingPhrase}.`,
    `The mood is: ${moodPhrase}.`,
    actionFocus,
    customIdeaHint,
  ]
    .filter((p) => p.trim() !== "")
    .join(" ");
}

/**
 * GENERATE OUTLINE LOGIC
 */
export async function generateOutline(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
): Promise<StoryOutline> {
  await simulateDelay(1500);

  const heroName = getSafeHeroName(hero);
  const readerName = getSafeReaderLabel(reader);
  const setting = settings.setting || "a bright meadow";
  const vibe = settings.adventureType;

  let scenes: StoryOutlineScene[] = [];

  if (settings.mode === "custom" && settings.userIdea) {
    // --- CUSTOM MODE OUTLINE LOGIC ---
    const idea = settings.userIdea;
    const ideaShort = idea.length > 50 ? idea.substring(0, 50) + "..." : idea;

    scenes = [
      {
        id: "outline-1",
        index: 1,
        title: `Starting the Quest for ${ideaShort}`,
        summary: `${heroName} wakes up and realizes they must set out on an adventure inspired by the idea: "${idea}".`,
      },
      {
        id: "outline-2",
        index: 2,
        title: "The Main Challenge",
        summary: `On the journey, ${heroName} faces a complication or puzzle related to the idea, requiring help from ${readerName}.`,
      },
      {
        id: "outline-3",
        index: 3,
        title: "Joyful Discovery and Resolution",
        summary: `The challenge is solved! ${heroName} finds success and a cozy, happy ending back at home, remembering the great journey.`,
      },
    ];
  } else {
    // --- GUIDED MODE OUTLINE LOGIC ---
    scenes = [
      {
        id: "outline-1",
        index: 1,
        title: `Meeting the Mystery of the Lost ${vibe}`,
        summary: `${heroName} and ${readerName} find a strange map near ${setting}, leading them to a small, friendly puzzle.`,
      },
      {
        id: "outline-2",
        index: 2,
        title: "A Hidden Tunnel and a Friend",
        summary: `Following the map, they crawl through a cozy tunnel and meet a helpful, slightly silly animal who needs a favor.`,
      },
      {
        id: "outline-3",
        index: 3,
        title: "The Treasure of the Cozy Cabin",
        summary: `They solve the puzzle together, earn a cozy reward (like warm milk or cookies), and settle in to talk about their brave day.`,
      },
    ];
  }

  return { scenes };
}

/**
 * GENERATE SCENES LOGIC (Uses fixed buildIllustrationPrompt)
 */
export async function generateScenes(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline,
): Promise<StoryScene[]> {
  await simulateDelay(2500);

  const heroName = getSafeHeroName(hero);
  const readerName = getSafeReaderLabel(reader);
  const customIdea = settings.userIdea;

  return outline.scenes.map((outlineScene) => {
    let textContent = "";

    if (settings.mode === "custom" && customIdea) {
      // --- CUSTOM MODE SCENE CONTENT ---
      switch (outlineScene.index) {
        case 1:
          textContent = `One morning, ${heroName} had a brilliant idea: "${customIdea}!" It was a big, bold adventure, much bigger than anything ${readerName} had planned for the day. ${readerName} smiled and said, "A fine idea! Where shall we begin this amazing quest?" They packed a small bag and set off right away.`;
          break;
        case 2:
          textContent = `The adventure led them to a bumpy road. They needed to cross a wobbly bridge (which might be the biggest hurdle in ${customIdea}). ${heroName} remembered a key trait—${hero.traits[0] || "courage"}—and gently crossed the bridge. ${readerName} cheered proudly. "That's the way to do it!"`;
          break;
        case 3:
          textContent = `Finally, they reached the end of their quest. What a success! The big idea, "${customIdea}", was now a happy memory. They decided to sit down and share a snack, feeling cozy and content after their big, brave journey. ${readerName} gave ${heroName} a great big hug.`;
          break;
        default:
          textContent = `This scene is part of the custom story about ${customIdea}. ${heroName} continued their adventure with ${readerName}.`;
      }
    } else {
      // --- GUIDED MODE SCENE CONTENT ---
      switch (outlineScene.index) {
        case 1:
          textContent = `${readerName} and ${heroName} found the map stuck inside a bottle rolling by. "A map to a secret," said ${readerName}, "but we must be ${hero.traits[0] || "clever"}!" The map showed a path leading straight into a shimmering forest. They decided to follow the arrows very carefully.`;
          break;
        case 2:
          textContent = `The tunnel was short, but dark! ${heroName} used their flashlight to see a fuzzy otter waiting on the other side. The otter had lost his favorite striped sock. ${heroName} was very ${hero.traits[1] || "kind"} and helped the otter find the sock under a big, flat rock. The otter thanked them with a wiggle!`;
          break;
        case 3:
          textContent = `The otter showed them the way to a tiny cabin where warm cookies were baking! The cookies were their reward for being so helpful and brave. As the sun set, ${heroName} and ${readerName} snuggled up and read a book, happy to be home after their cozy adventure.`;
          break;
        default:
          textContent = `${heroName} and ${readerName} have a quiet moment of reflection on their adventure.`;
      }
    }

    // Centralized and FIXED Illustration Prompt Generation
    const illustrationPrompt = buildIllustrationPrompt(hero, reader, settings, outlineScene);

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
 * REGENERATE SCENE LOGIC (Uses fixed buildIllustrationPrompt)
 */
export async function regenerateScene(
  hero: HeroProfile,
  reader: ReaderProfile,
  settings: StorySettings,
  outline: StoryOutline,
  sceneId: string,
): Promise<StoryScene> {
  await simulateDelay(1500);

  // Find the original outline scene summary to base the rewrite on
  const sceneIndexMatch = sceneId.split("-").pop()!;
  const outlineScene = outline.scenes.find((s) => s.id.endsWith(sceneIndexMatch));

  const originalSummary = outlineScene ? outlineScene.summary : "A fun moment in the story.";
  const heroName = getSafeHeroName(hero);
  const readerLabel = getSafeReaderLabel(reader);
  const customIdea = settings.userIdea;
  const index = outlineScene?.index || 1;

  let rewrittenText = "";

  if (settings.mode === "custom" && customIdea) {
    // CUSTOM MODE REGENERATE LOGIC
    rewrittenText = `This scene was rewritten to focus more on your unique idea: "${customIdea}". In this new version, ${heroName} and ${readerLabel} found an even better way to solve the puzzle, using their imagination. The moment felt extra special, because it was their own idea.`;
  } else {
    // GUIDED MODE REGENERATE LOGIC
    rewrittenText = `This scene has been slightly changed for you! It is a bit more focused on ${heroName}'s ${
      hero.traits[0] || "bravery"
    }. ${heroName} did a very clever thing that helped ${readerLabel} solve the mystery mentioned in the summary: "${originalSummary}".`;
  }

  const sceneContext =
    outlineScene || { title: "Rewritten Scene", summary: rewrittenText, index };

  const illustrationPrompt = buildIllustrationPrompt(hero, reader, settings, sceneContext);

  return {
    id: sceneId,
    index,
    title: `[Rewritten] ${outlineScene?.title || "New Scene"}`,
    summary: outlineScene?.summary || "A refreshed chapter summary.",
    text: rewrittenText,
    illustrationPrompt,
  };
}

// --- CLASS WRAPPER TO PRESERVE EXISTING API USAGE ---

export class StoryEngine {
  async generateOutline(hero: HeroProfile, reader: ReaderProfile, settings: StorySettings): Promise<StoryOutline> {
    return generateOutline(hero, reader, settings);
  }

  async generateScenes(
    hero: HeroProfile,
    reader: ReaderProfile,
    settings: StorySettings,
    outline: StoryOutline,
  ): Promise<StoryScene[]> {
    return generateScenes(hero, reader, settings, outline);
  }

  async regenerateScene(
    hero: HeroProfile,
    reader: ReaderProfile,
    settings: StorySettings,
    outline: StoryOutline,
    sceneId: string,
  ): Promise<StoryScene> {
    return regenerateScene(hero, reader, settings, outline, sceneId);
  }
}

export const storyEngine = new StoryEngine();

import {
  StoryState,
  SessionState,
  StoryScene,
  SceneData,
  CharacterBlock,
  StoryBlueprintBlock,
  StoryVibe,
} from "../models/types";

// Helper to determine genre based on vibe
const mapVibeToGenre = (vibe: StoryVibe): StoryBlueprintBlock['genre'] => {
  switch (vibe) {
    case "mystery":
      return "sci-fi"; // Using sci-fi for mystery/suspense theme
    case "brave":
      return "adventure";
    case "cozy":
      return "fantasy"; // Using fantasy broadly for imaginative/cozy
    case "silly":
      return "fantasy";
    default:
      return "adventure";
  }
};

// Simple placeholder image URL
const PLACEHOLDER_IMAGE = "https://placehold.co/1080x720/6366F1/FFFFFF?text=StorySmith+Illustration+Placeholder";

/**
 * Builds a complete Golden Master-style SessionState object from the current MVP StoryState.
 */
export function buildSessionFromStoryState(state: StoryState): SessionState {
  const timestamp = Date.now();
  const heroName = state.hero.childName || "Mystery Hero";
  const readerDesc = state.reader.relationshipDescription || "StorySmith Creator";
  const adventureVibe = state.settings.adventureType || "cozy";
  const userIdeaKeywords = state.settings.mode === 'custom' && state.settings.userIdea
    ? state.settings.userIdea.split(' ').slice(0, 3).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase()).filter(w => w.length > 2)
    : [];
    
  // --- 1. CharacterBlock ---
  const characterBlock: CharacterBlock = {
    hero_name: heroName,
    hero_style: "cartoon",
    reader_name: state.reader.childName,
    reader_age: state.reader.childAge || 0,
    // hero_image_id remains undefined
  };

  // --- 2. StoryBlueprintBlock ---
  const storyBlueprintBlock: StoryBlueprintBlock = {
    act_structure: "three_act",
    genre: mapVibeToGenre(adventureVibe),
    keywords: [
      adventureVibe,
      state.settings.setting || 'general',
      state.settings.mode,
      ...userIdeaKeywords,
    ].filter((v, i, a) => a.indexOf(v) === i), // Unique keywords
  };

  // --- 3. SceneJSON_array ---
  const sceneDataArray: SceneData[] = state.scenes.map((scene: StoryScene) => ({
    scene_id: scene.index, 
    title: scene.title,
    text: scene.text,
    image_url: PLACEHOLDER_IMAGE, // Placeholder image URL for now
  }));

  return {
    // --- Metadata ---
    metadata: {
      version: state.engineVersion || "storysmith-mvp-v1",
      created_at: timestamp,
      last_modified: timestamp,
      app_environment: "dev",
    },

    // --- User Info ---
    user_info: {
      author_name: readerDesc,
    },

    // --- Story Data ---
    story_data: {
      story_title: `${heroName}'s ${adventureVibe} Adventure`,
      tagline: `A ${adventureVibe} story about ${heroName} and ${readerDesc}.`,
      placeholder_image: PLACEHOLDER_IMAGE,
    },

    // --- Story Content Block ---
    story_content: {
      Cover: {
        image_url: PLACEHOLDER_IMAGE,
      },
      SceneJSON_array: sceneDataArray,
      CharacterBlock: characterBlock,
      StoryBlueprintBlock: storyBlueprintBlock,
      AssetsManifest: {
        image_assets: {}, // Empty for MVP
      },
    },
    
    // NOTE: We don't overwrite state.session here, just return the constructed object.
  };
}

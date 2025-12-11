/**
 * Core StorySmith data models and StoryState.
 * This file defines both the MVP types (HeroProfile, ReaderProfile, StorySettings, etc.)
 * and the richer SessionState used for future Golden Master compatibility.
 */

//
// 1. MVP TYPES (current app uses these)
//

export type HeroProfile = {
  childName: string;
  /** Optional name of the adult reader, e.g. "Grandpa Adam" */
  readerName?: string;
  ageBracket: "3-5" | "6-8" | "9-11";
  heroType: "human" | "animal" | "fantasy";
  traits: string[];              // ["brave", "curious"]
};

export type ReaderProfile = {
  /** Name of the child being read to (can mirror hero or be different) */
  childName: string;
  childAge: number;
  /** e.g. "Grandpa & Noah" or "Mom & Ayla" */
  relationshipDescription: string;
};

export type StoryVibe = "cozy" | "silly" | "brave" | "mystery";
export type StoryLength = "short" | "medium";

export type StorySettingKey =
  | "forest"
  | "space"
  | "underwater"
  | "garden"
  | "castle";

export type StoryMode = "guided" | "custom";

export type StorySettings = {
  adventureType: StoryVibe;
  length: StoryLength;
  /** Overall tone knob for later use (currently always "gentle" for MVP) */
  tone: "gentle" | "playful" | "exciting";
  /** High-level setting key, if chosen */
  setting?: StorySettingKey;
  /** Whether the user followed the guided flow or brought their own idea */
  mode: StoryMode;
  /** Optional free-text idea when mode === "custom" */
  userIdea?: string;
};

export type StoryOutlineScene = {
  id: string;
  index: number;
  title: string;
  summary: string;
};

export type StoryOutline = {
  scenes: StoryOutlineScene[];
};

export type StoryScene = {
  id: string;
  index: number;
  title: string;
  summary: string;
  text: string;
  /** Text prompt for the illustration engine */
  illustrationPrompt: string;
};

//
// 2. STORY STATE (MVP) + GOLDEN MASTER FIELDS
//

/**
 * MVP StoryState used across the app right now.
 * We extend it (add fields) but do NOT remove or change existing fields.
 */
export interface StoryState {
  hero: HeroProfile;
  reader: ReaderProfile;
  settings: StorySettings;
  outline: StoryOutline | null;
  scenes: StoryScene[];

  //
  // New meta fields for long-term robustness
  //
  storyId: string;           // ID for the specific story
  sessionId: string;         // ID for this creation session
  engineVersion: string;     // e.g. "storysmith-gemini-v1"
  promptPackVersion: string; // e.g. "GoldenMaster-1.2"

  //
  // Optional richer session container (Golden Master compatibility).
  // Not required for MVP but available for advanced flows.
  //
  session?: SessionState;
}

//
// 3. GOLDEN MASTER / SESSION STATE TYPES (additive)
//   These are designed to roughly match your Golden Master & V4 prompt packs.
//

/** Basic user info for the session (author / buyer / project owner). */
export type UserInfo = {
  author_name: string;
  // Extendable later with email, locale, etc.
};

/** High-level story metadata (title, tagline, cover placeholder). */
export type StoryData = {
  story_title: string;
  tagline: string;
  placeholder_image: string;
};

/** Scene payload used inside the richer SessionState. */
export type SceneData = {
  scene_id: number;
  title: string;
  image_url: string;
  text: string;
};

/** Cover page data for the richer session. */
export type CoverData = {
  image_url: string;
};

/**
 * CharacterBlock: richer character/reader descriptor.
 * This is intentionally simple for now and can be expanded later.
 */
export type CharacterBlock = {
  hero_name: string;
  hero_style: "cartoon" | "realistic";
  hero_image_id?: string;
  reader_name: string;
  reader_age: number;
};

/** Higher-level blueprint: acts, genre, key themes/keywords. */
export type StoryBlueprintBlock = {
  act_structure: "three_act" | "hero_journey";
  genre: "fantasy" | "sci-fi" | "adventure";
  keywords: string[];
};

/** Asset manifest for images, etc. */
export type AssetsManifest = {
  image_assets: { [key: string]: string }; // e.g., { "cover_id": "https://..." }
};

/** Structured story content for Golden Master compatibility. */
export type StoryContentBlock = {
  Cover: CoverData;
  SceneJSON_array: SceneData[];
  CharacterBlock: CharacterBlock;
  StoryBlueprintBlock: StoryBlueprintBlock;
  AssetsManifest: AssetsManifest;
};

/** Global metadata for a session. */
export type StoryMetadata = {
  version: string;
  created_at: number;      // unix timestamp
  last_modified: number;   // unix timestamp
  app_environment: "dev" | "staging" | "prod";
};

/**
 * Top-level Golden Master style session state.
 * This can gradually be filled from the MVP StoryState.
 */
export type SessionState = {
  metadata: StoryMetadata;
  user_info: UserInfo;
  story_data: StoryData;
  story_content: StoryContentBlock;
};

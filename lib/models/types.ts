export type HeroProfile = {
  childName: string;
  readerName?: string;           // e.g., "Grandpa Adam"
  ageBracket: "3-5" | "6-8" | "9-11";
  heroType: "human" | "animal" | "fantasy";
  traits: string[];              // ["brave", "curious"]
};

export type ReaderProfile = {
  childName: string;
  childAge: number;
  relationshipDescription: string; // "Grandma & Noah", "Grandpa & Ayla"
};

export type StorySettings = {
  adventureType: "cozy" | "silly" | "brave" | "mystery";
  length: "short" | "medium";
  favoritePlace?: string;
  favoriteFriend?: string;
  extraDetails?: string;
  setting?: string;              // e.g. "forest", "space"
  tone?: "gentle" | "exciting" | "funny";
};

export type StoryScene = {
  id: string;
  index: number;
  title: string;
  summary?: string;              // used in outline
  text: string;
  illustrationPrompt?: string;
};

export type StoryOutline = {
  scenes: {
    id: string;
    index: number;
    title: string;
    summary: string;
  }[];
};

export type StoryState = {
  hero: HeroProfile;
  reader: ReaderProfile;
  settings: StorySettings;
  outline: StoryOutline | null;
  scenes: StoryScene[];
};

export type AssetBundle = {
  story: StoryState;
  layoutVariant: "simple-v1";
  exportHtml: string;        // final HTML for reading/printing
  exportPdfUrl?: string;     // if using external service or pre-generated PDF
};

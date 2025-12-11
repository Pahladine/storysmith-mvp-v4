import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  StoryState,
  HeroProfile,
  ReaderProfile,
  StorySettings,
  StoryOutline,
  StoryScene,
  SessionState,
  CharacterBlock,
  SceneData, // Import SceneData for synchronization
} from "../models/types";

// NOTE: In a complete application, this would import from a separate utility file.
// For patching purposes, we'll embed the necessary conversion logic (simplified).
// We assume a converter exists: import { convertMvpScenesToGmSceneDataArray } from "../utils/converter";

/**
 * Creates a CharacterBlock from the MVP Hero and Reader Profiles.
 */
const createCharacterBlockFromMvp = (hero: HeroProfile, reader: ReaderProfile): CharacterBlock => ({
  hero_name: hero.childName,
  hero_style: 'cartoon', // Default until style selection is added to MVP
  reader_name: reader.childName,
  reader_age: reader.childAge,
});

/**
 * Converts an array of StoryScene (MVP) objects to an array of SceneData (GM) objects.
 * NOTE: This is a minimal, placeholder converter.
 */
const convertMvpScenesToGmSceneDataArray = (scenes: StoryScene[]): SceneData[] => {
    return scenes.map((scene) => ({
        scene_id: scene.index, // Using index as scene_id
        title: scene.title,
        text: scene.text,
        image_url: 'PENDING_IMAGE_URL', // Placeholder as MVP Scene doesn't store this yet
    }));
};

//
// Utility to generate simple IDs (good enough for client-side story/session IDs).
//
const generateId = (): string => {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
};

//
// Default state factory so we can re-use for reset & initial load.
//
const createDefaultState = (): StoryState => ({
  hero: {
    childName: "",
    ageBracket: "3-5",
    heroType: "human",
    traits: [],
  },
  reader: {
    childName: "",
    childAge: 0,
    relationshipDescription: "",
  },
  settings: {
    adventureType: "cozy",
    length: "short",
    tone: "gentle",
    mode: "guided",
    userIdea: undefined,
    setting: undefined,
  },
  outline: null,
  scenes: [],

  // New meta fields
  storyId: generateId(),
  sessionId: generateId(),
  engineVersion: "storysmith-mvp-v1",
  promptPackVersion: "GoldenMaster-1.2",

  // Optional richer session container (unused by MVP for now)
  session: undefined,
});

const STORAGE_KEY = "storysmith_state";

interface StoryContextType {
  state: StoryState;
  setHero: (hero: HeroProfile) => void;
  setReader: (reader: ReaderProfile) => void;
  setSettings: (settings: StorySettings) => void;
  setOutline: (outline: StoryOutline | null) => void;
  setScenes: (scenes: StoryScene[]) => void;
  updateScene: (scene: StoryScene) => void;
  resetStory: () => void;
  setSession: (session: SessionState) => void; // new, for Golden Master compatibility later
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<StoryState>(createDefaultState);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<StoryState>;

        // Merge stored state with defaults so new fields always exist
        const merged: StoryState = {
          ...createDefaultState(),
          ...parsed,
          hero: {
            ...createDefaultState().hero,
            ...(parsed.hero || {}),
          },
          reader: {
            ...createDefaultState().reader,
            ...(parsed.reader || {}),
          },
          settings: {
            ...createDefaultState().settings,
            ...(parsed.settings || {}),
          },
          outline: parsed.outline ?? null,
          scenes: parsed.scenes ?? [],
          storyId: parsed.storyId ?? generateId(),
          sessionId: parsed.sessionId ?? generateId(),
          engineVersion: parsed.engineVersion ?? "storysmith-mvp-v1",
          promptPackVersion: parsed.promptPackVersion ?? "GoldenMaster-1.2",
          session: parsed.session,
        };

        setState(merged);
      }
    } catch (e) {
      console.error("Failed to load StorySmith state from storage", e);
    }
  }, []);

  // Persist to sessionStorage on every change
  useEffect(() => {
    try {
      const toStore: StoryState = {
        ...state,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (e) {
      console.warn("Failed to persist StorySmith state to storage", e);
    }
  }, [state]);

  const setHero = (hero: HeroProfile) => {
    setState((prev) => {
      const nextState: StoryState = {
        ...prev,
        hero,
      };

      // 1. Sync HeroProfile change to CharacterBlock in SessionState
      if (nextState.session) {
        const newCharacterBlock = createCharacterBlockFromMvp(hero, nextState.reader);
        nextState.session = {
          ...nextState.session,
          story_content: {
            ...nextState.session.story_content,
            CharacterBlock: newCharacterBlock,
          },
        };
      }
      return nextState;
    });
  };

  const setReader = (reader: ReaderProfile) => {
    setState((prev) => {
      const nextState: StoryState = {
        ...prev,
        reader,
      };

      // 1. Sync ReaderProfile change to CharacterBlock in SessionState
      if (nextState.session) {
        const newCharacterBlock = createCharacterBlockFromMvp(nextState.hero, reader);
        nextState.session = {
          ...nextState.session,
          story_content: {
            ...nextState.session.story_content,
            CharacterBlock: newCharacterBlock,
          },
        };
      }
      return nextState;
    });
  };

  const setSettings = (settings: StorySettings) => {
    setState((prev) => ({
      ...prev,
      settings,
      // NOTE: Settings currently do not map to SessionState fields, so no sync logic here yet.
    }));
  };

  const setOutline = (outline: StoryOutline | null) => {
    setState((prev) => ({
      ...prev,
      outline,
      // NOTE: StoryOutline maps to StoryBlueprintBlock (a more complex structure),
      // which we will sync later as part of the /build flow. No sync here for now.
    }));
  };

  const setScenes = (scenes: StoryScene[]) => {
    setState((prev) => {
      const nextState: StoryState = {
        ...prev,
        scenes,
      };

      // 1. Sync the full scenes array to SceneJSON_array in SessionState
      if (nextState.session) {
        const newSceneDataArray = convertMvpScenesToGmSceneDataArray(scenes);
        nextState.session = {
          ...nextState.session,
          story_content: {
            ...nextState.session.story_content,
            SceneJSON_array: newSceneDataArray,
          },
        };
      }
      return nextState;
    });
  };

  const updateScene = (scene: StoryScene) => {
    setState((prev) => {
      const updatedScenes = prev.scenes.map((s) =>
        s.id === scene.id ? scene : s
      );

      const nextState: StoryState = {
        ...prev,
        scenes: updatedScenes,
      };

      // 1. Sync the scenes array to SceneJSON_array in SessionState
      if (nextState.session) {
        const newSceneDataArray = convertMvpScenesToGmSceneDataArray(updatedScenes);
        nextState.session = {
          ...nextState.session,
          story_content: {
            ...nextState.session.story_content,
            SceneJSON_array: newSceneDataArray,
          },
        };
      }
      return nextState;
    });
  };

  const resetStory = () => {
    const fresh = createDefaultState();
    setState(fresh);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const setSession = (session: SessionState) => {
    setState((prev) => ({
      ...prev,
      session,
      // NOTE: We do not sync the legacy fields (hero/reader) back here,
      // as setSession will typically be called when loading a GM file,
      // and the MVP app relies on the existing hero/reader fields for UI,
      // which should be handled by a separate synchronization/mapping utility
      // if they need to be loaded from the GM session. For now, we just set the GM object.
    }));
  };

  const value: StoryContextType = {
    state,
    setHero,
    setReader,
    setSettings,
    setOutline,
    setScenes,
    updateScene,
    resetStory,
    setSession,
  };

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStoryState = () => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error("useStoryState must be used within a StoryProvider");
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoryState, HeroProfile, ReaderProfile, StorySettings } from '../models/types';

// Default initial state
const defaultState: StoryState = {
  hero: {
    childName: '',
    ageBracket: '3-5',
    heroType: 'human',
    traits: [],
  },
  reader: {
    childName: '',
    childAge: 0,
    relationshipDescription: '',
  },
  settings: {
    adventureType: 'cozy',
    length: 'short',
    tone: 'gentle',
  },
  outline: null,
  scenes: [],
};

interface StoryContextType {
  state: StoryState;
  setHero: (hero: HeroProfile) => void;
  setReader: (reader: ReaderProfile) => void;
  setSettings: (settings: StorySettings) => void;
  resetStory: () => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<StoryState>(defaultState);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('storysmith_state');
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
  }, []);

  // Save to sessionStorage on change
  useEffect(() => {
    try {
      sessionStorage.setItem('storysmith_state', JSON.stringify(state));
    } catch (e) {
      // Ignore storage errors
    }
  }, [state]);

  const setHero = (hero: HeroProfile) => {
    setState((prev) => ({ ...prev, hero }));
  };

  const setReader = (reader: ReaderProfile) => {
    setState((prev) => ({ ...prev, reader }));
  };

  const setSettings = (settings: StorySettings) => {
    setState((prev) => ({ ...prev, settings }));
  };

  const resetStory = () => {
    setState(defaultState);
    sessionStorage.removeItem('storysmith_state');
  };

  return (
    <StoryContext.Provider value={{ state, setHero, setReader, setSettings, resetStory }}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStoryState = () => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStoryState must be used within a StoryProvider');
  }
  return context;
};

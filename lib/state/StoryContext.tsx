import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StoryState, HeroProfile, ReaderProfile, StorySettings, StoryOutline, StoryScene } from '../models/types';

const defaultState: StoryState = {
  hero: { childName: '', ageBracket: '3-5', heroType: 'human', traits: [] },
  reader: { childName: '', childAge: 0, relationshipDescription: '' },
  settings: { adventureType: 'cozy', length: 'short', tone: 'gentle' },
  outline: null,
  scenes: [],
};

interface StoryContextType {
  state: StoryState;
  setHero: (hero: HeroProfile) => void;
  setReader: (reader: ReaderProfile) => void;
  setSettings: (settings: StorySettings) => void;
  setOutline: (outline: StoryOutline) => void;
  setScenes: (scenes: StoryScene[]) => void;
  updateScene: (scene: StoryScene) => void;
  resetStory: () => void;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const StoryProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<StoryState>(defaultState);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('storysmith_state');
      if (stored) setState(JSON.parse(stored));
    } catch (e) { console.error("Failed to load state", e); }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('storysmith_state', JSON.stringify(state));
    } catch (e) { }
  }, [state]);

  const setHero = (hero: HeroProfile) => setState(prev => ({ ...prev, hero }));
  const setReader = (reader: ReaderProfile) => setState(prev => ({ ...prev, reader }));
  const setSettings = (settings: StorySettings) => setState(prev => ({ ...prev, settings }));
  const setOutline = (outline: StoryOutline) => setState(prev => ({ ...prev, outline }));
  const setScenes = (scenes: StoryScene[]) => setState(prev => ({ ...prev, scenes }));
  
  const updateScene = (scene: StoryScene) => {
    setState(prev => ({
      ...prev,
      scenes: prev.scenes.map(s => s.id === scene.id ? scene : s)
    }));
  };

  const resetStory = () => {
    setState(defaultState);
    sessionStorage.removeItem('storysmith_state');
  };

  return (
    <StoryContext.Provider value={{ state, setHero, setReader, setSettings, setOutline, setScenes, updateScene, resetStory }}>
      {children}
    </StoryContext.Provider>
  );
};

export const useStoryState = () => {
  const context = useContext(StoryContext);
  if (!context) throw new Error('useStoryState must be used within a StoryProvider');
  return context;
};

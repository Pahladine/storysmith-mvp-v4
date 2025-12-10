import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { useStoryState } from '../lib/state/StoryContext';
import { SceneCard } from '../components/story/SceneCard';
import { SceneList } from '../components/story/SceneList';
import { StoryPreviewPanel } from '../components/story/StoryPreviewPanel';
import { Sparkles, ArrowRight, RefreshCw, BookOpen } from 'lucide-react';

export default function BuildPage() {
  const router = useRouter();
  const { state: storyState, setOutline, setScenes, updateScene } = useStoryState();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  useEffect(() => {
    if (!storyState.hero.childName) router.replace('/start');
  }, [storyState.hero.childName, router]);

  const hasScenes = storyState.scenes.length > 0;
  const hasOutline = !!storyState.outline;

  const handleGenerateOutline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero: storyState.hero, reader: storyState.reader, settings: storyState.settings })
      });
      const data = await res.json();
      if (data.outline) setOutline(data.outline);
    } catch (e) { alert("Something went wrong generating the outline."); } finally { setIsLoading(false); }
  };

  const handleGenerateScenes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero: storyState.hero, reader: storyState.reader, settings: storyState.settings, outline: storyState.outline })
      });
      const data = await res.json();
      if (data.scenes) { setScenes(data.scenes); if (data.scenes.length > 0) setSelectedSceneId(data.scenes[0].id); }
    } catch (e) { alert("Something went wrong writing the story."); } finally { setIsLoading(false); }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/regenerate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hero: storyState.hero, reader: storyState.reader, settings: storyState.settings, outline: storyState.outline, sceneId })
      });
      const data = await res.json();
      if (data.scene) updateScene(data.scene);
    } catch (e) { alert("Could not regenerate scene."); } finally { setIsLoading(false); }
  };

  if (!hasOutline) {
    return (
      <Layout title="Build Your Story">
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
          <div className="h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center mb-8 text-indigo-600"><Sparkles size={48} /></div>
          <h1 className="text-4xl font-extrabold text-stone-900 mb-4">Ready to shape the adventure?</h1>
          <p className="text-xl text-stone-600 mb-10">We have all your answers. Now, click the button below to plan out the chapters of your book.</p>
          <Button size="lg" onClick={handleGenerateOutline} disabled={isLoading} className="w-full sm:w-auto shadow-xl">
            {isLoading ? 'Thinking...' : 'Create My Story Outline'} <Sparkles className="ml-2" />
          </Button>
        </div>
      </Layout>
    );
  }

  if (hasOutline && !hasScenes) {
    return (
      <Layout title="Review Outline">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-10"><h1 className="text-3xl font-extrabold text-stone-900">Does this sound fun?</h1><p className="text-lg text-stone-600 mt-2">Here is the plan for your book. If you like it, we'll write the full story!</p></div>
          <div className="grid gap-6 mb-12">{storyState.outline?.scenes.map((scene) => <SceneCard key={scene.id} scene={scene} />)}</div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 border-t border-stone-200 pt-8">
            <Button variant="outline" onClick={handleGenerateOutline} disabled={isLoading}><RefreshCw className="mr-2 h-5 w-5" /> Try a Different Plan</Button>
            <Button size="lg" onClick={handleGenerateScenes} disabled={isLoading}>{isLoading ? 'Writing Story...' : 'Yes, Write the Story!'} <ArrowRight className="ml-2 h-5 w-5" /></Button>
          </div>
        </div>
      </Layout>
    );
  }

  const activeScene = storyState.scenes.find(s => s.id === selectedSceneId) || storyState.scenes[0];

  return (
    <Layout title="Your Story">
      <div className="flex-grow flex flex-col md:flex-row max-w-6xl mx-auto w-full p-4 gap-6">
        <div className="w-full md:w-1/3 flex-shrink-0">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 sticky top-24">
            <h3 className="font-bold text-stone-900 mb-4 px-2">Your Scenes</h3>
            <SceneList scenes={storyState.scenes} selectedId={activeScene?.id || null} onSelect={setSelectedSceneId} />
            <div className="mt-6 pt-6 border-t border-stone-100">
               <Button href="/preview" className="w-full" variant="secondary">Finish & Read <BookOpen className="ml-2 h-5 w-5"/></Button>
            </div>
          </div>
        </div>
        <div className="w-full md:w-2/3">
          {activeScene && <StoryPreviewPanel scene={activeScene} isRegenerating={isLoading} onRegenerate={handleRegenerateScene} />}
        </div>
      </div>
    </Layout>
  );
}

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useStoryState } from '../lib/state/StoryContext';
import { SceneCard } from '../components/story/SceneCard';
import { SceneList } from '../components/story/SceneList';
import { StoryPreviewPanel } from '../components/story/StoryPreviewPanel';
import { Sparkles, ArrowRight, RefreshCw, BookOpen } from 'lucide-react';
import { Notification } from '../components/ui/Notification'; // Import the new component

type NotificationType = 'success' | 'error' | 'info';

interface NotificationState {
  message: string;
  type: NotificationType;
  isVisible: boolean;
}

export default function BuildPage() {
  const router = useRouter();
  const { state: storyState, setOutline, setScenes, updateScene } = useStoryState();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  // Utility to display a temporary notification
  const showNotification = useCallback((message: string, type: NotificationType = 'info') => {
    setNotification({ message, type, isVisible: true });
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, isVisible: false }));
    }, 5000);
  }, []);

  useEffect(() => {
    // Redirect if prerequisites are missing
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
        body: JSON.stringify({
          hero: storyState.hero,
          reader: storyState.reader,
          settings: storyState.settings,
        }),
      });
      const data = await res.json();
      if (data.outline) {
        setOutline(data.outline);
        showNotification(
          'Outline created successfully! Review the chapters below.',
          'success'
        );
      } else {
        showNotification(
          "The engine couldn't create an outline. Please try again.",
          'error'
        );
      }
    } catch (e) {
      console.error('Outline generation failed:', e);
      showNotification(
        'Something went wrong generating the outline. Check your network.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateScenes = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero: storyState.hero,
          reader: storyState.reader,
          settings: storyState.settings,
          outline: storyState.outline,
        }),
      });
      const data = await res.json();
      if (data.scenes && data.scenes.length > 0) {
        setScenes(data.scenes);
        setSelectedSceneId(data.scenes[0].id);
        showNotification(
          'The full story has been written! You can now review and edit.',
          'success'
        );
      } else {
        showNotification(
          "We couldn't write the story from the outline. Please try regenerating the scenes.",
          'error'
        );
      }
    } catch (e) {
      console.error('Scene generation failed:', e);
      showNotification(
        'Something went wrong writing the story. The engine might be busy.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateScene = async (sceneId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/regenerate-scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hero: storyState.hero,
          reader: storyState.reader,
          settings: storyState.settings,
          outline: storyState.outline,
          sceneId,
        }),
      });
      const data = await res.json();
      if (data.scene) {
        updateScene(data.scene);
        showNotification('Scene successfully regenerated!', 'success');
      } else {
        showNotification('The engine was unable to rewrite that scene.', 'error');
      }
    } catch (e) {
      console.error('Scene regeneration failed:', e);
      showNotification(
        'Could not regenerate scene. A technical glitch occurred.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const activeScene =
    storyState.scenes.find((s) => s.id === selectedSceneId) || storyState.scenes[0];

  return (
    <Layout title="Build Your Story">
      {/* ----------------- STAGE 1: GENERATE OUTLINE ----------------- */}
      {!hasOutline && (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
          <div className="h-24 w-24 bg-indigo-100 rounded-full flex items-center justify-center mb-8 text-indigo-600">
            <Sparkles size={48} />
          </div>
          <h1 className="text-4xl font-extrabold text-stone-900 mb-4">
            Ready to shape the adventure?
          </h1>
          <p className="text-xl text-stone-600 mb-10">
            We have all your answers. Now, click the button below to plan out the chapters of
            your book.
          </p>
          <Button
            size="lg"
            onClick={handleGenerateOutline}
            disabled={isLoading}
            className="w-full sm:w-auto shadow-xl"
          >
            {isLoading ? 'Thinking...' : 'Create My Story Outline'}{' '}
            <Sparkles className="ml-2" />
          </Button>
        </div>
      )}

      {/* ----------------- STAGE 2: REVIEW OUTLINE ----------------- */}
      {hasOutline && !hasScenes && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-stone-900">Does this sound fun?</h1>
            <p className="text-lg text-stone-600 mt-2">
              Here is the plan for your book. If you like it, we'll write the full story!
            </p>
          </div>
          <div className="grid gap-6 mb-12">
            {storyState.outline?.scenes.map((scene) => (
              <SceneCard key={scene.id} scene={scene} />
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 border-t border-stone-200 pt-8">
            <Button
              variant="outline"
              onClick={handleGenerateOutline}
              disabled={isLoading}
            >
              <RefreshCw className="mr-2 h-5 w-5" /> Try a Different Plan
            </Button>
            <Button
              size="lg"
              onClick={handleGenerateScenes}
              disabled={isLoading}
            >
              {isLoading ? 'Writing Story...' : 'Yes, Write the Story!'}{' '}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* ----------------- STAGE 3: EDIT SCENES ----------------- */}
      {hasOutline && hasScenes && (
        <div className="flex-grow flex flex-col md:flex-row max-w-6xl mx-auto w-full p-4 gap-6">
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 sticky top-24">
              <h3 className="font-bold text-stone-900 mb-4 px-2">Your Scenes</h3>
              <SceneList
                scenes={storyState.scenes}
                selectedId={activeScene?.id || null}
                onSelect={setSelectedSceneId}
              />
              <div className="mt-6 pt-6 border-t border-stone-100">
                <Button href="/preview" className="w-full" variant="secondary">
                  Finish & Read <BookOpen className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3">
            {activeScene && (
              <StoryPreviewPanel
                scene={activeScene}
                isRegenerating={isLoading}
                onRegenerate={handleRegenerateScene}
              />
            )}
          </div>
        </div>
      )}

      {/* Custom Notification Box */}
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onDismiss={() => setNotification((prev) => ({ ...prev, isVisible: false }))}
      />
    </Layout>
  );
}

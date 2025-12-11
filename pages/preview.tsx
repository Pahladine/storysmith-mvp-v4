import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout/Layout';
import { Button } from '../components/ui/Button';
import { useStoryState } from '../lib/state/StoryContext';
import { StoryScene } from '../lib/models/types';
import { ArrowLeft, BookOpen, Download } from 'lucide-react';

/**
 * Renders the content of a single StoryScene in a simple, scrollable panel.
 * We use this instead of StoryPreviewPanel to avoid showing regeneration UI.
 */
const StoryPageView: React.FC<{ scene: StoryScene }> = ({ scene }) => {
  // Simple component to display a scene's text and illustration prompt
  return (
    <div className="bg-white p-6 md:p-10 rounded-3xl shadow-lg border border-indigo-100 mb-8">
      <h2 className="text-3xl font-serif font-bold text-indigo-800 mb-3 border-b pb-2 border-indigo-100">
        Chapter {scene.index}: {scene.title}
      </h2>
      
      {/* Story Text */}
      <p className="text-xl text-stone-700 leading-relaxed whitespace-pre-wrap">
        {scene.text}
      </p>

      {/* Illustration Prompt (as a hidden note for transparency) */}
      <div className="mt-6 pt-4 border-t border-dashed border-stone-200 text-sm text-stone-500 italic">
        <span className="font-semibold">Illustration Prompt:</span> {scene.illustrationPrompt}
      </div>
    </div>
  );
};

const PreviewPage: React.FC = () => {
  const router = useRouter();
  const { state: storyState, resetStory } = useStoryState();

  const { hero, scenes } = storyState;

  // 1. Redirect if prerequisites are missing
  useEffect(() => {
    if (!hero.childName || scenes.length === 0) {
      router.replace('/build');
    }
  }, [hero.childName, scenes.length, router]);

  // If we are mid-redirect or data is still loading/missing, return a minimal view.
  if (!hero.childName || scenes.length === 0) {
    return (
      <Layout title="Story Missing">
        <div className="p-10 text-center">
          <p className="text-xl text-stone-600">Loading story, or the story hasn't been fully generated yet. Redirecting you to the builder...</p>
        </div>
      </Layout>
    );
  }
  
  const childName = hero.childName || "Your Hero"; // Fallback just in case

    const handleStartNewStory = () => {
    resetStory();
    router.push('/start');
  };

  return (
    <Layout title={`Read ${childName}'s Adventure`}>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <BookOpen className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
          <h1 className="text-5xl font-extrabold text-stone-900 mb-2">
            Your Story Is Ready!
          </h1>
          <p className="text-xl text-stone-600">
            Enjoy the complete adventure of <span className="font-semibold text-indigo-600">{childName}</span>.
          </p>
        </div>

        {/* Story Pages */}
        <div className="space-y-10">
          {scenes.map((scene) => (
            <StoryPageView key={scene.id} scene={scene} />
          ))}
        </div>

               {/* Control Panel */}
        <div className="mt-16 pt-8 border-t border-stone-200 flex flex-col sm:flex-row flex-wrap justify-center gap-4">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => router.push('/build')}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Builder
          </Button>

          {/* Start New Story */}
          <Button
            variant="ghost"
            onClick={handleStartNewStory}
            className="w-full sm:w-auto"
          >
            Start a New Story
          </Button>

          {/* Download Button (Non-functional Placeholder) */}
          <div className="relative w-full sm:w-auto">
            <Button
              size="lg"
              variant="primary"
              disabled={true}
              className="w-full"
            >
              <Download className="mr-2 h-5 w-5" /> Download as PDF
            </Button>
            <p className="absolute -bottom-6 left-0 right-0 text-center text-xs text-stone-500 mt-1">
              (Feature coming soon!)
            </p>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default PreviewPage;

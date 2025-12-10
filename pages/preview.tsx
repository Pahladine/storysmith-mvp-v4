import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/layout/Layout';
import { FullStoryReader } from '../components/story/FullStoryReader';
import { Button } from '../components/ui/Button';
import { useStoryState } from '../lib/state/StoryContext';
import { ArrowLeft, RotateCcw, Download } from 'lucide-react';

export default function PreviewPage() {
  const router = useRouter();
  const { state, resetStory } = useStoryState();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Guard Rails: Redirect if data is missing
    if (!state.hero.childName) {
      router.replace('/start');
      return;
    }
    
    if (state.scenes.length === 0) {
      // If we have an outline but no scenes, go to builder
      if (state.outline) {
        router.replace('/build');
      } else {
        router.replace('/start');
      }
      return;
    }

    setIsReady(true);
  }, [state, router]);

  const handleStartNew = () => {
    if (confirm("Are you sure? This will clear your current story.")) {
      resetStory();
      router.push('/start');
    }
  };

  const handleExport = async () => {
    // MVP: Just a placeholder alert for now, strictly client-side
    // Future: Call /api/export-pdf or generate HTML blob
    alert("Export feature coming soon! For now, try using your browser''s Print > Save as PDF option.");
  };

  if (!isReady) {
    return (
      <Layout>
        <div className="flex-grow flex items-center justify-center">
          <p className="text-stone-500">Loading your story...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Finished Story">
      <div className="bg-stone-50 min-h-screen pb-20">
        
        {/* Main Reader Component */}
        <FullStoryReader story={state} />

        {/* Action Bar */}
        <div className="max-w-3xl mx-auto px-4 mt-8 flex flex-col sm:flex-row gap-4 justify-between items-center print:hidden">
          
          <Button variant="ghost" href="/build" className="text-stone-600">
            <ArrowLeft className="mr-2 h-5 w-5" /> Back to Builder
          </Button>

          <div className="flex gap-4">
             <Button variant="outline" onClick={handleExport} title="Print or Save as PDF">
               <Download className="mr-2 h-5 w-5" /> Save / Print
             </Button>
             
             <Button variant="secondary" onClick={handleStartNew}>
               <RotateCcw className="mr-2 h-5 w-5" /> Start New Story
             </Button>
          </div>
        </div>

      </div>
    </Layout>
  );
}

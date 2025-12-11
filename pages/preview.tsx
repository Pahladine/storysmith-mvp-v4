import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { useStoryState } from '../lib/state/StoryContext';
import { StoryScene } from '../lib/models/types';
import { ArrowLeft, BookOpen, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Renders the content of a single StoryScene. Reusable for both screen and print views.
 */
const StoryPageView: React.FC<{ scene: StoryScene; isScreenView: boolean }> = ({ scene, isScreenView }) => {
  const chapterLabel = `Chapter ${scene.index}`;
  
  return (
    <div
      className={`story-page-section bg-white rounded-3xl mb-8 transition-shadow duration-300 ${
        isScreenView ? 'shadow-xl p-8 md:p-12' : 'shadow-none border-none p-0'
      }`}
    >
      <h2
        className={`font-serif font-bold text-stone-900 ${
          isScreenView ? 'text-3xl mb-4' : 'text-xl mb-2'
        }`}
      >
        {chapterLabel}: {scene.title}
      </h2>

      {/* Story Text */}
      <p
        className={`text-stone-700 leading-relaxed whitespace-pre-wrap ${
          isScreenView ? 'text-xl' : 'text-base'
        }`}
      >
        {scene.text}
      </p>

      {/* Illustration Prompt (hidden on print via global styles) */}
      <div className="print-hidden mt-6 pt-4 border-t border-dashed border-stone-200 text-sm text-stone-500 italic">
        <span className="font-semibold">Illustration Prompt:</span> {scene.illustrationPrompt}
      </div>
    </div>
  );
};

const PreviewPage: React.FC = () => {
  const router = useRouter();
  const { state: storyState, resetStory } = useStoryState();

  // State to track the currently viewed page index (0-based)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

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
          <p className="text-xl text-stone-600">
            Loading story, or the story has not been fully generated yet. Redirecting you to the builder...
          </p>
        </div>
      </Layout>
    );
  }

  const totalPages = scenes.length;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === totalPages - 1;

  const activeScene = scenes[currentPageIndex];

  const handleNext = () => {
    if (!isLastPage) setCurrentPageIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (!isFirstPage) setCurrentPageIndex((prev) => prev - 1);
  };

  const handlePrint = () => {
    window.print();
  };

  const childName = hero.childName || 'Your Hero';

  return (
    <Layout title={`Read ${childName}'s Adventure`}>
      <div className="story-content-wrapper max-w-5xl mx-auto px-4 py-8 md:py-12">
        
        {/* --- 1. SCREEN-ONLY READER VIEW --- */}
        <div className="screen-only">
          {/* Header / Title */}
          <div className="text-center mb-8">
            <BookOpen className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
            <h1 className="text-4xl font-extrabold text-stone-900 mb-2">
              The Adventure of {childName}
            </h1>
            <p className="text-lg text-stone-600">
              Snuggle up and read the story together!
            </p>
          </div>

          {/* Main Reader Page */}
          <div className="flex justify-center items-stretch min-h-[50vh]">
            <div className="w-full max-w-3xl">
              {activeScene && <StoryPageView scene={activeScene} isScreenView={true} />}
            </div>
          </div>
          
          {/* Navigation and Controls */}
          <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4">
            
            {/* Prev/Next Buttons */}
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handlePrev}
                disabled={isFirstPage}
                variant="secondary"
                size="sm"
              >
                <ChevronLeft className="h-5 w-5 mr-1" /> Previous Page
              </Button>
              <div className="flex items-center text-sm font-semibold text-stone-600 px-2">
                Page {currentPageIndex + 1} of {totalPages}
              </div>
              <Button 
                onClick={handleNext}
                disabled={isLastPage}
                variant="secondary"
                size="sm"
              >
                Next Page <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </div>
            
            {/* Back to Builder Button */}
            <Button 
              variant="outline" 
              onClick={() => router.push('/build')}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" /> Back to Builder
            </Button>

            {/* Start a New Story (hard reset) */}
            <Button
              variant="secondary"
              onClick={() => {
                resetStory();
                router.push('/start');
              }}
              className="w-full sm:w-auto"
            >
              Start a New Story
            </Button>
            
            {/* Print Button */}
            <div className="w-full sm:w-auto text-center">
              <Button 
                size="lg" 
                variant="primary" 
                onClick={handlePrint}
                className="w-full"
              >
                <Printer className="mr-2 h-5 w-5" /> Print or Save as PDF
              </Button>
              <p className="mt-1 text-xs text-stone-500">
                This opens your browser’s Print dialog, where you can choose "Save as PDF".
              </p>
            </div>
          </div>
        </div>

        {/* --- 2. PRINT-ONLY FULL STORY --- */}
        <div className="print-only">
          {/* Print Header */}
          <div className="text-center pt-8 pb-12 print-header">
            <h1 className="text-4xl font-serif font-extrabold text-stone-900 mb-4">
              The Complete Story of {childName}
            </h1>
            <p className="text-sm text-stone-600">Generated by StorySmith</p>
          </div>
          
          <div className="space-y-12 story-pages-container">
            {scenes.map((scene) => (
              <StoryPageView key={scene.id} scene={scene} isScreenView={false} />
            ))}
          </div>
        </div>
        
      </div>
    </Layout>
  );
};

export default PreviewPage;

import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/Button";
import { useStoryState } from "../lib/state/StoryContext";
import { StoryScene } from "../lib/models/types";
import { ArrowLeft, BookOpen, Printer, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { buildSessionFromStoryState } from "../lib/session/exportSession";

/**
 * Renders the content of a single StoryScene. Reusable for both screen and print views.
 */
const StoryPageView: React.FC<{ scene: StoryScene; isScreenView: boolean }> = ({ scene, isScreenView }) => {
  const chapterLabel = "Chapter " + scene.index;

  const containerClass = isScreenView
    ? "story-page-section bg-white rounded-3xl mb-8 transition-shadow duration-300 shadow-xl p-8 md:p-12"
    : "story-page-section bg-white rounded-3xl mb-8 transition-shadow duration-300 shadow-none border-none p-0";

  const headingClass = isScreenView
    ? "font-serif font-bold text-stone-900 text-3xl mb-4"
    : "font-serif font-bold text-stone-900 text-xl mb-2";

  const textClass = isScreenView
    ? "text-stone-700 leading-relaxed whitespace-pre-wrap text-xl"
    : "text-stone-700 leading-relaxed whitespace-pre-wrap text-base";

  return (
    <div className={containerClass}>
      <h2 className={headingClass}>
        {chapterLabel}: {scene.title}
      </h2>

      <p className={textClass}>
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
  const { state } = useStoryState();

  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const { hero, scenes } = state;

  // Redirect if prerequisites are missing
  useEffect(() => {
    if (!hero.childName || scenes.length === 0) {
      router.replace("/build");
    }
  }, [hero.childName, scenes.length, router]);

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

  const handleDownloadJson = () => {
    try {
      const session = buildSessionFromStoryState(state);
      const jsonString = JSON.stringify(session, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      const safeId = state.storyId || ("story-" + Date.now().toString());
      link.href = url;
      link.download = "storysmith-" + safeId + ".json";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate or download JSON file:", e);
    }
  };

  if (!hero.childName || scenes.length === 0) {
    return (
      <Layout title="Story Missing">
        <div className="p-10 text-center">
          <p className="text-xl text-stone-600">
            Loading story, or the story hasn&apos;t been fully generated yet. Redirecting you to the builder...
          </p>
        </div>
      </Layout>
    );
  }

  const childName = hero.childName || "Your Hero";

  return (
    <Layout title={"Read " + childName + "'s Adventure"}>
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
          <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col items-center gap-6">
            {/* Prev / Next row */}
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePrev}
                disabled={isFirstPage}
                variant="secondary"
                size="sm"
              >
                <ChevronLeft className="h-5 w-5 mr-1" /> Previous Page
              </Button>
              <div className="text-sm font-semibold text-stone-600">
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

            {/* Action buttons row */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-2xl">
              <Button
                variant="outline"
                onClick={() => router.push("/build")}
                className="flex-1"
                size="sm"
              >
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Builder
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownloadJson}
                className="flex-1"
              >
                <Download className="mr-2 h-5 w-5" /> Download Story File (JSON)
              </Button>

              <Button
                size="sm"
                variant="primary"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="mr-2 h-5 w-5" /> Print or Save as PDF
              </Button>
            </div>

            <p className="text-xs text-stone-500 text-center max-w-xl">
              Printing will open your browser&apos;s Print window. Choose{" "}
              <span className="font-semibold">“Save as PDF”</span> if you want a copy of the book to
              share or print later.
            </p>
          </div>
        </div>

        {/* --- 2. PRINT-ONLY FULL STORY --- */}
        <div className="print-only">
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

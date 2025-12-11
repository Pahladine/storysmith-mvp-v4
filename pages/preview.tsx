import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/layout/Layout";
import { useStoryState } from "../lib/state/StoryContext";
import { Button } from "../components/ui/Button";
import { BookOpen, Home } from "lucide-react";

export default function PreviewPage() {
  const router = useRouter();
  const { state, resetStory } = useStoryState();

  // If there is no story yet, send them back to /build
  useEffect(() => {
    if (!state.scenes || state.scenes.length === 0) {
      router.replace("/build");
    }
  }, [state.scenes, router]);

  if (!state.scenes || state.scenes.length === 0) {
    // Brief guard during redirect
    return null;
  }

  return (
    <Layout title="Preview Your Story – StorySmith">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 mb-2">
            Your Storybook Is Ready
          </h1>
          <p className="text-stone-600 text-lg">
            Read it together now. Export and printing options will be added in the next version.
          </p>
        </div>

        {/* Story pages */}
        <div className="bg-white rounded-3xl shadow-md border border-stone-200 p-6 space-y-8">
          {state.scenes.map((scene) => (
            <div
              key={scene.id}
              className="border-b border-stone-100 pb-6 last:border-b-0 last:pb-0"
            >
              <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">
                Page {scene.index}
              </p>
              <h2 className="text-xl font-bold text-stone-900 mb-3">
                {scene.title}
              </h2>
              <p className="text-lg leading-relaxed text-stone-800 whitespace-pre-line">
                {scene.text}
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/build")}
            className="w-full sm:w-auto"
          >
            Back to Editing
          </Button>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-end">
            <Button
              disabled
              className="w-full sm:w-auto opacity-60 cursor-not-allowed"
            >
              Export / Print (Coming Soon)
            </Button>

            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => {
                resetStory();
                router.push("/");
              }}
            >
              <Home className="mr-2 h-5 w-5" />
              Start a New Story
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

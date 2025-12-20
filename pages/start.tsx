import React from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/layout/Layout";
import { ChatWizard } from "../components/wizard/ChatWizard";
import { act1Script, type Act1State } from "../acts/act1.script";
import { useStoryState } from "../lib/state/StoryContext";
/**
 * Act I (Theme Park chat wizard)
 * - one question at a time
 * - choices first; text optional
 */
export default function StartPage() {
  const router = useRouter();
  const { setHero, setReader, setSettings, resetStory } = useStoryState();
  const initial: Act1State = {
    childName: "",
    readerName: "",
    relationshipDescription: "",
    companionName: "",
    vibe: "Gentle",
    place: "Forest",
    length: "Short",
    buildMode: "Guided",
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <div className="flex justify-end">
          <button
            type="button"
            className="text-sm underline opacity-70 hover:opacity-100"
            onClick={() => {
              // Hard reset: clear persisted session + reset in-memory state, then force full reload.
              try {
                sessionStorage.removeItem("storysmith_state");
              } catch {
                // ignore
              }
              resetStory();
              if (typeof window !== "undefined") {
                window.location.assign("/start");
              }
            }}
            title="Clears the current story (sessionStorage) and restarts the wizard"
          >
            Start over (clear story)
          </button>
        </div>
      </div>

      <ChatWizard
        script={act1Script}
        initialState={initial}
        onComplete={(s) => {
          // Map wizard state -> StoryContext (keep contracts stable)
          setHero({
  childName: s.childName,
  companionName: s.companionName || "",
  heroPhotoDataUrl: s.heroPhotoDataUrl,
} as any);


          setReader({
            childName: s.readerName,
            relationshipDescription: s.relationshipDescription || s.readerName,
          } as any);

          setSettings({
            length: s.length,
            vibe: s.vibe,
            place: s.place,
            buildMode: "Guided",
          } as any);

          router.push("/build");
        }}
      />
    </Layout>
  );
}


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
    const { setHero, setReader, setSettings } = useStoryState();

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
      <ChatWizard
        script={act1Script}
        initialState={initial}
        onComplete={(s) => {
          // Map wizard state -> StoryContext (keep contracts stable)
          setHero({
            childName: s.childName,
            companionName: s.companionName || "",
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
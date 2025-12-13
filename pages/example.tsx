import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { SceneList } from '../components/story/SceneList';
import { StoryPreviewPanel } from '../components/story/StoryPreviewPanel';
import { BookOpen, Sparkles, ArrowLeft } from 'lucide-react';
import { StoryScene } from '../lib/models/types'; // Using existing type

// --- HARDCODED DEMO DATA ---
const exampleScenes: StoryScene[] = [
  {
    id: "scene-1",
    index: 1,
    title: "The Whispering Woods",
    summary: "Leo and Grandma find a magical feather near the old oak tree.",
    text: "Little Leo held Grandma's hand tightly as they stepped into the Whispering Woods. The leaves rustled secrets above them. Near the big, old oak tree, they spotted something shimmering: a bright blue feather. 'It must belong to a very special bird,' Grandma whispered, and Leo tucked the feather safely into his pocket.",
    illustrationPrompt: "A cozy, warm illustration of a child (Leo) and a kind grandmother standing near a giant oak tree in a slightly mysterious forest at sunset. Leo holds a bright blue feather.",
  },
  {
    id: "scene-2",
    index: 2,
    title: "The River of Sparkling Stones",
    summary: "They follow a hidden path to a river where the stones glitter.",
    text: "Following a path only known to squirrels and grandmothers, they arrived at the River of Sparkling Stones. The water was clear, and the smooth river rocks shone like tiny jewels. Leo dipped the blue feather in the water, and suddenly, the rocks around them glowed brighter, humming a quiet, happy song.",
    illustrationPrompt: "An illustration showing a shallow river with clear water and colorful, glittering stones. Leo and Grandma are sitting on the bank, looking amazed at the glowing stones. Soft fantasy lighting.",
  },
  {
    id: "scene-3",
    index: 3,
    title: "The Sleepy Bear's Secret",
    summary: "They meet a friendly, sleepy bear who needs help finding his honey.",
    text: "Further along, they found a very large, very sleepy bear snoring by a giant log. He wasn't scary at all, just groggy. 'Excuse me, Mr. Bear,' Grandma said gently. The bear blinked. He explained in a low rumble that he had lost his jar of Midnight Honey. Leo, feeling brave, promised to help the friendly giant.",
    illustrationPrompt: "A large, friendly cartoon bear yawning next to a log. Leo and Grandma are standing respectfully nearby, looking thoughtful. Warm, gentle lighting.",
  },
  {
    id: "scene-4",
    index: 4,
    title: "The Final Feather Flurry",
    summary: "The magical feather guides them to the missing honey.",
    text: "Leo remembered the blue feather. He took it out, and it began to spin, pulling him towards a small cave. Inside, tucked safely away, was a jar of dark, glittering honey. They carried it back to the bear, who was overjoyed. The bear gave Leo a big, soft hug, and the blue feather floated up high, shimmering goodbye.",
    illustrationPrompt: "Leo and Grandma handing a large jar of honey to the grateful, smiling bear. The blue feather is floating away into the sky. Scene is cozy and joyful.",
  },
];

const ExamplePage: React.FC = () => {
  const [selectedSceneId, setSelectedSceneId] = useState<string>(exampleScenes[0].id);

  const activeScene = exampleScenes.find(s => s.id === selectedSceneId) || exampleScenes[0];

  // No-op function for the StoryPreviewPanel, as this is a static demo
  const handleNoRegenerate = (sceneId: string) => {
    console.log(`Demo: Cannot regenerate scene ${sceneId}. This is a read-only example.`);
    // Optionally show a quick notification here if a Notification component were provided, but we skip for maximum constraint adherence.
  };

  return (
    <Layout title="Example Story – StorySmith">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header and Explanation */}
        <div className="bg-indigo-50 border-indigo-200 border-2 p-6 rounded-2xl mb-8 text-center shadow-inner">
          <h1 className="text-3xl font-extrabold text-indigo-800 flex items-center justify-center">
            <BookOpen className="h-8 w-8 mr-3"/>
            Peek Inside a StorySmith Creation
          </h1>
          <p className="text-lg text-indigo-700 mt-2 max-w-3xl mx-auto">
            This is a complete, hard-coded example of a story created using our guided flow. You can click between the chapters on the left to see the full text and illustration prompts.
          </p>
          <div className="mt-4">
            <Button href="/start" size="sm" variant="primary">
              <Sparkles className="h-5 w-5 mr-2" />
              Ready to make your own? Start your story
            </Button>
          </div>
        </div>
      
        {/* Story Builder Layout */}
        <div className="flex-grow flex flex-col md:flex-row w-full gap-6">
          <div className="w-full md:w-1/3 flex-shrink-0">
            {/* Scene List Card */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 sticky top-24 shadow-lg">
              <h3 className="font-bold text-stone-900 mb-4 px-2 text-xl">Example Scenes</h3>
              <SceneList 
                scenes={exampleScenes} 
                selectedId={activeScene.id} 
                onSelect={setSelectedSceneId} 
              />
              <div className="mt-6 pt-6 border-t border-stone-100">
                <Button href="/start" className="w-full" variant="secondary">
                    <ArrowLeft className="ml-2 h-5 w-5"/> Go Back to Start
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full md:w-2/3">
            {/* Scene Preview Panel */}
            <StoryPreviewPanel 
              scene={activeScene} 
              isRegenerating={false} 
              onRegenerate={handleNoRegenerate} 
            />
          </div>
        </div>

        <div className="mt-12 text-center">
            <Button href="/start" size="lg" variant="primary">
                <Sparkles className="h-6 w-6 mr-3" />
                Start My Own Story Now!
            </Button>
        </div>
      </div>
    </Layout>
  );
};

export default ExamplePage;



import React from 'react';
import { StoryState } from '../../lib/models/types';
import { Sparkles, BookOpen } from 'lucide-react';

interface FullStoryReaderProps {
  story: StoryState;
}

export const FullStoryReader: React.FC<FullStoryReaderProps> = ({ story }) => {
  const { hero, reader, settings, scenes } = story;
  
  // Dynamic Title Generator
  const storyTitle = `${hero.childName}'s ${settings.adventureType} Adventure`;
  const subTitle = `A story for ${hero.childName}, read by ${reader.relationshipDescription || reader.childName}'s favorite reader.`;

  return (
    <div className="bg-white max-w-3xl mx-auto shadow-2xl rounded-sm overflow-hidden border border-stone-200 my-8">
      
      {/* Book Cover / Header Area */}
      <div className="bg-indigo-900 text-white p-10 sm:p-16 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <Sparkles size={400} className="absolute -top-20 -left-20" />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-full mb-6 backdrop-blur-sm">
            <BookOpen size={32} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight font-serif">
            {storyTitle}
          </h1>
          <p className="text-indigo-200 text-lg sm:text-xl font-medium max-w-lg mx-auto">
            {subTitle}
          </p>
        </div>
      </div>

      {/* Story Content */}
      <div className="p-8 sm:p-16 space-y-16">
        {scenes.map((scene, index) => (
          <section key={scene.id} className="prose prose-xl prose-stone max-w-none">
            {/* Scene Header */}
            <div className="flex items-center gap-4 mb-6 opacity-50">
              <span className="h-px bg-stone-300 flex-grow"></span>
              <span className="text-sm font-bold uppercase tracking-widest">Chapter {index + 1}</span>
              <span className="h-px bg-stone-300 flex-grow"></span>
            </div>

            {/* Visual Placeholder (if prompt exists) */}
            {scene.illustrationPrompt && (
              <div className="mb-8 p-6 bg-stone-50 rounded-xl border border-stone-100 text-center text-stone-400 italic text-sm">
                [Illustration: {scene.illustrationPrompt}]
              </div>
            )}

            {/* Scene Text */}
            <h2 className="text-3xl font-bold text-stone-900 mb-6">{scene.title}</h2>
            <p className="leading-loose text-stone-800 font-medium">
              {scene.text}
            </p>
          </section>
        ))}

        {/* The End */}
        <div className="text-center pt-16 pb-8">
          <p className="text-2xl font-serif italic text-stone-400">The End</p>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { StoryScene } from '../../lib/models/types';
import { Button } from '../ui/Button';
import { RefreshCw, Image as ImageIcon } from 'lucide-react';

interface StoryPreviewPanelProps { scene: StoryScene; isRegenerating: boolean; onRegenerate: (sceneId: string) => void; }
export const StoryPreviewPanel: React.FC<StoryPreviewPanelProps> = ({ scene, isRegenerating, onRegenerate }) => {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-stone-200 overflow-hidden">
      <div className="bg-stone-100 aspect-video w-full flex flex-col items-center justify-center text-stone-400 p-8 text-center border-b border-stone-100">
        <ImageIcon size={48} className="mb-4 opacity-50" />
        <p className="text-sm font-medium">Illustration Concept:</p>
        <p className="text-xs max-w-md italic mt-2 opacity-75">{scene.illustrationPrompt || "No prompt generated."}</p>
      </div>
      <div className="p-8 sm:p-10">
        <div className="flex justify-between items-start mb-6">
          <div><span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wide mb-2">Scene {scene.index}</span><h2 className="text-3xl font-extrabold text-stone-900">{scene.title}</h2></div>
        </div>
        <div className="prose prose-lg prose-stone max-w-none mb-10"><p className="leading-loose text-stone-700 whitespace-pre-line">{scene.text}</p></div>
        <div className="pt-6 border-t border-stone-100 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => onRegenerate(scene.id)} disabled={isRegenerating} className="text-stone-500 hover:text-indigo-600">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />{isRegenerating ? 'Rewriting...' : 'Rewrite this part'}
          </Button>
        </div>
      </div>
    </div>
  );
};

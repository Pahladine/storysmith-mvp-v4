import React from 'react';
import { StoryScene } from '../../lib/models/types';
import { CheckCircle2, Circle } from 'lucide-react';

interface SceneListProps { scenes: StoryScene[]; selectedId: string | null; onSelect: (id: string) => void; }
export const SceneList: React.FC<SceneListProps> = ({ scenes, selectedId, onSelect }) => {
  return (
    <div className="space-y-3">
      {scenes.map((scene) => {
        const isSelected = scene.id === selectedId;
        return (
          <button key={scene.id} onClick={() => onSelect(scene.id)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${isSelected ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-100' : 'bg-stone-50 border-transparent hover:bg-white hover:border-stone-200'}`}>
            <div className={`flex-shrink-0 ${isSelected ? 'text-indigo-600' : 'text-stone-400'}`}>
              {isSelected ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </div>
            <div>
              <div className="text-xs font-bold text-stone-400 uppercase">Scene {scene.index}</div>
              <div className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-stone-600'}`}>{scene.title}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

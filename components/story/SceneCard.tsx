import React from 'react';
interface SceneCardProps { scene: { index: number; title: string; summary: string; }; }
export const SceneCard: React.FC<SceneCardProps> = ({ scene }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border-2 border-stone-100 shadow-sm hover:border-indigo-100 transition-colors">
      <div className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2">Scene {scene.index}</div>
      <h3 className="text-xl font-bold text-stone-900 mb-2">{scene.title}</h3>
      <p className="text-stone-600 leading-relaxed">{scene.summary}</p>
    </div>
  );
};

import React from 'react';

export const ReassuranceRow: React.FC = () => {
  return (
    <section className="bg-white border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3 text-center">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              No tech skills needed
            </p>
            <p className="text-sm text-stone-600">
              Clear, plain-language questions. No settings, no jargon, no AI menus.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              Made for grandparents & kids
            </p>
            <p className="text-sm text-stone-600">
              Big buttons, gentle pacing, and a story-focused flow you can enjoy together.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              One sitting, one story
            </p>
            <p className="text-sm text-stone-600">
              Answer a few prompts, watch the pages appear, then read your story right away.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

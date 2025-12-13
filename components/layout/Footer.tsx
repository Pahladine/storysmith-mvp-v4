import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-50 border-t border-stone-200 py-8 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/about"
            className="text-sm font-semibold text-stone-600 hover:text-indigo-600 transition-colors"
          >
            About StorySmith
          </Link>
          <p className="text-xs text-stone-400">
            Early version – one sitting, one story, no accounts.
          </p>
        </div>
      </div>
    </footer>
  );
};

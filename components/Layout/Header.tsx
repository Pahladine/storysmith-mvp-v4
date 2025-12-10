import React from 'react';
import Link from 'next/link';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="text-2xl font-extrabold text-indigo-700 tracking-tight hover:opacity-80 transition-opacity"
          >
            StorySmith
          </Link>
          <span className="hidden sm:inline-block text-sm text-stone-500 font-medium">
            Make a book together
          </span>
        </div>
      </div>
    </header>
  );
};

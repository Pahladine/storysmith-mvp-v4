import React from 'react';
import { Button } from '../ui/Button';
import { BookOpen, Sparkles } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-orange-50 overflow-hidden border-b border-stone-200">
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-24 sm:px-6 lg:px-8 text-center">
        {/* Friendly Greeting Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-8 shadow-sm">
          <BookOpen size={32} aria-hidden="true" />
        </div>

        {/* Main Headline - Plain Language */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight mb-6 leading-tight">
          Create a storybook together
          <br className="hidden sm:block" /> in one sitting.
        </h1>

        {/* Subheading - The "Theme Park Map" explanation */}
        <p className="max-w-2xl mx-auto text-xl text-stone-600 mb-10 leading-relaxed">
          StorySmith helps you and your grandchild write a custom adventure.
          Just answer a few friendly questions, and we&apos;ll build a magical, illustrated book for you.
        </p>

        {/* Action Area */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button href="/start" size="lg" variant="primary" className="w-full sm:w-auto shadow-xl">
            <Sparkles className="mr-2 h-5 w-5" />
            Start Your Story
          </Button>

          <Button href="/example" size="lg" variant="outline" className="w-full sm:w-auto bg-white">
            See an Example First
          </Button>
        </div>

        {/* Grandparent Safety Note */}
        <p className="mt-6 text-sm font-medium text-stone-500">
          No account needed • No typing skills required • Safe for all ages
        </p>
      </div>
    </section>
  );
};

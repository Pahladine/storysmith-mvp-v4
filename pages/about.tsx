import React from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { BookOpen, Shield, Sparkles } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <Layout title="About StorySmith">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12 bg-indigo-50 p-8 rounded-3xl border border-indigo-200 shadow-md">
          <BookOpen className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h1 className="text-5xl font-extrabold text-stone-900 mb-4">
            Welcome to the StorySmith Workshop
          </h1>
          <p className="text-xl text-stone-700 max-w-3xl mx-auto">
            StorySmith is a simple, guided tool built to help you (the grown-up) and your favorite child create a personalized, illustrated storybook together in one sitting.
          </p>
        </div>

        {/* Core Features Section */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          
          {/* Feature Card 1: Guided Process */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-100">
            <h2 className="text-2xl font-bold text-indigo-700 mb-3">
              1. A Guided Adventure
            </h2>
            <p className="text-lg text-stone-600">
              We ask you simple, friendly questions about your child and the kind of adventure they love. No complicated forms or tech jargon!
            </p>
          </div>

          {/* Feature Card 2: Automatic Writing */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-100">
            <h2 className="text-2xl font-bold text-indigo-700 mb-3">
              2. Story Writing Magic
            </h2>
            <p className="text-lg text-stone-600">
              Our Story Engine instantly writes a full, gentle story based on your answers, complete with chapter outlines and text that’s safe and fun for children.
            </p>
          </div>

          {/* Feature Card 3: Illustration Prompts */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-100">
            <h2 className="text-2xl font-bold text-indigo-700 mb-3">
              3. Picture Perfect
            </h2>
            <p className="text-lg text-stone-600">
              Every chapter gets a ready-to-use prompt that tells an AI what picture to draw. You get a fully illustrated book ready to share or print!
            </p>
          </div>
          
          {/* Feature Card 4: No Account */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-stone-100">
            <h2 className="text-2xl font-bold text-indigo-700 mb-3">
              4. Simply Start
            </h2>
            <p className="text-lg text-stone-600">
              There are no accounts, sign-ups, or login hoops to jump through. Just open the page and begin creating a memory with your little one.
            </p>
          </div>
        </div>

        {/* Privacy Reassurance */}
        <div className="bg-green-50 border-green-200 border-2 p-6 rounded-2xl mb-12 flex items-start space-x-4 shadow-inner">
          <Shield className="h-8 w-8 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-bold text-green-700 mb-1">Privacy and Safety First</h2>
            <p className="text-stone-600">
              We keep things simple and safe. StorySmith does not require user accounts, and we do not publicly post any stories created here. The focus is entirely on a private, creative moment between family.
            </p>
          </div>
        </div>


        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button href="/start" size="lg" variant="primary" className="w-full sm:w-auto shadow-xl">
            <Sparkles className="h-6 w-6 mr-3" />
            Start a Story Now!
          </Button>
          <Button href="/example" size="lg" variant="secondary" className="w-full sm:w-auto shadow-lg">
            <BookOpen className="h-6 w-6 mr-3" />
            See an Example First
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;

import React from 'react';
import { MessageCircle, Wand2, BookOpenCheck } from 'lucide-react';

export const HowItWorksStrip: React.FC = () => {
  const steps = [
    {
      id: 1,
      title: "Answer a few questions",
      description: "Tell us about the child and the hero. We’ll ask simple things like 'What is their favorite animal?'",
      icon: MessageCircle,
      color: "bg-blue-100 text-blue-600"
    },
    {
      id: 2,
      title: "Watch the story appear",
      description: "Our story engine weaves your answers into a complete adventure with illustrations.",
      icon: Wand2,
      color: "bg-purple-100 text-purple-600"
    },
    {
      id: 3,
      title: "Read & Keep",
      description: "Read the story together instantly. You can even save it as a PDF to print out.",
      icon: BookOpenCheck,
      color: "bg-emerald-100 text-emerald-600"
    }
  ];

  return (
    <section className="py-16 bg-white border-b border-stone-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-stone-900">How it works</h2>
          <p className="mt-4 text-lg text-stone-600">Three simple steps to your first book.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-stone-50 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              {/* Step Number Badge */}
              <div className="absolute -top-4 bg-stone-900 text-white font-bold h-8 w-8 flex items-center justify-center rounded-full border-4 border-white">
                {step.id}
              </div>

              {/* Icon */}
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 ${step.color}`}>
                <step.icon size={32} strokeWidth={2} />
              </div>

              <h3 className="text-xl font-bold text-stone-900 mb-3">{step.title}</h3>
              <p className="text-stone-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
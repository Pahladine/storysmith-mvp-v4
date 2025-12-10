import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useStoryState } from '../lib/state/StoryContext';
import { HeroProfile, ReaderProfile, StorySettings } from '../lib/models/types';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function StartWizard() {
  const router = useRouter();
  const { state, setHero, setReader, setSettings } = useStoryState();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Local form state - initialized from context
  const [formData, setFormData] = useState<{
    hero: HeroProfile;
    reader: ReaderProfile;
    settings: StorySettings;
  }>({
    hero: state.hero,
    reader: state.reader,
    settings: state.settings,
  });

  // Keep local state in sync if context loads late (e.g. from storage)
  useEffect(() => {
    setFormData({
      hero: state.hero,
      reader: state.reader,
      settings: state.settings,
    });
  }, [state]);

  const handleHeroChange = (field: keyof HeroProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      hero: { ...prev.hero, [field]: value }
    }));
  };

  const handleReaderChange = (field: keyof ReaderProfile, value: any) => {
    setFormData(prev => ({
      ...prev,
      reader: { ...prev.reader, [field]: value }
    }));
  };

  const handleSettingsChange = (field: keyof StorySettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: { ...prev.settings, [field]: value }
    }));
  };

  const goNext = () => {
    if (step < 3) setStep((prev) => (prev + 1) as 1 | 2 | 3);
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const finishWizard = () => {
    // Save everything to global context
    setHero(formData.hero);
    setReader(formData.reader);
    setSettings(formData.settings);
    
    // Navigate to the builder
    router.push('/build');
  };

  return (
    <Layout title="Setup Your Story - StorySmith">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
          
          {/* Progress Header */}
          <div className="bg-orange-100 p-6 border-b border-orange-200 flex justify-between items-center">
            <h1 className="text-xl font-bold text-orange-900">
              Step {step} of 3
            </h1>
            <div className="flex gap-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className={`h-3 w-3 rounded-full ${step >= i ? 'bg-orange-500' : 'bg-orange-200'}`} />
               ))}
            </div>
          </div>

          <div className="p-6 sm:p-10">
            
            {/* STEP 1: HERO */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-extrabold text-stone-900 mb-2">Who is the hero?</h2>
                <p className="text-lg text-stone-500 mb-8">Tell us about the star of the story.</p>
                
                <Input 
                  label="Hero's Name" 
                  placeholder="e.g. Noah, Ayla, or 'Super Bear'"
                  value={formData.hero.childName}
                  onChange={(e) => handleHeroChange('childName', e.target.value)}
                />

                <Select 
                  label="Age Group"
                  options={[
                    { label: "Toddler (3-5 years)", value: "3-5" },
                    { label: "Little Kid (6-8 years)", value: "6-8" },
                    { label: "Big Kid (9-11 years)", value: "9-11" },
                  ]}
                  value={formData.hero.ageBracket}
                  onChange={(e) => handleHeroChange('ageBracket', e.target.value)}
                />

                <Select 
                  label="Who are they?"
                  options={[
                    { label: "A regular kid (Human)", value: "human" },
                    { label: "A brave animal", value: "animal" },
                    { label: "A magical creature", value: "fantasy" },
                  ]}
                  value={formData.hero.heroType}
                  onChange={(e) => handleHeroChange('heroType', e.target.value)}
                />
              </div>
            )}

            {/* STEP 2: READER */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-extrabold text-stone-900 mb-2">Who is reading?</h2>
                <p className="text-lg text-stone-500 mb-8">We'll weave you into the story too!</p>

                <Input 
                  label="Your Names (Reader & Child)" 
                  placeholder="e.g. Grandpa & Noah"
                  value={formData.reader.relationshipDescription}
                  onChange={(e) => handleReaderChange('relationshipDescription', e.target.value)}
                />
                
                <Input 
                  label="Your Name (Optional)" 
                  placeholder="e.g. Grandpa Adam"
                  value={formData.hero.readerName || ''}
                  onChange={(e) => handleHeroChange('readerName', e.target.value)}
                />
              </div>
            )}

            {/* STEP 3: SETTINGS */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-extrabold text-stone-900 mb-2">Pick an Adventure</h2>
                <p className="text-lg text-stone-500 mb-8">What kind of story should we make today?</p>

                <Select 
                  label="Story Vibe"
                  options={[
                    { label: "Gentle & Cozy Bedtime", value: "cozy" },
                    { label: "Silly & Funny", value: "silly" },
                    { label: "Brave Quest", value: "brave" },
                    { label: "Little Mystery", value: "mystery" },
                  ]}
                  value={formData.settings.adventureType}
                  onChange={(e) => handleSettingsChange('adventureType', e.target.value)}
                />

                <Select 
                  label="Setting / Location"
                  options={[
                    { label: "Magical Forest", value: "forest" },
                    { label: "Outer Space", value: "space" },
                    { label: "Under the Sea", value: "underwater" },
                    { label: "Backyard Garden", value: "garden" },
                    { label: "Castle Kingdom", value: "castle" },
                  ]}
                  value={formData.settings.setting || 'forest'}
                  onChange={(e) => handleSettingsChange('setting', e.target.value)}
                />

                <Select 
                  label="Story Length"
                  options={[
                    { label: "Short (5 mins)", value: "short" },
                    { label: "Medium (10 mins)", value: "medium" },
                  ]}
                  value={formData.settings.length}
                  onChange={(e) => handleSettingsChange('length', e.target.value)}
                />
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-stone-100">
              {step === 1 ? (
                <Button variant="ghost" href="/">Cancel</Button>
              ) : (
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
              )}

              {step < 3 ? (
                 <Button className="flex-1" onClick={goNext}>
                   Next Step <ArrowRight className="ml-2 h-5 w-5" />
                 </Button>
              ) : (
                 <Button className="flex-1" variant="secondary" onClick={finishWizard}>
                   Start Building Story <ArrowRight className="ml-2 h-5 w-5" />
                 </Button>
              )}
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

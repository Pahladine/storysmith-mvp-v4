import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Layout } from "../components/layout/Layout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { useStoryState } from "../lib/state/StoryContext";
import { HeroProfile, ReaderProfile, StorySettings } from "../lib/models/types";
import { ArrowRight, ArrowLeft } from "lucide-react";

type OriginMode = "real" | "imagined" | "surprise";

export default function StartWizard() {
  const router = useRouter();
  const { state, setHero, setReader, setSettings, setOutline, setScenes } = useStoryState();const [step, setStep] = useState<1 | 2 | 3>(1);
  const [originMode, setOriginMode] = useState<OriginMode | null>(null);

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

  // Keep local state in sync if context loads late
  useEffect(() => {
    setFormData({
      hero: state.hero,
      reader: state.reader,
      settings: state.settings,
    });
  }, [state]);

  // Always start Act I fresh (prevents old outline/scenes + old names bleeding into new runs)
  const didClearRef = useRef(false);
  useEffect(() => {
    if (didClearRef.current) return;
    if (state.outline || (state.scenes && state.scenes.length > 0)) {
      didClearRef.current = true;
      setOutline(null);
      setScenes([]);
    }
  }, [state.outline, state.scenes?.length]);

  const handleHeroChange = (field: keyof HeroProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const handleReaderChange = (field: keyof ReaderProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      reader: { ...prev.reader, [field]: value },
    }));
  };

  // Auto-suggest the "used inside the story" line.
  // If the user provides a dedication name (e.g., Grandpa Adam) and the audience line is blank
  // (or equals the child's name), we gently fill it as "Child and DedicationName".
  useEffect(() => {
    const heroName = (formData.hero.childName || "").trim();
    const dedication = (formData.hero.readerName || "").trim();
    const audience = (formData.reader.relationshipDescription || "").trim();

    if (!heroName || !dedication) return;

    const audienceLower = audience.toLowerCase();
    const heroLower = heroName.toLowerCase();

    const shouldAutoFill = audience.length === 0 || audienceLower === heroLower;

    if (shouldAutoFill) {
      setFormData((prev) => ({
        ...prev,
        reader: {
          ...prev.reader,
          relationshipDescription: `${heroName} and ${dedication}`,
        },
      }));
    }
  }, [formData.hero.childName, formData.hero.readerName]);
  const handleSettingsChange = (field: keyof StorySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      settings: { ...prev.settings, [field]: value },
    }));
  };

  const goNext = () => {
    // Step 1 validation and defaults logic
    if (step === 1) {
      if (!originMode) return; // Should be blocked by UI anyway

      // Enforce defaults based on origin mode before proceeding
      if (originMode === "real") {
        // Real people are humans
        handleHeroChange("heroType", "human");
      } else if (originMode === "surprise") {
        // If name is blank, give a placeholder
        if (!formData.hero.childName || formData.hero.childName.trim() === "") {
          handleHeroChange("childName", "The Mystery Hero");
        }
        // Ensure a type is set
        if (!formData.hero.heroType) {
          handleHeroChange("heroType", "fantasy");
        }
      }
    }

    if (step < 3) setStep((prev) => (prev + 1) as 1 | 2 | 3);
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const finishWizard = () => {
    const heroName = (formData.hero.childName || "").trim();

    // ReaderProfile is currently a bit legacy-shaped; ensure it still carries useful values.
    const dedication = (formData.hero.readerName || "").trim();
    const audienceRaw = (formData.reader.relationshipDescription || "").trim();

    // If audience is blank (or equals just the hero name) and we have a dedication name,
    // make it "Hero and Dedication" so the story doesn't read "Noah and Noah".
    let relationshipDescription = audienceRaw;
    if ((!relationshipDescription || relationshipDescription.toLowerCase() === heroName.toLowerCase()) && dedication) {
      relationshipDescription = `${heroName} and ${dedication}`;
    }
    if (!relationshipDescription) relationshipDescription = heroName;

    const nextReader = {
      ...formData.reader,
      // Keep childName populated so downstream prompts have something consistent.
      childName: formData.reader.childName && formData.reader.childName.trim().length > 0 ? formData.reader.childName : heroName,
      relationshipDescription,
    };

    setHero(formData.hero);
    setReader(nextReader);
    setSettings(formData.settings);
    router.push("/build");
  };

  // Helpers for Step 3 Summary
  const getAdventureLabel = (vibe: string) => {
    switch (vibe) {
      case "cozy":
        return "a gentle, cozy bedtime story";
      case "silly":
        return "a silly, giggly adventure";
      case "brave":
        return "a brave, heroic quest";
      case "mystery":
        return "a curious little mystery";
      default:
        return "an adventure";
    }
  };

  const getSettingLabel = (place: string) => {
    switch (place) {
      case "forest":
        return "in a magical forest";
      case "space":
        return "among the stars in outer space";
      case "underwater":
        return "deep under the sea";
      case "garden":
        return "in a secret backyard garden";
      case "castle":
        return "in a faraway castle kingdom";
      default:
        return "in a wonderful place";
    }
  };

  const getSummaryText = () => {
    const heroName = formData.hero.childName || "your hero";
    const audience =
      formData.reader.relationshipDescription && formData.reader.relationshipDescription.trim().length > 0
        ? formData.reader.relationshipDescription.trim()
        : heroName;

    if (formData.settings.mode === "custom" && formData.settings.userIdea) {
      const idea = formData.settings.userIdea;
      const snippet =
        idea.length > 80 ? idea.slice(0, 80).trimEnd() + "..." : idea;
      return `This adventure is for ${audience}, starring ${heroName}, based on your idea: “${snippet}”.`;
    }

    const vibe = getAdventureLabel(formData.settings.adventureType);
    const place = getSettingLabel(formData.settings.setting || "forest");
    return `${heroName} will star in ${vibe} set ${place}, created for ${audience}.`;
  };

  const isCustomMode = formData.settings.mode === "custom";
  const canFinish =
    !isCustomMode ||
    !!(
      formData.settings.userIdea &&
      formData.settings.userIdea.trim().length >= 10
    );

  // Step 1 "Next" button validation
  const canProceedStep1 =
    originMode === "surprise"
      ? true // Surprise allows empty (we fill default)
      : originMode === "real"
      ? !!formData.hero.childName // Real needs name
      : originMode === "imagined"
      ? !!formData.hero.childName // Imagined needs name
      : false;

  const actLabel = (() => {
    if (step === 1) return "ACT I · FORGE THE HERO";
    if (step === 2) return "ACT II · CHOOSE THE COMPANIONS";
    return "ACT III · SET TONIGHT'S ADVENTURE";
  })();

  return (
    <Layout title="Set Up Tonight's Story">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
          {/* Progress Header */}
          <div className="bg-orange-100 p-6 border-b border-orange-200 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.18em] text-orange-700 uppercase mb-1">
                {actLabel}
              </p>
              <h1 className="text-xl font-bold text-orange-900">
                Step {step} of 3
              </h1>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full ${
                    step >= i ? "bg-orange-500" : "bg-orange-200"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-10">
            {/* STEP 1: ACT I – FORGE THE HERO */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="mb-8 text-center sm:text-left">
                  <p className="text-xs font-semibold text-orange-600 tracking-[0.18em] uppercase mb-2">
                    The Sculptor of Souls speaks:
                  </p>
                  <h2 className="text-3xl font-extrabold text-stone-900 mb-3">
                    Step into the Hall of Heroic Origins
                  </h2>
                  <p className="text-lg text-stone-600 leading-relaxed">
                    Every great tale begins with a spark. Tonight, we stand at
                    the storyteller&apos;s kiln, ready to shape a hero just for
                    you and your little one.{" "}
                    <span className="font-semibold">
                      How shall your champion enter the story?
                    </span>
                  </p>
                </div>

                {/* Origin Choice Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <button
                    onClick={() => {
                      setOriginMode("real");
                      handleHeroChange("heroType", "human");
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col gap-2 ${
                      originMode === "real"
                        ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                        : "border-stone-200 hover:border-orange-300 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-3xl">❤️</span>
                    <span className="font-bold text-stone-900">
                      A real-life hero
                    </span>
                    <span className="text-xs text-stone-500">
                      Turn a real child you love into the star of tonight&apos;s
                      adventure.
                    </span>
                  </button>

                  <button
                    onClick={() => setOriginMode("imagined")}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col gap-2 ${
                      originMode === "imagined"
                        ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                        : "border-stone-200 hover:border-orange-300 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-3xl">✨</span>
                    <span className="font-bold text-stone-900">
                      A hero from imagination
                    </span>
                    <span className="text-xs text-stone-500">
                      Invent a brand-new character — a brave kid, an animal, or
                      a magical creature.
                    </span>
                  </button>

                  <button
                    onClick={() => setOriginMode("surprise")}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-left flex flex-col gap-2 ${
                      originMode === "surprise"
                        ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                        : "border-stone-200 hover:border-orange-300 hover:bg-stone-50"
                    }`}
                  >
                    <span className="text-3xl">🎁</span>
                    <span className="font-bold text-stone-900">
                      Surprise me, StorySmith
                    </span>
                    <span className="text-xs text-stone-500">
                      Let the forge choose a hero for you — perfect for quick,
                      low-effort story nights.
                    </span>
                  </button>
                </div>

                {/* Conditional Fields */}
                {originMode === "real" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                    <Input
                      label="What is this child's name?"
                      placeholder="e.g. Noah, Ayla, or 12"
                      value={formData.hero.childName}
                      onChange={(e) =>
                        handleHeroChange("childName", e.target.value)
                      }
                    />
                    <p className="mt-2 text-sm text-stone-500">
                      We&apos;ll keep things gentle, kind, and age-appropriate
                      for your real-life star.
                    </p>
                  </div>
                )}

                {originMode === "imagined" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-4">
                    <Input
                      label="What shall we call this hero?"
                      placeholder="e.g. Super Bear, Captain Zog"
                      value={formData.hero.childName}
                      onChange={(e) =>
                        handleHeroChange("childName", e.target.value)
                      }
                    />
                    <Select
                      label="What are they?"
                      options={[
                        { label: "A regular kid (Human)", value: "human" },
                        { label: "A brave animal", value: "animal" },
                        { label: "A magical creature", value: "fantasy" },
                      ]}
                      value={formData.hero.heroType}
                      onChange={(e) =>
                        handleHeroChange("heroType", e.target.value)
                      }
                    />
                  </div>
                )}

                {originMode === "surprise" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                    <Input
                      label="Any preferences? (Optional)"
                      placeholder="Leave blank and StorySmith will decide!"
                      value={formData.hero.childName}
                      onChange={(e) =>
                        handleHeroChange("childName", e.target.value)
                      }
                    />
                    <p className="mt-2 text-sm text-stone-500 italic">
                      “Surprise me” mode is perfect when you just want a quick
                      bedtime story without the fuss.
                    </p>
                  </div>
                )}

                {/* Age is relevant for all, keep it outside but show only if mode selected */}
                {originMode && (
                  <div className="mt-6 animate-in fade-in">
                    <Select
                      label="How old is our young listener? (affects reading level)"
                      options={[
                        { label: "Toddler (3–5 years)", value: "3-5" },
                        { label: "Little Kid (6–8 years)", value: "6-8" },
                        { label: "Big Kid (9–11 years)", value: "9-11" },
                      ]}
                      value={formData.hero.ageBracket}
                      onChange={(e) =>
                        handleHeroChange("ageBracket", e.target.value)
                      }
                    />
                    <p className="mt-2 text-xs text-stone-500">
                      This helps us keep the language and plot just-right for
                      tonight&apos;s audience.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ACT II – CHOOSE THE COMPANIONS */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-xs font-semibold text-orange-600 tracking-[0.18em] uppercase mb-2">
                  The Storyteller leans closer:
                </p>
                <h2 className="text-3xl font-extrabold text-stone-900 mb-2">
                  Take Your Place Beside the Hero
                </h2>
                <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                  Every story needs a steady voice at the edge of the page. This
                  is where we weave{" "}
                  <span className="font-semibold">you</span> into the tale as
                  the guide, curled up beside the child or cheering from the
                  sidelines.
                </p>

                <Input
                  label="Who will enjoy this story? (Used inside the story)"
                  placeholder="e.g. Just 12 · Grandpa Adam and 12 · Our whole class"
                  value={formData.reader.relationshipDescription}
                  onChange={(e) =>
                    handleReaderChange(
                      "relationshipDescription",
                      e.target.value
                    )
                  }
                />
                <p className="mt-2 text-xs text-stone-500">
                  List just the child, both of you, or even a whole group. We
                  might echo this line in the narration so it feels like all of
                  you are right there inside the book.
                </p>

                <div className="mt-6">
                  <Input
                    label="Your name for the dedication (Optional)"
                    placeholder="e.g. Grandpa Adam"
                    value={formData.hero.readerName || ""}
                    onChange={(e) =>
                      handleHeroChange("readerName", e.target.value)
                    }
                  />
                  <p className="mt-2 text-xs text-stone-500">
                    We&apos;ll tuck this into a short dedication at the front of
                    the book so the child knows who brought the magic to life
                    tonight.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 3: ACT III – SET TONIGHT'S ADVENTURE */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <p className="text-xs font-semibold text-orange-600 tracking-[0.18em] uppercase mb-2">
                  The Keeper of Paths smiles:
                </p>
                <h2 className="text-3xl font-extrabold text-stone-900 mb-2">
                  Tune Tonight&apos;s Adventure
                </h2>
                <p className="text-lg text-stone-600 mb-8 leading-relaxed">
                  Just a few final dials to set before the story takes flight.
                  Choose how much you&apos;d like StorySmith to surprise you,
                  and what kind of world you&apos;d like to visit tonight.
                </p>

                {/* Story mode: guided vs custom idea */}
                <Select
                  label="How should we build this story?"
                  options={[
                    {
                      label: "✨ Surprise us! StorySmith picks the details",
                      value: "guided",
                    },
                    {
                      label:
                        "💡 I have an idea (I’ll describe the plot and you shape it)",
                      value: "custom",
                    },
                  ]}
                  value={formData.settings.mode || "guided"}
                  onChange={(e) =>
                    handleSettingsChange(
                      "mode",
                      e.target.value as StorySettings["mode"]
                    )
                  }
                />

                {/* Custom story idea textarea */}
                {isCustomMode && (
                  <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                    <label className="block text-sm font-medium text-stone-700 mb-2">
                      What&apos;s your story idea?
                    </label>
                    <textarea
                      rows={4}
                      className="w-full rounded-2xl border border-stone-300 p-3 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={formData.settings.userIdea || ""}
                      onChange={(e) =>
                        handleSettingsChange("userIdea", e.target.value)
                      }
                      placeholder="e.g. A little girl and her grandpa discover a secret door in the garden that leads to a library of flying books..."
                    />
                    <p className="mt-2 text-xs text-stone-500">
                      A few sentences is plenty. We&apos;ll turn your idea into
                      a cozy, polished story.
                    </p>
                  </div>
                )}

                {/* Guided settings */}
                <div
                  className={`mt-8 space-y-6 transition-opacity duration-300 ${
                    isCustomMode
                      ? "opacity-50 pointer-events-none grayscale"
                      : "opacity-100"
                  }`}
                >
                  <Select
                    label="What vibe should the story have?"
                    options={[
                      { label: "🌙 Gentle & cozy bedtime", value: "cozy" },
                      { label: "🤪 Silly, giggly & fun", value: "silly" },
                      { label: "🛡️ A brave, heroic quest", value: "brave" },
                      { label: "🔍 A curious little mystery", value: "mystery" },
                    ]}
                    value={formData.settings.adventureType}
                    onChange={(e) =>
                      handleSettingsChange("adventureType", e.target.value)
                    }
                  />

                  <Select
                    label="Where does it take place?"
                    options={[
                      { label: "🌲 The magical forest", value: "forest" },
                      { label: "🚀 Among the stars", value: "space" },
                      { label: "🐠 Deep under the sea", value: "underwater" },
                      { label: "🌻 The secret garden", value: "garden" },
                      { label: "🏰 The cloud castle", value: "castle" },
                    ]}
                    value={formData.settings.setting || "forest"}
                    onChange={(e) =>
                      handleSettingsChange("setting", e.target.value)
                    }
                  />

                  <Select
                    label="Story length"
                    options={[
                      { label: "Short & sweet (about 5 minutes)", value: "short" },
                      {
                        label: "A bit longer (about 10 minutes)",
                        value: "medium",
                      },
                    ]}
                    value={formData.settings.length}
                    onChange={(e) =>
                      handleSettingsChange("length", e.target.value)
                    }
                  />
                </div>

                {/* Tonight's Adventure Summary Card */}
                <div className="mt-8 bg-orange-50 border border-orange-100 rounded-2xl p-4 text-stone-700 shadow-sm animate-in zoom-in-95 duration-300">
                  <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide mb-1">
                    Tonight&apos;s Adventure
                  </h3>
                  <p className="text-sm leading-relaxed">{getSummaryText()}</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 flex flex-col-reverse sm:flex-row gap-4 pt-6 border-t border-stone-100">
              {step === 1 ? (
                <Button variant="ghost" href="/">
                  Cancel
                </Button>
              ) : (
                <Button variant="ghost" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </Button>
              )}

              {step < 3 ? (
                <Button
                  className="flex-1"
                  onClick={goNext}
                  disabled={step === 1 && !canProceedStep1}
                >
                  Next Act <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  className="flex-1 shadow-lg shadow-orange-200"
                  variant="secondary"
                  onClick={finishWizard}
                  disabled={!canFinish}
                >
                  Begin the Adventure <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}





import type { WizardScript, WizardChoice, WizardUploadedFile } from "../components/wizard/types";

export type Act1State = {
  heroOrigin?: "real" | "new" | "surprise";
  heroPhotoDataUrl?: string;

  childName: string;
  readerName: string;
  relationshipDescription: string;

  companionName?: string;
  vibe: "Gentle" | "Playful" | "Brave";
  place: "Forest" | "Beach" | "Space";
  length: "Short" | "Medium" | "Long";
  buildMode: "Surprise" | "Guided";
};

export const act1Script: WizardScript<Act1State> = {
  persona: {
    name: "The Sculptor of Souls",
    title: "Act I — Forge the Hero",
    subtitle: "A theme-park wizard that builds your hero in a few cozy steps.",
  },
  initialStepId: "intro",
  steps: [
    {
      id: "intro",
      kind: "say",
      host:
        "Welcome, traveler.\n\nIn a moment, we’ll forge your hero — and the mood of their first adventure.\n\nReady?",
      nextId: "startMode",
    },

    {
      id: "startMode",
      kind: "choice",
      host: "How shall we begin crafting your hero?",
      choices: [
        { id: "real", label: "A real person I know or love (optional photo upload)", value: "real" },
        { id: "new", label: "A brand new hero (I’ll describe them)", value: "new" },
        { id: "surprise", label: "Surprise me (gentle prompts)", value: "surprise" },
      ],
      apply: (s: Act1State, c: WizardChoice) => ({ ...s, heroOrigin: c.value as any }),
      nextId: (s: Act1State, c: WizardChoice) => (c.value === "real" ? "heroPhoto" : "heroName"),
      extraFlavor: {
        label: "Optional: who is this story for?",
        placeholder: "e.g., my daughter, my grandson, my class…",
        apply: (s: Act1State, t: string) => ({ ...s, relationshipDescription: t }),
      },
    },

    {
      id: "heroPhoto",
      kind: "upload",
      host:
        "If this hero is a real person, you can upload a photo.\n\nThis helps StorySmith keep your hero recognizable from page to page. (Optional for now.)",
      accept: "image/*",
      helpText:
        "Use a clear, well-lit face photo. Avoid heavy filters. If you don’t have it handy, you can skip and add it later.",
      required: false,
      apply: (s: Act1State, file: WizardUploadedFile) => ({ ...s, heroPhotoDataUrl: file.dataUrl }),
      nextId: "heroName",
    },

    {
      id: "heroName",
      kind: "text",
      host:
        "First, the hero’s name.\n\nIf you leave it blank, I’ll choose a friendly default.",
      placeholder: "Hero name (e.g., Chantal)",
      required: false,
      apply: (s: Act1State, text: string) => ({ ...s, childName: text.trim() || s.childName || "Alex" }),
      nextId: "readerName",
    },

    {
      id: "readerName",
      kind: "text",
      host:
        "And who is the story being made for (the reader’s name)?\n\nThis can be you, a parent, a grandparent — anyone.",
      placeholder: "Reader name (e.g., Adam)",
      required: false,
      apply: (s: Act1State, text: string) => ({ ...s, readerName: text.trim() || s.readerName || "Friend" }),
      nextId: "relationship",
    },

    {
      id: "relationship",
      kind: "choice",
      host: "How are the hero and reader connected?",
      choices: [
        { id: "parent", label: "Parent / child", value: "Parent" },
        { id: "grand", label: "Grandparent / grandchild", value: "Grandparent" },
        { id: "friend", label: "Friends", value: "Friend" },
        { id: "custom", label: "Something else (I’ll type it)", value: "Custom" },
        { id: "self", label: "Same person (the hero reads their own story)", value: "Self" },
      ],
      apply: (s: Act1State, c: WizardChoice) => {
        if (c.value === "Custom") return s;
        return { ...s, relationshipDescription: String(c.value) };
      },
      nextId: (s: Act1State, c: WizardChoice) => (c.value === "Custom" ? "relationshipCustom" : "companion"),
    },

    {
      id: "relationshipCustom",
      kind: "text",
      host: "Tell me in a few words — what is their relationship?",
      placeholder: "e.g., Aunt and nephew",
      required: false,
      apply: (s: Act1State, text: string) => ({
        ...s,
        relationshipDescription: text.trim() || s.relationshipDescription || "Friend",
      }),
      nextId: "companion",
    },

    {
      id: "companion",
      kind: "choice",
      host: "Every hero deserves a companion. Would you like one?",
      choices: [
        { id: "yes", label: "Yes, give them a companion", value: "yes" },
        { id: "no", label: "No companion — hero solo", value: "no" },
      ],
      apply: (s: Act1State, c: WizardChoice) => (c.value === "no" ? { ...s, companionName: "" } : s),
      nextId: (s: Act1State, c: WizardChoice) => (c.value === "yes" ? "companionPick" : "vibe"),
    },

    {
      id: "companionPick",
      kind: "choice",
      host: "Pick a companion (or choose Custom).",
      choices: [
        { id: "axolotl", label: "A baby axolotl named Billy", value: "A baby axolotl named Billy" },
        { id: "puppy", label: "Luna the playful puppy", value: "Luna the playful puppy" },
        { id: "robot", label: "A tiny robot called Spark", value: "A tiny robot called Spark" },
        { id: "custom", label: "Custom (I’ll type my own)", value: "__custom__" },
      ],
      apply: (s: Act1State, c: WizardChoice) => (c.value === "__custom__" ? s : { ...s, companionName: String(c.value) }),
      nextId: (s: Act1State, c: WizardChoice) => (c.value === "__custom__" ? "companionName" : "vibe"),
    },

    {
      id: "companionName",
      kind: "text",
      host:
        "What kind of companion is it, and what's its name? (Optional - examples: a baby axolotl named Billy; Luna the playful puppy; a tiny robot called Spark. Leave blank and I will invent one.)",
      placeholder: "e.g., a curious axolotl named Billy",
      required: false,
      apply: (s: Act1State, text: string) => ({ ...s, companionName: text.trim() || s.companionName || "" }),
      nextId: "vibe",
    },

    {
      id: "vibe",
      kind: "choice",
      host: "What should the story feel like?",
      choices: [
        { id: "gentle", label: "Gentle", value: "Gentle" },
        { id: "playful", label: "Playful", value: "Playful" },
        { id: "brave", label: "Brave", value: "Brave" },
      ],
      apply: (s: Act1State, c: WizardChoice) => ({ ...s, vibe: c.value as any }),
      nextId: "place",
    },

    {
      id: "place",
      kind: "choice",
      host: "Where shall the adventure begin?",
      choices: [
        { id: "forest", label: "Forest", value: "Forest" },
        { id: "beach", label: "Beach", value: "Beach" },
        { id: "space", label: "Space", value: "Space" },
      ],
      apply: (s: Act1State, c: WizardChoice) => ({ ...s, place: c.value as any }),
      nextId: "length",
    },

    {
      id: "length",
      kind: "choice",
      host: "How long should the first adventure be?",
      choices: [
        { id: "short", label: "Short", value: "Short" },
        { id: "medium", label: "Medium", value: "Medium" },
        { id: "long", label: "Long", value: "Long" },
      ],
      apply: (s: Act1State, c: WizardChoice) => ({ ...s, length: c.value as any }),
      nextId: "buildMode",
    },

    {
      id: "buildMode",
      kind: "choice",
      host: "Last choice: do you want surprises, or gentle guidance?",
      choices: [
        { id: "surprise", label: "Surprise me", value: "Surprise" },
        { id: "guided", label: "Gentle guidance", value: "Guided" },
      ],
      apply: (s: Act1State, c: WizardChoice) => ({ ...s, buildMode: c.value as any }),
      nextId: "__COMPLETE__",
      extraFlavor: {
        label: "Optional: any tiny detail to include?",
        placeholder: "e.g., a red kite, a blueberry muffin, a rainbow scarf…",
        apply: (s: Act1State, t: string) => ({ ...s, relationshipDescription: s.relationshipDescription || t }),
      },
    },
  ],
};
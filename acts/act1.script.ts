import type { WizardScript } from "../components/wizard/types";

/**
 * Act I: Forge the Hero (Theme Park chat flow)
 * - 6–8 micro-steps
 * - choices first; text is optional except hero name (we still offer a friendly default)
 * - emoji budget: minimal; mostly none
 */

export type Act1State = {
  childName: string;
  readerName: string;
  relationshipDescription: string;
  companionName?: string;
  vibe: "Gentle" | "Playful" | "Brave";
  place: "Forest" | "Beach" | "Space";
  length: "Short" | "Medium";
  buildMode: "Surprise" | "Guided";
};

export const act1Script: WizardScript<Act1State> = {
  persona: {
    name: "The Sculptor of Souls",
    title: "Hall of Heroic Origins",
    subtitle: "One question at a time — we’ll shape this legend together.",
  },
  initialStepId: "intro",
  steps: [
    {
      id: "intro",
      kind: "say",
      host:
        "Step right in. Welcome to the Hall of Heroic Origins.\n\nWe’ll forge a cozy little adventure in a few simple choices. Ready?",
      nextId: "startMode",
    },

    {
      id: "startMode",
      kind: "choice",
      host: "How shall we begin crafting your hero?",
      choices: [
        { id: "real", label: "A real person I know or love", value: "real" },
        { id: "new", label: "A brand new hero from imagination", value: "new" },
        { id: "surprise", label: "Surprise me, StorySmith", value: "surprise" },
      ],
      apply: (s) => s,
      nextId: "heroName",
      extraFlavor: {
        label: "Optional: who is this story for?",
        placeholder: "e.g., my daughter, my grandson, my class…",
        apply: (s, t) => ({ ...s, relationshipDescription: t }),
      },
    },

    {
      id: "heroName",
      kind: "text",
      host:
        "First, the hero’s name.\n\nIf you leave it blank, I’ll choose a friendly default.",
      placeholder: "Hero name (e.g., Chantal)",
      required: false,
      apply: (s, text) => ({ ...s, childName: text.trim() || s.childName || "Alex" }),
      nextId: "readerName",
    },

    {
      id: "readerName",
      kind: "text",
      host:
        "And who is the story being made for (the reader’s name)?\n\nThis can be you, a parent, a grandparent — anyone.",
      placeholder: "Reader name (e.g., Adam)",
      required: false,
      apply: (s, text) => ({ ...s, readerName: text.trim() || s.readerName || "Friend" }),
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
        { id: "custom", label: "Something else (I’ll type it)", value: "Custom" }, { id: "self", label: "Same person (the hero reads their own story)", value: "Self" }
      ],
      apply: (s, c) => {
        if (c.value === "Custom") return s;
        return { ...s, relationshipDescription: String(c.value) };
      },
      nextId: (s, c) => (c.value === "Custom" ? "relationshipCustom" : "companion"),
    },

    {
      id: "relationshipCustom",
      kind: "text",
      host: "Tell me in a few words — what is their relationship?",
      placeholder: "e.g., Aunt and nephew",
      required: false,
      apply: (s, text) => ({ ...s, relationshipDescription: text.trim() || s.relationshipDescription || "Friend" }),
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
      apply: (s, c) => (c.value === "no" ? { ...s, companionName: "" } : s),
      nextId: (s, c) => (c.value === "yes" ? "companionPick" : "vibe"),
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
      apply: (s, c) =>
        c.value === "__custom__" ? s : { ...s, companionName: String(c.value) },
      nextId: (s, c) => (c.value === "__custom__" ? "companionName" : "vibe"),
    },

    {
      id: "companionName",
      kind: "text",
      host: "What kind of companion is it, and what's its name? (Optional - examples: a baby axolotl named Billy; Luna the playful puppy; a tiny robot called Spark. Leave blank and I will invent one.)",
      placeholder: "Companion name (e.g., Billy)",
      required: false,
      apply: (s, text) => ({ ...s, companionName: text.trim() || s.companionName || "Buddy" }),
      nextId: "vibe",
    },

    {
      id: "vibe",
      kind: "choice",
      host: "What should the story feel like?",
      choices: [
        { id: "gentle", label: "Gentle (cozy, calm, kind)", value: "Gentle" },
        { id: "playful", label: "Playful (funny, goofy, high-energy)", value: "Playful" },
        { id: "brave", label: "Brave (adventurous, bold, exciting)", value: "Brave" },
      ],
      apply: (s, c) => ({ ...s, vibe: c.value as any }),
      nextId: "place",
    },

    {
      id: "place",
      kind: "choice",
      host: "Where shall the adventure begin?",
      choices: [
        { id: "forest", label: "A whispery forest (soft paths, friendly critters)", value: "Forest" },
        { id: "beach", label: "A sunny beach (sparkly waves, seashell secrets)", value: "Beach" },
        { id: "castle", label: "A cozy castle (warm halls, hidden doors)", value: "Castle" },
        { id: "underwater", label: "An underwater reef (bubbles, colorful fish)", value: "Underwater" },
        { id: "space", label: "A friendly corner of space (glowing stars, gentle planets)", value: "Space" }
      ],
      apply: (s, c) => ({ ...s, place: c.value as any }),
      nextId: "length",
    },

    {
      id: "length",
      kind: "choice",
      host: "How long should the first adventure be?",
      choices: [
        { id: "short", label: "Short (fast)", value: "Short" },
        { id: "medium", label: "Medium (a little longer)", value: "Medium" },
      ],
      apply: (s, c) => ({ ...s, length: c.value as any }),
      nextId: "buildMode",
    },

    {
      id: "buildMode",
      kind: "choice",
      host: "Last choice: do you want surprises, or gentle guidance?",
      choices: [
        { id: "surprise", label: "Surprise me", value: "Surprise" },
        { id: "guided", label: "Guided", value: "Guided" },
      ],
      apply: (s, c) => ({ ...s, buildMode: c.value as any }),
      nextId: "__COMPLETE__",
      extraFlavor: {
        label: "Optional: any tiny detail to include?",
        placeholder: "e.g., a red kite, a blueberry muffin, a rainbow scarf…",
        apply: (s, t) => ({ ...s, relationshipDescription: s.relationshipDescription || t }),
      },
    },
  ],
};








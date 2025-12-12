# STORYSMITH.MYMGG.COM
## Web Blueprint v1.1 – Updated Experience Blueprint

---

## 0. Purpose of this Blueprint

**Objective**

Define a clear, constrained, production-ready blueprint for StorySmith.mymgg.com v4 that:

- Avoids previous failure patterns  
- Is buildable by a non-coder with AI assistants  
- Can be handed to different AI systems (Gemini, ChatGPT, etc.) without losing the core vision  
- Produces a stable, lovable MVP focused on one thing:

> “Help a grandparent and child create a personalized storybook from idea to finished digital book, with as little friction as possible.”

This blueprint is binding for v4. Any change that contradicts it must be explicitly added as a new version (v1.1, v2, etc.), not quietly tweaked.

### Experience Vision (Theme-Park Kernel)

StorySmith is not just a “story generator.” It is designed as a guided attraction:

- The guest is the grandparent/parent and child, treated as honored visitors.  
- The journey feels like a ride with clear “stops,” not a technical form.  
- The end result is a magical keepsake: a personal storybook they are proud of and excited to share.

Every decision in design, copy, and flow should support:

- Comfort for non-technical users (“grandparent test” – zero prior experience assumed).  
- A sense of playful guidance rather than software complexity.  
- A satisfying finale where the finished book feels like the end of a ride.

---

## 1. Product Definition

### 1.1 Who this is for

**Primary target user**

- A non-technical grandparent (or parent) and a child, using one device together  
- Tech comfort: using a browser, clicking buttons, typing short answers  
- No “developer brain” required

**Secondary users**

- AI-curious adults who want an easy way to make custom children’s books  
- Creative adults / hobbyists who want a fast way to create keepsake storybooks

---

### 1.2 MVP Promise (What StorySmith v4 actually does)

StorySmith v4 Web does exactly this:

1. **Guided Story Setup**  
   Simple Q&A wizard to define:
   - Hero (name, age, traits)  
   - Companion (optional)  
   - Setting  
   - Tone  
   - Basic story type  

2. **Story & Scene Generation**  
   AI generates a coherent children’s story divided into scenes or chapters.  
   Each scene includes:
   - Story text  
   - Illustration prompt / concept  

3. **Preview & Tweak**  
   User can:
   - Adjust title  
   - Tweak key parts of the story (e.g., “make this part sillier”)  
   - Regenerate individual scenes (bounded, not an endless sandbox)  

4. **Export**  
   At minimum:
   - A clean HTML reading view  
   - A basic PDF export (even if initially simple)  

   Images may be placeholders or basic at v4; full illustration system can be enhanced later.

This promise must be delivered in a way that feels like a simple hosted experience, not a “tool” the user has to figure out.

---

### 1.3 What StorySmith is NOT (for v4)

StorySmith v4 Web is **not**:

- A general-purpose creative writing IDE  
- A template marketplace  
- A print-on-demand or commerce platform  
- A multi-user account system  
- A full layout designer like Canva  
- A multilingual app (English only for v4)  

We ship the story-creation flow first.

---

### 1.4 Experience Principles & Cast-Member Layer

StorySmith v4 keeps the original prompt-pack’s “theme park” DNA:

- **Theme-Park Mandate**  
  The UX should feel like a ride with named stops (e.g., “Forge your Hero”, “Shape the Adventure”, “Preview your Book”), even if the on-screen labels are kept simple and non-gimmicky.

- **Cast-Member Integrity (UI Personas)**  
  Internal copy and helper text may refer to friendly guide personas (e.g., “Hero Guide”, “Story Builder”, “Book Finisher”). When used, these personas:
  - Speak in warm, encouraging language.  
  - Never use technical jargon (no “LLM”, “API”, “tokens”).  
  - Present each step as a natural continuation of the previous one.

- **Zero-Barrier Standard (“Grandparent Test”)**  
  We assume:
  - The guest may be uncomfortable with forms, settings, and jargon.  
  - Each screen must explain itself without prior context.  
  - At no point should the user need prior “AI experience” to proceed.

---

## 1.5 Acts & Personas

Act I – Forge the Hero
- Persona: Sculptor of Souls (warm, theatrical guide who helps define the hero and reader).
- Primary route: /start.
- Interaction pattern: very light typing, mostly selections; conversational copy.

Act II – Weave the Scenes
- Persona: Scene Weaver / Architect of Arcs.
- Primary route: /build.
- Interaction pattern: question → generate outline → user chooses, tweaks with simple controls.

Act III – Bind & Preserve
- Persona: Keeper of Stories / Binder.
- Primary route: /preview.
- Interaction pattern: quiet, cozy reading experience + export decisions (PDF vs HTML).


---

## 2. Core User Journeys

### 2.1 Primary Journey – “Make our first storybook”

**Goal:** A grandparent and child go from “idea” to “finished storybook” in one session.

**Steps**

1. **Landing page (`/`)**  
   - Message: “Create a custom bedtime story with your grandchild in a few simple steps.”  
   - Clear primary call-to-action: “Start your story”.

2. **Wizard: Hero & Reader (`/start`)**  
   Ask:
   - Child’s name and age  
   - Hero’s name (can be the child)  
   - Companion (optional)  
   - Tone preference (gentle, funny, adventurous, etc.)  
   - Simple “what kind of adventure?” options (e.g., “forest”, “space”, “underwater”)  

3. **Story Plan & Scene Generation (`/build`)**  
   Show:
   - A high-level outline (beginning, middle, end)  
   - Scenes as cards (Scene 1, Scene 2, etc.)  

   Allow:
   - Regenerating individual scenes  
   - Adjusting key details (e.g., change a location, tweak a moment)  

4. **Preview & Export (`/preview`)**  
   Show:
   - Full story in a simple “storybook” reader format  
   - Basic illustration placeholders (or prompts) aligned to scenes  

   Allow:
   - Title change  
   - Download as PDF / print-friendly HTML  
   - For v4, PDF is a simple print-friendly view; the HTML storybook is the “premium” output and may include richer layout and theming than the PDF.

**Constraints**

- Entire flow should be completable in roughly 15–30 minutes.  
- No mandatory account creation for v4.

**Internal mapping to original prompt-pack ride**

Internally, this five-step web journey mirrors the original six-step prompt-pack ride:

- Step 1 – Hero & Reader ≈ “Hero Forge”  
- Step 2 – Adventure Setup ≈ parts of “Blueprint Bard”  
- Step 3 – Generate Story Plan ≈ “Blueprint Bard” (outline)  
- Step 4 – Generate Story & Scene Details ≈ “Visual Composer”  
- Step 5 – Preview & Export ≈ “Cover Artisan” + “The Finisher”  

This mapping should inform copy, tone, and StoryEngine design, but the on-screen labels must remain simple and non-intimidating for new users.

---

### 2.2 Secondary Journey – “Just see how it works”

**Goal:** Let a curious visitor see a working example story without committing to answering questions.

**Flow**

- `/example` page:
  - Loads a pre-baked example story (no AI calls).  
  - Lets user click through scenes and see the export view.  

**Purpose:** De-risk time and effort before the user commits.

---

## 3. Non-Goals (Explicit No’s for v4)

StorySmith v4 Web will **not** include:

- User accounts / login  
- Saving multiple stories per user  
- Sharing links with permissions  
- Rich illustration tooling inside the app  
- Payment, subscriptions, or checkout flows  
- Multi-language support  
- Admin dashboards, analytics UI, or content moderation tooling  

These may exist in the broader StorySmith vision, but they are **out of scope** for v4 Web.

---

## 4. Technical Architecture (High-Level)

### 4.1 Front-end stack (frozen for v4)

- Next.js  
- React  
- Hosted on Vercel  

**Additional constraints**

- Minimal dependencies.  
- Prefer serverless functions for any back-end logic.  
- Keep configuration simple enough to be understood and maintained by a non-expert developer.

---

### 4.2 Data & State Model (MVP)

At MVP, StorySmith can run entirely as a client-side app with optional serverless calls for AI generation and export. Persistence is **not required** for v4, but the state model should be designed so it can easily move to a database later.

Core conceptual objects:

- `HeroProfile`  
- `ReaderProfile`  
- `StorySettings` (tone, length, etc.)  
- `StoryOutline` (list of scenes with brief descriptions)  
- `StoryScene` (full text + illustration concept)  
- `StoryState` (aggregates everything above)  
- `AssetBundle` (final structure for export: HTML, metadata, etc.)

All of these are further specified in `STATE_AND_APIS.md`.

---

### 4.3 Pages & Routes (MVP)

- `/` – Landing page  
- `/start` – Wizard for hero and story setup  
- `/build` – Outline view + scene generation and editing  
- `/preview` – Full story reading and export page  
- `/example` – Pre-baked demo story  
- `/about` (optional) – Info about StorySmith & MYMGG  

Each route’s responsibilities are defined in `ROUTES_AND_PAGES.md`.

---

### 4.4 External Services & API Integrations

MVP assumption:

- AI text generation: via provider (Gemini, OpenAI, etc.) abstracted behind a simple API wrapper  
- PDF export: minimal solution via serverless or client-side library  

The system must be architected so that:

- Swapping AI providers affects only a thin layer (e.g., a `StoryEngine` adapter).  
- Export logic is isolated (e.g., `exportStoryToPDF(storyState)`).

---

## 5. AI Orchestration & Story Flow

### 5.1 Three-Stage Story Flow

1. **Stage 1 – Outline generation**  
   - Input: hero, reader, settings.  
   - Output: `StoryOutline` (multi-scene arc).  

2. **Stage 2 – Scene generation**  
   - Input: `StoryOutline` + preferences.  
   - Output: list of `StoryScene` objects (each with text + illustration prompt).  

3. **Stage 3 – Refinement**  
   - Input: existing scenes.  
   - User can say:
     - “Make Scene 2 sillier.”  
     - “Shorten Scene 3.”  
   - Output: updated `StoryScene` list.

These stages may all be executed within a single “Generate my story” click in v4, but the architecture must keep them conceptually separated so we can later:

- Expose more granular control.  
- Swap providers for specific stages.  
- Add smart validation or content checks per stage.

---

### 5.2 Model Provider (MVP Assumption)

- Initial implementation may use any suitable LLM (Gemini 3, GPT-4.x, etc.).  
- All AI calls should go through a single abstraction (e.g., `StoryEngine`), not be scattered throughout UI components.  
- The blueprint must not lock the implementation to a specific vendor; this is a deployment choice.

---

### 5.3 StoryEngine & AssetBundle Abstractions

Conceptual interfaces (exact definitions in `STATE_AND_APIS.md`):

- `StoryEngine`  
  - Generates outlines and scenes from hero + settings.  
  - Allows scene-level refinement (e.g., “sillier”, “calmer”).  

- `AssetBundle`  
  - Consolidated structure containing:
    - Hero / reader summary  
    - Story outline  
    - Scenes (text + illustration prompts)  
    - Layout hints / metadata  

- `ExportResult`  
  - Represents output ready for export/layout.  
  - Contains story state + rendered HTML + optional PDF URL.

**Lineage from original prompt-pack**

The StoryEngine is the web-native successor to the original StorySmith prompt-pack pipeline:

- In the prompt pack, a single `SessionState` JSON object was passed between Hero Forge, Blueprint Bard, Visual Composer, Image Director, Cover Artisan, and The Finisher.  
- In v4, `StoryState` plays this role, with clear fields for:
  - Hero and reader profiles  
  - StorySettings  
  - StoryOutline  
  - Scene list with text + illustration concepts  
  - Export-ready layout data (`AssetBundle`)  

**Design rule**

Any future multi-step or multi-model orchestration must plug into `StoryState` rather than inventing parallel state containers.

This keeps the UI decoupled from the underlying model provider.

---

## 6. UX & UI Principles

### 6.1 General UX Rules

- Simple, clean layouts.  
- Large, readable fonts.  
- High contrast and accessible colors.  
- Minimal cognitive load per screen.  
- No technical jargon (no “LLM”, “tokens”, “API”, etc.).

Additional UX mandates for v4:

- Every step must answer, in plain language: “What are we doing right now?” and “What happens next?”  
- All helper text should sound like a friendly host guiding the guest through an attraction, not an app explaining its settings.  
- Any “power user” or advanced options must be hidden, simplified, or deferred to a future version.

Interaction Shape: Prefer multiple-choice, toggles, and friendly presets first. Text inputs should be optional, clearly labeled, and never required to progress unless absolutely necessary (e.g., name field).

---

### 6.2 Wizard UX Rules

- One primary action per screen.  
- No more than 3 major input fields per step.  
- Always show:
  - Step number (e.g., “Step 2 of 4”).  
  - Short description of what comes next.  

- Provide safe defaults.  
- Never trap the user; always allow:
  - Back.  
  - Cancel / Home.

---

### 6.3 Visual Styling (MVP)

- Palette: warm, soft tones (creams, soft blues/greens, gentle accent color).  
- Simple illustrations or icons for:
  - Landing page hero section.  
  - Wizard step indicators.  
  - Preview & export.  
- Generous whitespace to avoid clutter.

More detailed visual guidelines can be expanded later, but v4 must favor clarity over visual complexity.

---

### 6.4 Tone & Copy Guidelines

- Tone: warm, encouraging, lightly playful.  
- Avoid:
  - Technical language (“parameter”, “LLM”, “model”, “session token”).  
  - Blame (“you did X wrong”); use “we” language (“Let’s adjust this together.”).  
- Consistency:
  - Reuse a small set of simple metaphors (e.g., “building your hero”, “shaping your adventure”, “finishing your book”) rather than introducing new ones per page.

A more detailed copy map by page can live in `ROUTES_AND_PAGES.md`.

---

## 7. AI Usage Rules & Patch Protocol

### 7.1 Rules for Working with AI on This Project

When using Gemini, ChatGPT, or other AI systems:

1. **Scope every request**  
   - One task, one feature, one bug at a time.

2. **Reject global refactors**  
   - Do not ask: “Rewrite the whole app to use X.”  
   - Do ask: “Refactor this component to a controlled form given this state shape.”

3. **Always provide context**  
   - Paste:
     - Relevant section of this blueprint.  
     - The file or function being modified.  
     - The desired outcome in plain language (e.g., “Add a loading indicator while the story is generating.”).

4. **Always reference this blueprint**  
   - Any architectural task should be prefaced with the relevant sections from this document or the associated docs.

**When using Gemini 3 specifically to generate or modify code:**

- Always paste the relevant excerpt from this blueprint plus any related docs (`ARCHITECTURE.md`, `ROUTES_AND_PAGES.md`, `STATE_AND_APIS.md`) before asking for changes.  
- Treat Gemini 3 as a “specialized contractor,” not an architect: it should implement within these constraints, not propose new product directions.  
- Any suggestion that changes core UX principles (theme-park feel, grandparent test, single-session completion) is treated as a Blueprint v1.1 change request, not an inline patch.

---

### 7.2 Patch Protocol (Strict)

Any time an AI proposes a change that touches:

- Route structure.  
- Core state models (`StoryState`, `AssetBundle`).  
- StoryEngine API.  
- User journey steps.

…it is **not** applied immediately.

Instead:

1. **Log the proposal**  
   - In `CHANGELOG_STORYSMITH_v1.1.md` under “Proposed changes”.

2. **Evaluate against this blueprint**  
   - Does it contradict:
     - MVP scope?  
     - UX principles?  
     - Simplicity constraints?

3. **Decide**  
   - If accepted:
     - Update this blueprint (new version).  
     - Move the idea into “Approved changes”.  
     - Then implement via small, scoped AI-assisted patches.  
   - If rejected:
     - Note why, so we don’t revisit the same dead end repeatedly.

4. **Never let AI silently drift the architecture**

- No “just applied what it suggested” without review.  
- No mutating shared types without updating `STATE_AND_APIS.md` and `CHANGELOG`.

This protocol is mandatory. It exists to prevent structural drift and hard-to-debug complexity.

This blueprint is the authoritative reference for StorySmith v4 Web.

---

## 8. StorySmith Kernel for Other Surfaces

StorySmith is bigger than this v4 web app. Future implementations (prompt packs, dedicated GPTs, mobile apps) must respect the same kernel:

- **Target**: non-technical family users + creators.  
- **Promise**: a simple, guided ride from idea to keepsake in one sitting.  
- **Experience**: theme-park style guidance, cast-member tone, grandparent-safe UX.  
- **Architecture**: multi-step story flow (outline → scenes → export) anchored in a single shared state object (`StoryState` / `SessionState`).

Any new surface should reference this blueprint as the canonical description of what StorySmith is, even if its technical stack differs.

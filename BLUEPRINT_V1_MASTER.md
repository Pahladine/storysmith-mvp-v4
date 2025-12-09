\# STORYSMITH.MYMGG.COM  

\## Web Blueprint v1 – Draft for Evaluation



---



\## 0. Purpose of this Blueprint



\*\*Objective\*\*



Define a clear, constrained, production-ready blueprint for StorySmith.mymgg.com v4 that:



\- Avoids previous failure patterns

\- Is buildable by a non-coder with AI assistants

\- Produces a stable, lovable MVP focused on one thing:



> “Help a grandparent and child create a personalized storybook together, from idea to finished digital book, with as little friction as possible.”



This blueprint is binding for v4. Any change that contradicts it must be explicitly added as a new version (v1.1, v2, etc.), not quietly tweaked.



---



\## 1. Product Definition



\### 1.1 Who this is for



\*\*Primary target user\*\*



\- A non-technical grandparent (or parent) and a child, using one device together  

\- Tech comfort: using a browser, clicking buttons, typing short answers  

\- No “developer brain” required



\*\*Secondary user\*\*



\- AI-curious adults who want an easy way to make custom children’s books



---



\### 1.2 What StorySmith does (MVP scope)



\*\*MVP Promise\*\*



> “In 15–30 minutes, you and your grandchild can create a custom storybook with your own hero, illustrated scenes, and a shareable/printable version.”



\*\*Core capabilities (v4)\*\*



1\. \*\*Guided Hero \& Story Setup\*\*

&nbsp;  - Simple Q\&A wizard to define:

&nbsp;    - Hero (name, age, traits)

&nbsp;    - Companion (optional)

&nbsp;    - Setting

&nbsp;    - Tone

&nbsp;    - Basic story type



2\. \*\*Story \& Scene Generation\*\*

&nbsp;  - AI generates a coherent children’s story divided into scenes or chapters

&nbsp;  - Each scene includes:

&nbsp;    - Story text

&nbsp;    - Illustration prompt / concept



3\. \*\*Preview \& Light Editing\*\*

&nbsp;  - User can:

&nbsp;    - Re-roll (regenerate) an individual scene

&nbsp;    - Adjust key knobs at story level (shorter / longer; more silly / more calm)



4\. \*\*Export\*\*

&nbsp;  - At minimum:

&nbsp;    - A clean HTML reading view

&nbsp;    - A basic PDF export (even if initially simple)

&nbsp;  - Images may be placeholders or basic at v4; full illustration system can be enhanced later



---



\### 1.3 What StorySmith is NOT (for v4)



StorySmith v4 is \*\*not\*\*:



\- A marketplace

\- A full account system (no profiles, libraries, subscriptions)

\- A full layout designer like Canva

\- Multilingual (English only, with future hooks)



\*\*We ship the story-creation flow first.\*\*



---



\## 2. Core User Journeys



\### 2.1 Primary Journey – “Make our first storybook”



\*\*Goal:\*\* A grandparent and child go from “idea” to “finished storybook” in one session.



\*\*Steps\*\*



1\. \*\*Landing page (`/`)\*\*

&nbsp;  - Message: “Create a custom bedtime story with your grandchild in 4 simple steps.”

&nbsp;  - Clear primary CTA: \*\*Start your story\*\*



2\. \*\*Step 1 – Hero \& Reader (`/start`)\*\*

&nbsp;  - Inputs:

&nbsp;    - Hero name, age, simple traits

&nbsp;    - Child name, age

&nbsp;    - Relationship description (“Grandma \& Noah”, “Grandpa \& Ayla”, etc.)



3\. \*\*Step 2 – Adventure Setup (`/start` continuing or next step)\*\*

&nbsp;  - User chooses:

&nbsp;    - Story type (adventure, cozy bedtime, silly, magical)

&nbsp;    - Setting (home, forest, space, underwater, etc.)

&nbsp;    - Optional tone (gentle / exciting / funny)



4\. \*\*Step 3 – Generate Story Plan (`/build` outline state)\*\*

&nbsp;  - AI creates:

&nbsp;    - A short story outline (e.g. 6–10 scenes)

&nbsp;    - Displayed as cards: Scene 1–N with 1–2 sentence summaries

&nbsp;  - User can approve or request a new outline



5\. \*\*Step 4 – Generate Story \& Scene Details (`/build`)\*\*

&nbsp;  - AI generates full text for each scene based on the outline

&nbsp;  - User can:

&nbsp;    - Click into a scene

&nbsp;    - Re-roll that scene

&nbsp;    - Adjust global length/tone settings (shorter/longer; calmer/sillier)



6\. \*\*Step 5 – Preview \& Export (`/preview`)\*\*

&nbsp;  - Full story view (paginated or scrolling with clear scene headers)

&nbsp;  - Actions:

&nbsp;    - Read online

&nbsp;    - Download PDF

&nbsp;    - (Later) Download images



This is the single journey that must be rock-solid in v4.



---



\### 2.2 Secondary Journey – “Just see how it works”



From the landing page:



\- Secondary CTA: “See an example story”

\- Loads a pre-baked example story (no API calls)

\- Lets user click through scenes and see the export view



\*\*Purpose:\*\* De-risk time and effort before the user commits.



---



\## 3. Non-Goals (Explicit No’s for v4)



The following are out of scope for v4 and must not be implemented:



\- User accounts, authentication, or persistent libraries

\- Payment integration or full SaaS billing

\- Multi-language UX

\- Complex analytics dashboards

\- Public story galleries or marketplaces

\- Native mobile apps



These belong to future releases (v5+ or separate roadmap).



---



\## 4. Technical Architecture (High-Level)



\### 4.1 Front-end stack (frozen for v4)



\- Framework: \*\*Next.js\*\*, Pages Router

\- Language: \*\*TypeScript\*\*

\- Styling: \*\*Tailwind CSS\*\*

\- State: React hooks + lightweight context  

&nbsp; - No Redux, no Zustand, no additional state frameworks

\- Deployment: Vercel

\- Runtime: Node 18+ compatible



This stack must not be changed in v4.



---



\### 4.2 Data \& state model (MVP)



Core conceptual types (described in full in `STATE\_AND\_APIS.md`):



\- `HeroProfile`

\- `ReaderProfile`

\- `StorySettings`

\- `StoryScene`

\- `StoryOutline`

\- `StoryState`

\- `AssetBundle` (for export)



\*\*State location (MVP)\*\*



\- React context on the frontend

\- Temporary persistence in `sessionStorage` or `localStorage`

\- No database dependency for v4



---



\### 4.3 Pages \& routes (MVP)



\- `/` – Landing page

\- `/start` – Wizard for hero and story setup

\- `/build` – Outline view + scene generation and editing

\- `/preview` – Full story reading and export page

\- `/example` – Pre-baked demo story

\- `/about` (optional) – Info about StorySmith \& MYMGG



Each route’s responsibilities are defined in `ROUTES\_AND\_PAGES.md`.



---



\### 4.4 API \& AI integration



API routes (Next.js API routes):



\- `POST /api/generate-outline`

\- `POST /api/generate-scenes`

\- `POST /api/regenerate-scene`

\- `POST /api/export-pdf` (optional in v4)



\*\*AI integration principles\*\*



\- Backend calls a single chosen LLM provider (OpenAI or Claude initially)

\- All AI calls:

&nbsp; - Accept structured JSON

&nbsp; - Return structured JSON

\- Prompts live in dedicated modules (e.g., `prompts/generateOutlinePrompt.ts`)



Details are specified in `STATE\_AND\_APIS.md`.



---



\## 5. AI Orchestration \& Story Flow



\### 5.1 Three-stage story flow (kept, modernized)



1\. \*\*Stage 1 – Outline generation\*\*

&nbsp;  - Input: hero, reader, settings

&nbsp;  - Output: `StoryOutline` (multi-scene arc)



2\. \*\*Stage 2 – Scene expansion\*\*

&nbsp;  - Input: outline + hero/reader/settings

&nbsp;  - Output: list of `StoryScene` objects (scene text + illustration prompts)



3\. \*\*Stage 3 – Presentation \& export\*\*

&nbsp;  - Input: `StoryState`

&nbsp;  - Output:

&nbsp;    - On-screen structure

&nbsp;    - Print-ready HTML and optional PDF via `AssetBundle`



This structure:



\- Is easy to explain to users and other developers

\- Is more robust than a single giant prompt

\- Allows scene-level re-rolls



---



\### 5.2 Model provider (MVP assumption)



For v4, the blueprint assumes \*\*one\*\* text model provider, such as:



\- OpenAI: `gpt-4.1` / `o4-mini`, or

\- Anthropic: Claude Sonnet (3.x/4.x)



Implementation will configure a single client (e.g., `getStoryClient()`), even if the provider changes later.



---



\### 5.3 StoryEngine \& AssetBundle abstractions



Conceptual interfaces (exact definitions in `STATE\_AND\_APIS.md`):



\- `StoryEngine`

&nbsp; - Generates scenes and refinements from hero + settings

&nbsp; - Allows scene-level refinement (e.g., “sillier”, “calmer”)



\- `AssetBundle`

&nbsp; - Represents output ready for export/layout

&nbsp; - Contains story state + rendered HTML + optional PDF URL



These abstractions decouple the UI from the underlying model provider.



---



\## 6. UX \& UI Principles



\### 6.1 General UX rules



\- Simple, clean layouts

\- Large, readable fonts

\- High contrast and accessible colors

\- Minimal cognitive load per screen

\- No technical jargon (no “LLM”, “tokens”, “API”, etc.)



---



\### 6.2 Wizard UX rules



\- One primary action per screen

\- No more than 3 major input fields per step

\- Always show:

&nbsp; - Step number (e.g., “Step 2 of 4”)

&nbsp; - Short description of what comes next



---



\### 6.3 Visual styling (MVP)



\- Palette: warm, soft tones (creams, soft blues/greens, gentle accent color)

\- Simple illustrations or icons for:

&nbsp; - Hero creation

&nbsp; - Story building

&nbsp; - Preview \& export

\- Generous whitespace to avoid clutter



A detailed breakdown by page is in `ROUTES\_AND\_PAGES.md`.



---



\## 7. AI Usage Rules \& Patch Protocol



\### 7.1 Rules for working with AI on this project



When using Gemini, ChatGPT, or other AI systems:



1\. \*\*Scope every request\*\*

&nbsp;  - One task, one feature, one bug at a time



2\. \*\*Reject global refactors\*\*

&nbsp;  - No “make the whole app better” prompts



3\. \*\*No unexplained new dependencies\*\*

&nbsp;  - Any new package must come with:

&nbsp;    - Rationale

&nbsp;    - Installation steps

&nbsp;    - Integration plan



4\. \*\*Always reference this blueprint\*\*

&nbsp;  - Any architectural task should be prefaced with the relevant sections from this document or the associated docs



---



\### 7.2 Patch Protocol (strict)



All AI-generated code changes must follow this format:



```text

File: relative/path.tsx

Purpose: 1–2 line explanation



Instructions:

1\. Open file X.

2\. Find Y.

3\. Replace it with Z.

4\. Run \[command] to test.

5\. Visit \[URL] and check \[behavior].



Code\_before:

<exact snippet>



Code\_after:

<exact snippet>



Tests:

\- \[ ] npm run dev

\- \[ ] Go to http://localhost:3000/...

\- \[ ] Click ..., expect ...



Developer steps:

&nbsp;   1. Backup file or rely on Git

&nbsp;   2. Apply patch exactly

&nbsp;   3. Run the tests/commands listed

&nbsp;   4. If broken, revert and request a minimal fix



8\. Dev Workflow, Environments \& Deployment

8.1 Branching model

&nbsp;   • main

&nbsp;       ◦ Stable branch

&nbsp;       ◦ Deploys to storysmith.mymgg.com

&nbsp;       ◦ Only merge after manual validation

&nbsp;   • dev

&nbsp;       ◦ Integration branch

&nbsp;       ◦ Deploys to dev.storysmith.mymgg.com

&nbsp;       ◦ All experiments and new features land here first

&nbsp;   • Feature branches

&nbsp;       ◦ Named feature/<short-name>, branched from dev



8.2 Minimal pre-merge checklist (dev → main)

Before merging from dev to main:

&nbsp;   • Run:

&nbsp;       ◦ npm run lint

&nbsp;       ◦ npm run build

&nbsp;   • Manual smoke test:

&nbsp;       ◦ Visit /

&nbsp;       ◦ Walk through /start wizard with fake data

&nbsp;       ◦ Generate outline \& scenes

&nbsp;       ◦ View /preview and verify story renders correctly



8.3 Logging \& monitoring (MVP level)

&nbsp;   • Console logging in API routes for:

&nbsp;       ◦ LLM errors

&nbsp;       ◦ Input validation failures

&nbsp;   • Error UI:

&nbsp;       ◦ Display friendly error messages ("Something went wrong, please try again")

&nbsp;       ◦ Provide a “Try again” button on failed operations



9\. Pitfalls \& “Do Not” Summary

To keep the project stable:

&nbsp;   • Do not let AI rewrite the whole app

&nbsp;   • Do not change the core stack in v4 (no new frameworks)

&nbsp;   • Do not introduce more than 3 key decisions per wizard step

&nbsp;   • Do not add new v4 features outside the defined scope

&nbsp;   • Do not push directly to main without going through dev

&nbsp;   • Do not accept AI patches that violate the Patch Protocol

&nbsp;   • Do not confuse the user about what they will get at the end



10\. Open Questions (for future decisions)

These items do not block v4, but require later decisions:

&nbsp;   1. LLM Provider Choice

&nbsp;       ◦ OpenAI vs Claude vs others for production

&nbsp;   2. PDF Generation Method

&nbsp;       ◦ Client-side (html2pdf, jsPDF) vs server-side (headless browser, external service)

&nbsp;   3. Image Generation Approach

&nbsp;       ◦ Placeholder images

&nbsp;       ◦ Basic AI illustrations

&nbsp;       ◦ No images in v4 (text-only story)

&nbsp;   4. Analytics

&nbsp;       ◦ Whether to track anonymous usage

&nbsp;       ◦ Which tool to use and what events to track



11\. How to Use This Blueprint

&nbsp;   • Any work with Gemini, ChatGPT, or other AI must be prefaced by:

&nbsp;       ◦ A short summary of relevant sections of this blueprint, and/or

&nbsp;       ◦ Direct quotes from ARCHITECTURE.md, ROUTES\_AND\_PAGES.md, or STATE\_AND\_APIS.md.

&nbsp;   • Any proposal or patch that contradicts this blueprint must be:

&nbsp;       ◦ Rejected, or

&nbsp;       ◦ Treated as a “Blueprint v1.1 change request” and consciously evaluated

This blueprint is the authoritative reference for StorySmith v4 Web.



---






\# StorySmith Routes \& Pages



This document defines each route in StorySmith v4, its purpose, responsibilities, and constraints.



---



\## 1. Route: `/` (Landing Page)



\### Purpose



Introduce StorySmith, explain the value in under 10 seconds, and drive users to start the story-creation flow.



\### Primary Audience



Non-technical grandparents/parents visiting for the first time.



\### Key Responsibilities



\- Communicate core value:

&nbsp; - “Create a custom bedtime storybook with your grandchild in minutes.”

\- Clearly show:

&nbsp; - Who it’s for

&nbsp; - What it does

&nbsp; - What the user will get

\- Provide:

&nbsp; - Primary CTA: “Start your story”

&nbsp; - Secondary CTA: “See how it works” (scroll or navigate to details/demo)



\### Core Sections



\- Hero section:

&nbsp; - Headline + subheadline

&nbsp; - Primary CTA button

\- “How it works” section (3-step visual)

\- Example snippet / screenshots

\- Short “Why it’s special” (emotional benefits)

\- FAQ

\- Footer with contact and basic legal copy



\### Components Used



\- `layout/Layout`

\- `layout/Header`

\- `layout/Footer`

\- `marketing/HeroSection`

\- `marketing/HowItWorks`

\- `marketing/TestimonialStrip` (optional)

\- `marketing/FAQSection`

\- `ui/Button`



\### Data Dependencies



\- None (static content + optional configuration)



\### Allowed Behaviors



\- Smooth scroll to “How it works”

\- Optional link to `/example`



\### Forbidden Behaviors



\- No multi-step forms on the landing page

\- No pop-ups or heavy modals

\- No technical jargon (LLM, tokens, etc.)



---



\## 2. Route: `/start` (Hero \& Setup Wizard)



\### Purpose



Gather minimal information to define the hero, the child, and key story parameters.



\### Key Responsibilities



\- Capture:

&nbsp; - Hero details

&nbsp; - Reader/child details

&nbsp; - Story style basics

\- Persist data into StoryState (via context)



\### Step Structure



\*\*Step 1: “Meet your hero”\*\*



Inputs (max 3–5):



\- Child’s name

\- Child’s approx age or age bracket

\- Relationship (e.g., “Grandpa Adam \& Noah”)

\- Hero type (human / animal / fantasy)

\- 1–2 traits (select from chips)



\*\*Step 2: “What kind of adventure?”\*\*



Inputs:



\- Story type:

&nbsp; - Cozy bedtime

&nbsp; - Silly and funny

&nbsp; - Brave quest

&nbsp; - Mystery

\- Optional:

&nbsp; - Favorite place

&nbsp; - Favorite friend or pet

&nbsp; - Extra detail (short text)



\### Components Used



\- `layout/Layout`

\- `wizard/Stepper`

\- `wizard/HeroForm`

\- `wizard/StorySettingsForm`

\- `wizard/ProgressIndicator`

\- `ui/Button`, `ui/Input`, `ui/Select`, `ui/TextArea`



\### Data Dependencies



\- Writes:

&nbsp; - `HeroProfile`

&nbsp; - `ReaderProfile`

&nbsp; - `StorySettings`

\- Does not call AI yet (in v4) or does so only after user confirms.



\### Allowed Behaviors



\- Back/Next navigation inside wizard

\- Validation with friendly messages



\### Forbidden Behaviors



\- Overly long forms

\- Requiring long free-form paragraphs

\- More than ~3 important decisions per step



---



\## 3. Route: `/build` (Outline \& Scene Generation)



\### Purpose



Generate the story outline, then expand into full scenes. Provide a focused environment for reviewing and tweaking the story content.



\### Key Responsibilities



\- Generate a story outline from hero + settings

\- Display outline as scene cards

\- Generate full scenes

\- Allow scene-level re-roll and light adjustments



\### Layout



Typically a 2-column layout:



\- Left: scenes list (cards)

\- Right: selected scene text and controls



\### States



1\. \*\*Pre-outline\*\*

&nbsp;  - Button to “Create my story outline”

&nbsp;  - On click: call `POST /api/generate-outline`



2\. \*\*Outline generated\*\*

&nbsp;  - Show Scene 1–N as cards with summaries

&nbsp;  - Allow:

&nbsp;    - Regenerate outline

&nbsp;    - Approve outline and “Generate full story”



3\. \*\*Scenes generated\*\*

&nbsp;  - Show full story with:

&nbsp;    - Scene list on left

&nbsp;    - Selected scene on right



\### Components Used



\- `layout/Layout`

\- `wizard/Stepper` (optional)

\- `story/SceneCard`

\- `story/SceneList`

\- `story/StoryPreviewPanel`

\- `ui/Button`



\### Data Dependencies



\- Reads:

&nbsp; - `HeroProfile`, `ReaderProfile`, `StorySettings`

\- Writes:

&nbsp; - `StoryOutline`

&nbsp; - `StoryScene\[]` (stored in `StoryState`)



\### API Dependencies



\- `POST /api/generate-outline`

\- `POST /api/generate-scenes`

\- `POST /api/regenerate-scene` (per-scene)



\### Allowed Behaviors



\- Regenerate outline (with confirmation)

\- Regenerate individual scenes

\- Adjust length/tone globally (if implemented)



\### Forbidden Behaviors



\- Introducing new story paths invisible to the outline

\- Editing data structures without updating `STATE\_AND\_APIS.md`



---



\## 4. Route: `/preview` (Story Preview \& Export)



\### Purpose



Provide a clean, calm reading experience of the final story and allow export.



\### Key Responsibilities



\- Render the entire story in reading format

\- Present clear print/export options

\- Allow returning to `/build` if changes are needed



\### Layout



\- Single-column story view or simple multi-section layout

\- Optional side or top navigation for scenes



\### Components Used



\- `layout/Layout`

\- `story/StoryPreviewPanel` (in full-story mode)

\- `ui/Button`



\### Data Dependencies



\- Reads:

&nbsp; - `StoryState` (hero, settings, scenes)

\- Optionally:

&nbsp; - `AssetBundle` if pre-generated for export



\### API Dependencies



\- `POST /api/export-pdf` (optional)

&nbsp; - Called when user requests PDF



\### Allowed Behaviors



\- “Back to editing” button linking to `/build`

\- “Download PDF” button

\- “Start another story” link to `/start` or `/`



\### Forbidden Behaviors



\- Making further AI calls without user action

\- Hiding major story elements behind extra clicks



---



\## 5. Route: `/example` (Demo Story)



\### Purpose



Show a sample story so new users can understand what StorySmith produces without committing to the full flow.



\### Key Responsibilities



\- Load a pre-baked `StoryState` from static data

\- Render in the same layout/style as `/preview`



\### Components Used



\- Same or subset of `/preview` components



\### Data Dependencies



\- Static example data, not AI-generated at runtime



\### Allowed Behaviors



\- “Make your own story” CTA to `/start`



\### Forbidden Behaviors



\- Calling production AI endpoints

\- Persisting demo content as if it were user content



---



\## 6. Route: `/about` (Optional)



\### Purpose



Provide context about StorySmith and MYMGG for visitors who want more information.



\### Content



\- Short story of why StorySmith exists

\- Who it’s for

\- High-level vision

\- Contact email or form



\### Components Used



\- `layout/Layout`

\- Simple text and UI components



\### Data Dependencies



\- None



---



This document should be updated whenever a route is added, removed, or significantly repurposed.




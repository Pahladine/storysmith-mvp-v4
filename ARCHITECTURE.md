\## 2. `DOCS/ARCHITECTURE.md`



```markdown

\# StorySmith Architecture



This document describes the technical architecture for StorySmith v4, including frontend, backend, state, AI integration, and extension guidelines.



---



\## 1. High-Level Overview



StorySmith is a web application built on:



\- Next.js (Pages Router)

\- TypeScript

\- Tailwind CSS

\- Server-side AI calls to a single LLM provider



At a high level:

+---------------------+

| Browser (UI) |

+----------+----------+

|

v

+---------------------+

| Next.js Frontend |

| (Pages + React) |

+----------+----------+

|

v

+---------------------+

| Next.js API |

| (API Routes) |

+----------+----------+

|

v

+---------------------+

| LLM Provider API |

+---------------------+ 





State is managed on the client with React context and optionally persisted to `sessionStorage`/`localStorage`.



---



\## 2. Frontend Architecture



\### 2.1 Framework \& Structure



\- \*\*Framework:\*\* Next.js (Pages Router)

\- \*\*Language:\*\* TypeScript

\- \*\*Styling:\*\* Tailwind CSS



Key directories:



\- `pages/`

&nbsp; - Route entry points

\- `components/`

&nbsp; - Reusable UI and layout components

\- `lib/`

&nbsp; - Models, helper functions, validation

\- `styles/`

&nbsp; - Global CSS and Tailwind config



\### 2.2 Component Layers



\- \*\*Layout components\*\*

&nbsp; - `Layout`, `Header`, `Footer`

\- \*\*Marketing components\*\*

&nbsp; - `HeroSection`, `HowItWorks`, `TestimonialStrip`, `FAQSection`

\- \*\*Wizard components\*\*

&nbsp; - `Stepper`, `HeroForm`, `StorySettingsForm`, `ProgressIndicator`

\- \*\*Story components\*\*

&nbsp; - `SceneCard`, `SceneList`, `StoryPreviewPanel`

\- \*\*UI primitives\*\*

&nbsp; - `Button`, `Input`, `Select`, `TextArea`, `Card`



Pages should compose these components rather than defining complex markup inline.



---



\## 3. Backend / API Architecture



The backend is implemented through Next.js API routes. Each AI-related operation is behind an API endpoint.



Core routes:



\- `POST /api/generate-outline`

\- `POST /api/generate-scenes`

\- `POST /api/regenerate-scene`

\- `POST /api/export-pdf` (optional in v4)



Responsibilities:



\- Validate incoming JSON against expected shapes

\- Build prompts for the LLM

\- Call the LLM provider

\- Post-process and normalize responses into app data models

\- Return structured JSON to the frontend



No business logic should be duplicated in the frontend.



---



\## 4. State Management Architecture



\### 4.1 State Types



State centers around:



\- `HeroProfile`

\- `ReaderProfile`

\- `StorySettings`

\- `StoryOutline`

\- `StoryScene`

\- `StoryState`

\- `AssetBundle`



Definitions and details live in `STATE\_AND\_APIS.md`.



\### 4.2 State Ownership



\- \*\*Frontend\*\*

&nbsp; - Owns StoryState during the session

&nbsp; - Stores in React context

&nbsp; - Optionally persists to `sessionStorage`/`localStorage`(for refresh resilience)



\- \*\*Backend\*\*

&nbsp; - Stateless in v4

&nbsp; - Derives everything needed from request payloads



No long-term server-side storage is required for v4.



---



\## 5. AI Integration Layer



\### 5.1 StoryEngine Abstraction



An internal abstraction represents the AI provider:



\- `StoryEngine` interface encapsulates:

&nbsp; - Outline generation

&nbsp; - Scene generation

&nbsp; - Scene refinement



The frontend never calls the LLM directly. It calls API routes, which use a concrete `StoryEngine` implementation.



\### 5.2 Prompt Strategy



\- Use structured system prompts that:

&nbsp; - Define audience (children)

&nbsp; - Define tone (warm, safe)

&nbsp; - Enforce JSON output structure

\- Use user prompts that:

&nbsp; - Pass hero, reader, settings, and outline/scene context

&nbsp; - Request specific fields



Prompt templates live in a dedicated module (e.g., `lib/prompts/`).



---



\## 6. Directory Structure (Target)



The target v4 repo structure:

/

pages/

index.tsx # Landing page

start.tsx # Hero \& setup wizard

build.tsx # Outline \& scene generation

preview.tsx # Story preview \& export

example.tsx # Demo story

about.tsx # Optional about page 



api/

&nbsp; generate-outline.ts

&nbsp; generate-scenes.ts

&nbsp; regenerate-scene.ts

&nbsp; export-pdf.ts      # optionalcomponents/

layout/

Layout.tsx

Header.tsx

Footer.tsx 



marketing/

&nbsp; HeroSection.tsx

&nbsp; HowItWorks.tsx

&nbsp; TestimonialStrip.tsx

&nbsp; FAQSection.tsx



wizard/

&nbsp; Stepper.tsx

&nbsp; HeroForm.tsx

&nbsp; StorySettingsForm.tsx

&nbsp; ProgressIndicator.tsx



story/

&nbsp; SceneCard.tsx

&nbsp; SceneList.tsx

&nbsp; StoryPreviewPanel.tsx



ui/

&nbsp; Button.tsx

&nbsp; Input.tsx

&nbsp; Select.tsx

&nbsp; TextArea.tsx

&nbsp; Card.tsx



lib/

models/

HeroProfile.ts

ReaderProfile.ts

StorySettings.ts

StoryOutline.ts

StoryScene.ts

StoryState.ts

AssetBundle.ts 



storyEngine.ts

apiClient.ts

validation.ts



styles/

globals.css

tailwind.config.js

DOCS/

BLUEPRINT\_V1\_MASTER.md

ARCHITECTURE.md

ROUTES\_AND\_PAGES.md

STATE\_AND\_APIS.md

CHANGELOG\_STORYSMITH.md

package.json

tsconfig.json

next.config.js





---



\## 7. Error Handling \& Logging



\### 7.1 Error Handling (Frontend)



\- User-facing errors should be:

&nbsp; - Clear and non-technical

&nbsp; - Recoverable where possible (“Try again” button)

\- For non-recoverable flows, allow user to restart story creation cleanly



\### 7.2 Error Handling (Backend)



\- Validate all inbound payloads

\- Catch and log:

&nbsp; - LLM provider errors

&nbsp; - Timeouts

&nbsp; - Unexpected response formats

\- Return structured error responses with:

&nbsp; - `error: true`

&nbsp; - `message: string`



---



\## 8. Monitoring \& Observability (MVP)



Minimal MVP-level observability:



\- Console logs in API routes for:

&nbsp; - Request start/end

&nbsp; - LLM failures

&nbsp; - Validation failures

\- Optionally add lightweight request IDs for tracing



Advanced monitoring tools can be considered in future versions.



---



\## 9. Extension Guidelines



When extending the architecture:



1\. Do not introduce new frameworks (e.g., no Redux, new routers) in v4.

2\. Keep new features behind feature flags or clearly separate routes.

3\. Document changes in `CHANGELOG\_STORYSMITH.md`.

4\. Update `STATE\_AND\_APIS.md` if data structures or APIs change.

5\. Avoid cross-coupling: new components should use existing patterns and primitives.



This document, combined with `BLUEPRINT\_V1\_MASTER.md`, defines the allowed architectural surface for v4.


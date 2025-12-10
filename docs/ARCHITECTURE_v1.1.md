# StorySmith Architecture
## Technical Architecture for StorySmith v4

This document describes the technical architecture for StorySmith v4, including frontend, backend, state, AI integration, and extension guidelines.

It is subordinate to `BLUEPRINT_V1_MASTER_v1.1.md` and must remain aligned with it.

---

## 1. High-Level Overview

StorySmith is a web application built on:

- Next.js
- TypeScript
- Tailwind CSS
- Server-side AI calls to a single LLM provider

At a high level:

Browser (UI) → Next.js Frontend (Pages + React) → Next.js API Routes → LLM Provider API

State is managed on the client with React context and optionally persisted to `sessionStorage` / `localStorage` for refresh resilience.

The architecture must support:

- The theme-park style, grandparent-safe experience described in the Blueprint.
- A clear separation between UI, state, and the AI integration layer (`StoryEngine`).
- Future swapping of LLM providers without rewriting the app.

---

## 2. Frontend Architecture

### 2.1 Framework & Structure

- **Framework:** Next.js
- **Language:** TypeScript
- **Styling:** Tailwind CSS

Key directories:

- `pages/`
  - Route entry points (one per page in the Blueprint)
- `components/`
  - Reusable UI and layout components
- `lib/`
  - Models, helper functions, validation, StoryEngine wrapper
- `styles/`
  - Global CSS and Tailwind config
- `DOCS/`
  - Blueprint and reference docs (this file, state & APIs, routes & pages, changelog, etc.)

The frontend must be structured so that:

- Pages compose components rather than embedding large, custom layouts.
- Core state types are imported from a single source of truth (`lib/models`), not redefined ad hoc.

### 2.2 Component Layers

Components are organized into clear layers:

- **Layout components**
  - `Layout`, `Header`, `Footer`
  - Provide global frame, navigation, and basic page structure.

- **Marketing components**
  - `HeroSection`, `HowItWorks`, `TestimonialStrip`, `FAQSection`
  - Used on the landing page (`/`) and informational pages.

- **Wizard components**
  - `Stepper`, `HeroForm`, `StorySettingsForm`, `ProgressIndicator`
  - Power the guided journey from hero creation to story generation.

- **Story components**
  - `SceneCard`, `SceneList`, `StoryPreviewPanel`
  - Display outline, scenes, and full story preview.

- **UI primitives**
  - `Button`, `Input`, `Select`, `TextArea`, `Card`
  - Shared visual primitives, styled via Tailwind classes.

Pages should compose these components rather than defining complex markup inline.  
All components must support the UX and tone rules in the Blueprint (e.g., grandparent-safe copy, clear calls-to-action).

---

## 3. Backend / API Architecture

The backend is implemented using Next.js API routes. Each AI-related operation is behind a dedicated endpoint.

Core routes:

- `POST /api/generate-outline`
- `POST /api/generate-scenes`
- `POST /api/regenerate-scene`
- `POST /api/export-pdf` (optional in v4)

Responsibilities:

- Validate incoming JSON against the types defined in `STATE_AND_APIS.md`.
- Build prompts for the LLM using templates from `lib/prompts/`.
- Call the LLM provider via a `StoryEngine` implementation.
- Post-process and normalize responses into app data models.
- Return structured JSON to the frontend.

Business logic must **not** be duplicated in the frontend.  
The frontend sends structured data and receives structured results.

Backend is stateless for v4: no database or long-term storage is required.

---

## 4. State Management Architecture

### 4.1 State Types

Core state types:

- `HeroProfile`
- `ReaderProfile`
- `StorySettings`
- `StoryOutline`
- `StoryScene`
- `StoryState`
- `AssetBundle`

Definitions and full details live in `STATE_AND_APIS.md`.

### 4.2 State Ownership

- **Frontend**
  - Owns `StoryState` during a session.
  - Stores state in React context (e.g., `StoryStateContext`).
  - May optionally persist to `sessionStorage` / `localStorage` for page refresh resilience.

- **Backend**
  - Stateless in v4.
  - Derives everything needed from request payloads passed in by the frontend.
  - Does not maintain user sessions or story history.

No long-term server-side storage is required for v4, but the state model is designed so that storage can be introduced later without rewriting the app.

---

## 5. AI Integration Layer

### 5.1 StoryEngine Abstraction

The AI integration is encapsulated in a `StoryEngine` abstraction.  
The frontend never calls the LLM directly.

Concept:

- `StoryEngine` interface encapsulates:
  - Outline generation.
  - Scene generation.
  - Scene regeneration/refinement.

A concrete implementation (e.g., `GeminiStoryEngine`, `OpenAIStoryEngine`) sits in `lib/storyEngine.ts` and is used by the API routes.

This mirrors the prompt-pack “cast member” pipeline, with StoryEngine acting as the behind-the-scenes operator of Hero Forge, Blueprint Bard, Visual Composer, etc., via a single state object (`StoryState`).

### 5.2 Prompt Strategy

Prompting is handled in a dedicated module, e.g. `lib/prompts/`.

Guidelines:

- Use structured system prompts that:
  - Define audience (young children, with an adult reader).
  - Define tone (warm, safe, gently playful).
  - Enforce JSON output structure aligned with types in `STATE_AND_APIS.md`.
  - Respect safety (no scary or inappropriate themes for the target ages).

- Use user prompts that:
  - Pass hero, reader, settings, and outline/scene context.
  - Request specific fields (e.g., `scenes`, `title`, `summary`, `text`, `illustrationPrompt`).

All prompt templates should be versioned and documented to avoid hidden behavior changes.

---

## 6. Directory Structure (Target)

Target v4 repo structure:

```text
/
  pages/
    index.tsx        # Landing page
    start.tsx        # Hero & setup wizard
    build.tsx        # Outline & scene generation
    preview.tsx      # Story preview & export
    example.tsx      # Demo story
    about.tsx        # Optional about page

    api/
      generate-outline.ts
      generate-scenes.ts
      regenerate-scene.ts
      export-pdf.ts   # optional

  components/
    layout/
      Layout.tsx
      Header.tsx
      Footer.tsx

    marketing/
      HeroSection.tsx
      HowItWorks.tsx
      TestimonialStrip.tsx
      FAQSection.tsx

    wizard/
      Stepper.tsx
      HeroForm.tsx
      StorySettingsForm.tsx
      ProgressIndicator.tsx

    story/
      SceneCard.tsx
      SceneList.tsx
      StoryPreviewPanel.tsx

    ui/
      Button.tsx
      Input.tsx
      Select.tsx
      TextArea.tsx
      Card.tsx

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
    prompts/
      outlinePrompt.ts
      scenesPrompt.ts
      regenerateScenePrompt.ts

  styles/
    globals.css
    tailwind.config.js

  DOCS/
    BLUEPRINT_V1_MASTER.md
    ARCHITECTURE.md
    ROUTES_AND_PAGES.md
    STATE_AND_APIS.md
    CHANGELOG_STORYSMITH.md

  package.json
  tsconfig.json
  next.config.js
```

Directory structure changes must be reflected in this document and in `CHANGELOG_STORYSMITH.md`.

---

## 7. Error Handling & Logging

### 7.1 Error Handling (Frontend)

User-facing errors must be:

- Clear and non-technical.  
- Recoverable where possible (e.g., “Try again” button for failed generation).  
- Consistent with the StorySmith tone (encouraging, non-blaming).

Examples:

- Failed outline generation → “The story engine had trouble just now. Let’s try that again.”  
- Missing fields → highlight the missing fields with friendly inline messages.

For non-recoverable flows, allow the user to restart story creation cleanly from `/start`.

### 7.2 Error Handling (Backend)

Backend responsibilities:

- Validate all inbound payloads against the types in `STATE_AND_APIS.md`.
- Catch and log:
  - LLM provider errors.
  - Timeouts.
  - Unexpected response formats.

Return structured error responses:

```json
{
  "error": true,
  "message": "Description of what went wrong"
}
```

The frontend is responsible for handling these gracefully.

---

## 8. Monitoring & Observability (MVP)

Minimal MVP observability:

- Console logs in API routes for:
  - Request start/end.
  - LLM failures.
  - Validation failures.

Optionally:

- Add lightweight request IDs for tracing between frontend and backend logs.

Advanced monitoring tools (hosted logging, tracing, metrics) can be considered in future versions, but are not required for v4.

---

## 9. Extension Guidelines

When extending the architecture:

1. Do **not** introduce new frameworks (e.g., no Redux or alternative routers) in v4.  
2. Keep new features behind clearly separated routes or flags.  
3. Document changes in `CHANGELOG_STORYSMITH.md`.  
4. Update `STATE_AND_APIS.md` if data structures or APIs change.  
5. Avoid cross-coupling: new components should use existing patterns and primitives.  
6. Respect the product Blueprint:
   - Do not add features that violate MVP scope or the grandparent-safe UX principles.
   - Treat any such ideas as Blueprint change requests, not silent architectural changes.

This document, combined with `BLUEPRINT_V1_MASTER_v1.1.md`, `ROUTES_AND_PAGES.md`, and `STATE_AND_APIS.md`, defines the allowed architectural surface for StorySmith v4.

# StorySmith State & API Contracts
## Data Models, StoryEngine Interface, and API Endpoints

This document defines the core data models and API contracts used in StorySmith v4.  
It is the source of truth for both frontend and backend and must stay aligned with the Blueprint and Architecture docs.

---

## 1. Data Models

All types are expressed in TypeScript-style notation.

### 1.1 HeroProfile

```ts
export type HeroProfile = {
  childName: string;
  readerName?: string;           // e.g., "Grandpa Adam"
  ageBracket: "3-5" | "6-8" | "9-11";
  heroType: "human" | "animal" | "fantasy";
  traits: string[];              // ["brave", "curious"]
};
```

### 1.2 ReaderProfile

```ts
export type ReaderProfile = {
  childName: string;
  childAge: number;
  relationshipDescription: string; // "Grandma & Noah", "Grandpa & Ayla"
};
```

### 1.3 StorySettings

```ts
export type StorySettings = {
  adventureType: "cozy" | "silly" | "brave" | "mystery";
  length: "short" | "medium";
  favoritePlace?: string;
  favoriteFriend?: string;
  extraDetails?: string;
  setting?: string;              // e.g. "forest", "space"
  tone?: "gentle" | "exciting" | "funny";
};
```

### 1.4 StoryScene

```ts
export type StoryScene = {
  id: string;
  index: number;
  title: string;
  summary?: string;              // used in outline
  text: string;
  illustrationPrompt?: string;
};
```

### 1.5 StoryOutline

```ts
export type StoryOutline = {
  scenes: {
    id: string;
    index: number;
    title: string;
    summary: string;
  }[];
};
```

### 1.6 StoryState

```ts
export type StoryState = {
  hero: HeroProfile;
  reader: ReaderProfile;
  settings: StorySettings;
  outline: StoryOutline | null;
  scenes: StoryScene[];
};
```

### 1.7 AssetBundle (Export)

```ts
export type AssetBundle = {
  story: StoryState;
  layoutVariant: "simple-v1";
  exportHtml: string;        // final HTML for reading/printing
  exportPdfUrl?: string;     // if using external service or pre-generated PDF
};
```

---

## 2. StoryEngine Interface (Conceptual)

The backend uses a `StoryEngine` abstraction to interact with the LLM.  
The concrete implementation may use Gemini 3, OpenAI, or any other provider, but the interface remains stable.

```ts
export type StoryEngine = {
  generateOutline(
    hero: HeroProfile,
    reader: ReaderProfile,
    settings: StorySettings
  ): Promise<StoryOutline>;

  generateScenes(
    hero: HeroProfile,
    reader: ReaderProfile,
    settings: StorySettings,
    outline: StoryOutline
  ): Promise<StoryScene[]>;

  regenerateScene(
    hero: HeroProfile,
    reader: ReaderProfile,
    settings: StorySettings,
    outline: StoryOutline,
    sceneId: string
  ): Promise<StoryScene>;

  refineSceneTone?(
    scene: StoryScene,
    direction: "sillier" | "calmer"
  ): Promise<StoryScene>;
};
```

Design notes:

- `StoryEngine` is the code-level representation of the StorySmith “story factory,” mirroring the old prompt-pack cast-member pipeline behind a single cohesive interface.
- All LLM calls must pass through a `StoryEngine` implementation. The rest of the app only works with the typed models above.

---

## 3. API Specifications

All endpoints are `POST` and expect/return JSON.  
Error responses share a common shape: `{ "error": true, "message": string }`.

### 3.1 POST `/api/generate-outline`

**Description:**  
Generate a multi-scene outline based on hero, reader, and story settings.

**Request Body:**

```json
{
  "hero": { /* HeroProfile */ },
  "reader": { /* ReaderProfile */ },
  "settings": { /* StorySettings */ }
}
```

**Response Body (success):**

```json
{
  "outline": {
    "scenes": [
      {
        "id": "scene-1",
        "index": 1,
        "title": "A Quiet Night at Home",
        "summary": "The hero is introduced and a strange noise is heard."
      }
    ]
  }
}
```

**Response Body (error):**

```json
{
  "error": true,
  "message": "Description of what went wrong"
}
```

---

### 3.2 POST `/api/generate-scenes`

**Description:**  
Generate full scenes from a story outline.

**Request Body:**

```json
{
  "hero": { /* HeroProfile */ },
  "reader": { /* ReaderProfile */ },
  "settings": { /* StorySettings */ },
  "outline": { /* StoryOutline */ }
}
```

**Response Body (success):**

```json
{
  "scenes": [
    {
      "id": "scene-1",
      "index": 1,
      "title": "A Quiet Night at Home",
      "summary": "The hero is introduced and a strange noise is heard.",
      "text": "Full scene text here...",
      "illustrationPrompt": "Prompt for illustration of this scene..."
    }
  ]
}
```

**Response Body (error):**

```json
{
  "error": true,
  "message": "Description of what went wrong"
}
```

---

### 3.3 POST `/api/regenerate-scene`

**Description:**  
Regenerate a single scene by `sceneId`.

**Request Body:**

```json
{
  "hero": { /* HeroProfile */ },
  "reader": { /* ReaderProfile */ },
  "settings": { /* StorySettings */ },
  "outline": { /* StoryOutline */ },
  "sceneId": "scene-3"
}
```

**Response Body (success):**

```json
{
  "scene": {
    "id": "scene-3",
    "index": 3,
    "title": "Into the Forest",
    "summary": "The hero follows the sound into the trees.",
    "text": "Regenerated scene text...",
    "illustrationPrompt": "Updated art prompt..."
  }
}
```

**Response Body (error):**

```json
{
  "error": true,
  "message": "Description of what went wrong"
}
```

---

### 3.4 POST `/api/export-pdf` (Optional in v4)

**Description:**  
Convert a story into a PDF (or return a link to a generated PDF).

**Request Body:**

```json
{
  "storyState": { /* StoryState */ }
}
```

**Response Body (success, URL-based):**

```json
{
  "pdfUrl": "https://.../some-generated.pdf"
}
```

Alternatively, the endpoint may return a direct binary PDF response with appropriate headers.

**Response Body (error):**

```json
{
  "error": true,
  "message": "Description of what went wrong"
}
```

Implementation details (local vs external service) can be decided later, but this contract must remain stable.

---

## 4. State Lifecycle

This section describes how the models above move through the app during a typical session.

### 4.1 Creation (`/start`)

On the `/start` page:

- Create initial:
  - `HeroProfile`
  - `ReaderProfile`
  - `StorySettings`

Write them to React context and optionally to `sessionStorage`.

### 4.2 Outline Generation (`/build` – Outline step)

On the `/build` page:

- Call `POST /api/generate-outline` with:
  - `hero`
  - `reader`
  - `settings`
- Store the returned `StoryOutline` in context and optionally in `sessionStorage`.

### 4.3 Scene Generation (`/build` – Full story step)

When the user requests a full story:

- Call `POST /api/generate-scenes` with:
  - `hero`
  - `reader`
  - `settings`
  - `outline`
- Store the returned `StoryScene[]` in context as part of `StoryState.scenes`.

### 4.4 Editing & Regeneration

For scene-level changes:

- Call `POST /api/regenerate-scene` with:
  - `hero`
  - `reader`
  - `settings`
  - `outline`
  - `sceneId`
- Replace the scene with the matching `id` in `StoryState.scenes`.

Optional refinement actions (e.g., “sillier”, “calmer”) may be implemented via `StoryEngine.refineSceneTone` or as a specialized regen flow.

### 4.5 Export (`/preview`)

On export:

- Use either:
  - Client-side HTML → PDF generation, or  
  - `POST /api/export-pdf` with the full `StoryState`.

The result (`pdfUrl` or direct PDF response) is surfaced to the user, preserving the StorySmith tone and experience (clear “Your book is ready” moment).

---

## 5. Validation & Error Handling

### 5.1 Frontend Validation

Frontend must:

- Validate required fields (e.g., `childName`, `ageBracket`) before calling APIs.
- Show friendly error messages aligned with StorySmith tone.
- Prevent calls with obviously invalid data (e.g., empty names, unsupported age ranges).

### 5.2 Backend Validation

Backend must:

- Validate incoming payload shapes and required fields.
- Return `{ "error": true, "message": string }` on invalid data.
- Not call the LLM provider if core data is missing or invalid.

### 5.3 LLM Response Validation

On receiving an LLM response:

- Parse as JSON.  
- Validate structure against the expected types:
  - Outline scenes.
  - Scene fields.
  - Text length / basic sanity checks (where applicable).

If invalid:

- Return a structured error to the frontend.
- Log details for debugging, without exposing raw provider responses to the user.

---

## 6. Change Management

Any change to:

- Data model types.  
- API contracts.  
- State behavior.

must be:

1. Updated in this file (`STATE_AND_APIS.md`).  
2. Logged in `DOCS/CHANGELOG_STORYSMITH.md`.  
3. Reviewed against `BLUEPRINT_V1_MASTER_v1.1.md` and `ARCHITECTURE.md` to avoid divergence.

No silent changes to types or endpoints are allowed.

---

## 7. Appendix A – Changelog Template (Reference)

For convenience, this appendix mirrors the structure of `DOCS/CHANGELOG_STORYSMITH.md`.

```markdown
# StorySmith Project Changelog

This file records all notable changes to the StorySmith v4 web project.  
Every patch, especially AI-generated ones, should be logged here.

---

## [YYYY-MM-DD]

### Summary
- Short description of the change (1–3 lines)

### Files Affected
- /path/to/file1.tsx
- /path/to/file2.ts

### Reason
- Why this change was made (bug fix, UX improvement, refactor, etc.)

### Author
- Commander / ChatGPT / Gemini / Other

### Notes
- Any caveats, migration notes, or follow-up tasks
```

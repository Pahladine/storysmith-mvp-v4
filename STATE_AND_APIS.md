\# StorySmith State \& API Contracts



This document defines the core data models and API contracts used in StorySmith v4.



---



\## 1. Data Models



All types are expressed in TypeScript-style notation. These are the source of truth for both frontend and backend.



\### 1.1 HeroProfile



```ts

export type HeroProfile = {

&nbsp; childName: string;

&nbsp; readerName?: string;          // e.g., "Grandpa Adam"

&nbsp; ageBracket: "3-5" | "6-8" | "9-11";

&nbsp; heroType: "human" | "animal" | "fantasy";

&nbsp; traits: string\[];             // \["brave", "curious"]

};



1.2 ReaderProfile

export type ReaderProfile = {

&nbsp; childName: string;

&nbsp; childAge: number;

&nbsp; relationshipDescription: string; // "Grandma \& Noah", "Grandpa \& Ayla"

};



1.3 StorySettings



export type StorySettings = {

&nbsp; adventureType: "cozy" | "silly" | "brave" | "mystery";

&nbsp; length: "short" | "medium";

&nbsp; favoritePlace?: string;

&nbsp; favoriteFriend?: string;

&nbsp; extraDetails?: string;

&nbsp; setting?: string;   // e.g. "forest", "space"

&nbsp; tone?: "gentle" | "exciting" | "funny";

};



1.4 StoryScene

export type StoryScene = {

&nbsp; id: string;

&nbsp; index: number;

&nbsp; title: string;

&nbsp; summary?: string;           // used in outline

&nbsp; text: string;

&nbsp; illustrationPrompt?: string;

};



1.5 StoryOutline

export type StoryOutline = {

&nbsp; scenes: {

&nbsp;   id: string;

&nbsp;   index: number;

&nbsp;   title: string;

&nbsp;   summary: string;

&nbsp; }\[];

};



1.6 StoryState

export type StoryState = {

&nbsp; hero: HeroProfile;

&nbsp; reader: ReaderProfile;

&nbsp; settings: StorySettings;

&nbsp; outline: StoryOutline | null;

&nbsp; scenes: StoryScene\[];

};



1.7 AssetBundle (Export)

export type AssetBundle = {

&nbsp; story: StoryState;

&nbsp; layoutVariant: "simple-v1";

&nbsp; exportHtml: string;        // final HTML

&nbsp; exportPdfUrl?: string;     // if using external service or pre-generated PDF

};



2\. StoryEngine Interface (Conceptual)

The backend uses a StoryEngine abstraction to interact with the LLM.

export type StoryEngine = {

&nbsp; generateOutline(

&nbsp;   hero: HeroProfile,

&nbsp;   reader: ReaderProfile,

&nbsp;   settings: StorySettings

&nbsp; ): Promise<StoryOutline>;



&nbsp; generateScenes(

&nbsp;   hero: HeroProfile,

&nbsp;   reader: ReaderProfile,

&nbsp;   settings: StorySettings,

&nbsp;   outline: StoryOutline

&nbsp; ): Promise<StoryScene\[]>;



&nbsp; regenerateScene(

&nbsp;   hero: HeroProfile,

&nbsp;   reader: ReaderProfile,

&nbsp;   settings: StorySettings,

&nbsp;   outline: StoryOutline,

&nbsp;   sceneId: string

&nbsp; ): Promise<StoryScene>;



&nbsp; refineSceneTone?(

&nbsp;   scene: StoryScene,

&nbsp;   direction: "sillier" | "calmer"

&nbsp; ): Promise<StoryScene>;

};





3\. API Specifications

All endpoints are POST and expect/return JSON.

3.1 POST /api/generate-outline

Description:

Generate a multi-scene outline based on hero, reader, and story settings.

Request Body:

{

&nbsp; "hero": { /\* HeroProfile \*/ },

&nbsp; "reader": { /\* ReaderProfile \*/ },

&nbsp; "settings": { /\* StorySettings \*/ }

}



Response Body (success): 

{

&nbsp; "outline": {

&nbsp;   "scenes": \[

&nbsp;     {

&nbsp;       "id": "scene-1",

&nbsp;       "index": 1,

&nbsp;       "title": "A Quiet Night at Home",

&nbsp;       "summary": "The hero is introduced and a strange noise is heard."

&nbsp;     }

&nbsp;     // ...

&nbsp;   ]

&nbsp; }

}



Response Body (error): 

{

&nbsp; "error": true,

&nbsp; "message": "Description of what went wrong"

}



3.2 POST /api/generate-scenes

Description:

Generate full scenes from a story outline.

Request Body:

{

&nbsp; "hero": { /\* HeroProfile \*/ },

&nbsp; "reader": { /\* ReaderProfile \*/ },

&nbsp; "settings": { /\* StorySettings \*/ },

&nbsp; "outline": { /\* StoryOutline \*/ }

}



Response Body (success): 

{

&nbsp; "scenes": \[

&nbsp;   {

&nbsp;     "id": "scene-1",

&nbsp;     "index": 1,

&nbsp;     "title": "A Quiet Night at Home",

&nbsp;     "summary": "The hero is introduced and a strange noise is heard.",

&nbsp;     "text": "Full scene text here...",

&nbsp;     "illustrationPrompt": "Prompt for illustration of this scene..."

&nbsp;   }

&nbsp;   // ...

&nbsp; ]

}



Response Body (error): 

{

&nbsp; "error": true,

&nbsp; "message": "Description of what went wrong"

}



3.3 POST /api/regenerate-scene

Description:

Regenerate a single scene by sceneId.

Request Body:

{

&nbsp; "hero": { /\* HeroProfile \*/ },

&nbsp; "reader": { /\* ReaderProfile \*/ },

&nbsp; "settings": { /\* StorySettings \*/ },

&nbsp; "outline": { /\* StoryOutline \*/ },

&nbsp; "sceneId": "scene-3"

}



Response Body (success): 

{

&nbsp; "scene": {

&nbsp;   "id": "scene-3",

&nbsp;   "index": 3,

&nbsp;   "title": "Into the Forest",

&nbsp;   "summary": "The hero follows the sound into the trees.",

&nbsp;   "text": "Regenerated scene text...",

&nbsp;   "illustrationPrompt": "Updated art prompt..."

&nbsp; }

}



Response Body (error): 

{

&nbsp; "error": true,

&nbsp; "message": "Description of what went wrong"

}



3.4 POST /api/export-pdf (Optional in v4)

Description:

Convert a story into a PDF (or return a link to a generated PDF).

Request Body:

{

&nbsp; "storyState": { /\* StoryState \*/ }

}





Response Body (success, direct download):

&nbsp;   • Either binary PDF response with headers, or:

{

&nbsp; "pdfUrl": "https://.../some-generated.pdf"

}



Response Body (error): 

{

&nbsp; "error": true,

&nbsp; "message": "Description of what went wrong"

}



Implementation details (local vs external service) can be decided later.



4\. State Lifecycle

4.1 Creation

&nbsp;   • On /start, create:

&nbsp;       ◦ HeroProfile

&nbsp;       ◦ ReaderProfile

&nbsp;       ◦ StorySettings

&nbsp;   • Write to React context and optionally to sessionStorage.

4.2 Outline Generation

&nbsp;   • On /build, call generate-outline with:

&nbsp;       ◦ hero, reader, settings

&nbsp;   • Store StoryOutline in context and optionally in sessionStorage.

4.3 Scene Generation

&nbsp;   • On user action (“Generate full story”), call generate-scenes.

&nbsp;   • Store returned StoryScene\[] in context.

4.4 Editing \& Regeneration

&nbsp;   • On scene-level changes, call regenerate-scene.

&nbsp;   • Replace the scene with matching id in StoryState.

4.5 Export

&nbsp;   • On export, either:

&nbsp;       ◦ Use client-side HTML → PDF; or

&nbsp;       ◦ Call export-pdf with StoryState.



5\. Validation \& Error Handling

5.1 Frontend validation

&nbsp;   • Validate required fields (e.g., childName, ageBracket) before sending to API.

&nbsp;   • Use friendly error messages.

5.2 Backend validation

&nbsp;   • Validate incoming payload shapes and required fields.

&nbsp;   • Return error: true and message on invalid data.

&nbsp;   • Do not call the LLM provider if core data is missing or invalid.

5.3 LLM response validation

&nbsp;   • Parse response as JSON.

&nbsp;   • Validate structure against expected types.

&nbsp;   • If invalid, return a structured error and log details.



6\. Change Management

Any change to:

&nbsp;   • Data model types

&nbsp;   • API contracts

&nbsp;   • State behavior

must be:

&nbsp;   1. Updated in this file (STATE\_AND\_APIS.md)

&nbsp;   2. Logged in CHANGELOG\_STORYSMITH.md

&nbsp;   3. Aligned with BLUEPRINT\_V1\_MASTER.md and ARCHITECTURE.md

This prevents silent divergence between implementation and documentation.





---



\## 5. `DOCS/CHANGELOG\_STORYSMITH.md`



```markdown

\# StorySmith Project Changelog



This file records all notable changes to the StorySmith v4 web project.  

Every patch, especially AI-generated ones, should be logged here.



---



\## \[YYYY-MM-DD]



\### Summary

\- Short description of the change (1–3 lines)



\### Files Affected

\- /path/to/file1.tsx

\- /path/to/file2.ts



\### Reason

\- Why this change was made (bug fix, UX improvement, refactor, etc.)



\### Author

\- Commander / ChatGPT / Gemini / Other



\### Notes

\- Any caveats, migration notes, or follow-up tasks





---



\## Example Entries



\## 2025-12-09



\### Summary

\- Created initial DOCS structure and core blueprint documents.



\### Files Affected

\- /DOCS/BLUEPRINT\_V1\_MASTER.md

\- /DOCS/ARCHITECTURE.md

\- /DOCS/ROUTES\_AND\_PAGES.md

\- /DOCS/STATE\_AND\_APIS.md

\- /DOCS/CHANGELOG\_STORYSMITH.md



\### Reason

\- Establish a central “brain” for StorySmith v4 and prevent architectural drift.



\### Author

\- Commander (with AI assistance)



\### Notes

\- All future architectural and API changes must be reflected here and in relevant DOCS files.


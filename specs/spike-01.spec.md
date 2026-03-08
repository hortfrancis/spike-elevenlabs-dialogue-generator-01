# spike-elevenlabs-dialogue-generator-01 — Spec

## Purpose

Build a **local-only Node + TypeScript backend spike** that wraps the ElevenLabs text-to-speech API behind a simple local HTTP endpoint.

The spike should let the user send:

* a project ID
* a section ID
* a human-friendly voice label
* a short piece of dialogue text

If successful, the backend should:

* resolve the voice label to an ElevenLabs `voiceId` using a local JSON mapping file
* call the ElevenLabs API
* save the returned audio file into the local project directory
* return JSON metadata about the saved file

If unsuccessful, the backend should:

* return a clear HTTP error code
* return a readable JSON error body
* avoid leaving corrupted output files behind

This spike is intentionally **backend-only**.
There is **no web UI** in scope.
Testing should be done manually with **Bruno**.

---

## Non-goals

Do **not** implement any of the following in this spike:

* React frontend
* timeline UI
* playback UI
* section generation in one request
* parsing XML-like multi-line dialogue text
* project database
* auth
* cloud deployment
* Strudel integration
* ambience generation
* LM-based editing

This spike is for **one dialogue line per request**.

---

## Success criteria

The spike is successful when:

* the server starts locally
* a Bruno request can hit `POST /generate-dialogue-line`
* a valid request generates one audio file via ElevenLabs
* that file is saved to `projects/<projectId>/generated/dialogue/<sectionId>/`
* the API returns metadata describing the generated file
* invalid input returns `400`
* unknown voice label returns `400`
* ElevenLabs failure returns `502`
* unexpected local errors return `500`

---

## Starting point

Start from a **brand new empty folder**.

Recommended repo name:

```text
spike-elevenlabs-dialogue-generator-01
```

---

## Tech stack

* Node.js
* TypeScript
* Fastify **or** Express
* Zod for request validation
* native `fetch` or official ElevenLabs SDK
* dotenv for environment variable loading
* Bruno for manual API testing

Recommendation:

* use **Fastify** for a small, typed local API
* use **native fetch** unless the SDK clearly simplifies binary response handling

---

## Runtime model

The app runs locally as a simple HTTP server.

Example local dev URL:

```text
http://localhost:3001
```

No authentication is required because this is a local-only development tool.

---

## Project structure

```text
spike-elevenlabs-dialogue-generator-01/
  src/
    index.ts
    server.ts
    routes/
      generateDialogueLine.ts
    services/
      elevenlabsService.ts
      voiceResolver.ts
      fileStorage.ts
    schemas/
      generateDialogueLineSchema.ts
    utils/
      errors.ts
      paths.ts
  projects/
    demo-project/
      voices.json
      generated/
        dialogue/
  bruno/
    generate-dialogue-line.bru
  .env
  .env.example
  package.json
  tsconfig.json
  README.md
```

---

## Environment variables

### Required

* `ELEVENLABS_API_KEY`

### Optional

* `PORT`

### `.env.example`

```env
ELEVENLABS_API_KEY=your_api_key_here
PORT=3001
```

---

## Local voice mapping

The backend should support a human-friendly voice label instead of requiring raw ElevenLabs voice IDs in every request.

### Location

```text
projects/<projectId>/voices.json
```

### Example `projects/demo-project/voices.json`

```json
{
  "doctor": {
    "voiceId": "JBFqnCBsd6RMkjVDRZzb",
    "displayName": "Doctor"
  },
  "naz": {
    "voiceId": "EXAVITQu4vr4xnSDxMaL",
    "displayName": "Naz"
  }
}
```

### Rules

* request uses `voice`, not `voiceId`
* backend loads the relevant `voices.json`
* backend resolves `voice` label to `voiceId`
* if label is missing, return `400`

---

## API design

### Endpoint

```http
POST /generate-dialogue-line
```

### Request body

```json
{
  "projectId": "demo-project",
  "sectionId": "intro-scene",
  "voice": "doctor",
  "text": "[thoughtful] I thought there might something like this going on..."
}
```

### Field rules

* `projectId`: required, slug (lowercase letters, digits, hyphens only; e.g. `demo-project`)
* `sectionId`: required, slug (same format; e.g. `intro-scene`)
* `voice`: required, string, non-empty
* `text`: required, string, non-empty

### Notes

* this endpoint handles **one line only**
* `text` may contain inline style cues like `[thoughtful]` or `[annoyed]`
* those cues are passed through unchanged to ElevenLabs

---

## Response design

### Success response

HTTP status:

```http
201 Created
```

Body:

```json
{
  "projectId": "demo-project",
  "sectionId": "intro-scene",
  "voice": "doctor",
  "filename": "001-doctor.mp3",
  "relativePath": "generated/dialogue/intro-scene/001-doctor.mp3",
  "absolutePath": "/absolute/path/to/projects/demo-project/generated/dialogue/intro-scene/001-doctor.mp3",
  "text": "[thoughtful] I thought there might something like this going on..."
}
```

### Error response shape

All errors should return JSON in this form:

```json
{
  "error": {
    "code": "UNKNOWN_VOICE",
    "message": "Voice label 'doctor-wrong' was not found in projects/demo-project/voices.json"
  }
}
```

---

## HTTP error behavior

### `400 Bad Request`

Use for:

* invalid request body
* missing required fields
* unknown `projectId` path context if project folder does not exist
* unknown voice label in `voices.json`

Example error codes:

* `INVALID_REQUEST`
* `UNKNOWN_PROJECT`
* `UNKNOWN_VOICE`

### `502 Bad Gateway`

Use for:

* ElevenLabs API errors
* failed upstream generation

Example error code:

* `ELEVENLABS_ERROR`

### `500 Internal Server Error`

Use for:

* filesystem write failures
* unexpected unhandled errors

Example error code:

* `INTERNAL_ERROR`

---

## File storage rules

### Output directory

Generated files must be saved to:

```text
projects/<projectId>/generated/dialogue/<sectionId>/
```

### Example

```text
projects/demo-project/generated/dialogue/intro-scene/001-doctor.mp3
```

### File naming

For this spike, use deterministic incrementing names per section:

```text
001-doctor.mp3
002-naz.mp3
003-doctor.mp3
```

### Naming rules

* zero-padded numeric prefix
* kebab-case/safe filename version of the `voice` label
* file extension matches upstream API output (e.g. `.mp3` for default ElevenLabs format)

### Counter behavior

When saving a new file for a section:

* inspect existing files in the target section folder
* choose the next numeric prefix
* do not overwrite existing files automatically in this spike

---

## ElevenLabs integration

### Goal

Generate one spoken dialogue line from one request.

### Request behavior

The backend should:

1. resolve the voice label to a real ElevenLabs `voiceId`
2. call the ElevenLabs text-to-speech API for that single line
3. request an audio format suitable for local file storage
4. receive the binary audio response
5. write it to disk

### Model choice

Use a configurable model ID.

Default recommendation:

```text
eleven_v3
```

This should be kept in code as a constant or config value so it can be changed later.

### Suggested service signature

```ts
export interface GenerateDialogueLineInput {
  voiceId: string;
  text: string;
}

export interface GenerateDialogueLineResult {
  audioBuffer: ArrayBuffer;
  contentType?: string;
}
```

### Suggested implementation detail

Use a dedicated service module, for example:

```ts
src/services/elevenlabsService.ts
```

This module should be the only place that knows about ElevenLabs HTTP details.

---

## Validation

Use **Zod** for request body validation.

### Request schema requirements

* `projectId`: strict slug (e.g. `z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)`)
* `sectionId`: strict slug (same)
* `voice`: `z.string().min(1)`
* `text`: `z.string().min(1)`

Return `400` on validation failure. `GET /projects/:projectId/voices` validates `projectId` as a slug in params. `voices.json` is validated with Zod when loaded (object of voice labels to `{ voiceId, displayName? }`).

---

## Internal flow

### Request handling flow

1. receive POST request
2. validate body with Zod
3. resolve paths for project and output directory
4. ensure `projects/<projectId>` exists
5. load and parse `voices.json`
6. resolve `voice` to `voiceId`
7. create output directory if missing
8. compute next filename
9. call ElevenLabs
10. save returned audio buffer to file
11. return `201` with metadata JSON

### Failure flow

* if validation fails: return `400`
* if project folder missing: return `400`
* if `voices.json` missing or invalid: return `500` or `400` depending on chosen interpretation
* if voice not found: return `400`
* if ElevenLabs request fails: return `502`
* if file write fails: return `500`

---

## Logging

Add minimal server logs for local debugging.

Log at least:

* incoming request summary
* resolved voice label and `voiceId`
* output file path
* ElevenLabs failures
* write failures

Do not log the API key.

---

## Bruno support

Add a Bruno request file for easy local manual testing.

### Example Bruno request body

```json
{
  "projectId": "demo-project",
  "sectionId": "intro-scene",
  "voice": "doctor",
  "text": "[thoughtful] I thought there might something like this going on..."
}
```

### Expected test cases

#### Success

* known project
* known voice
* non-empty text
* file created successfully

#### Failure: unknown voice

* use `voice: "unknown"`
* expect `400`

#### Failure: empty text

* use `text: ""`
* expect `400`

#### Failure: bad project

* use missing `projectId`
* expect `400`

---

## NPM scripts

At minimum:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js"
  }
}
```

Using `tsx` for local dev is acceptable and recommended for simplicity.

---

## README requirements

The README should explain:

* what the spike does
* how to install dependencies
* how to create `.env`
* how to set up `projects/demo-project/voices.json`
* how to start the server
* how to test with Bruno
* where generated files are saved

---

## Definition of done

The spike is done when all of the following are true:

* repo can be cloned and installed
* `.env` can be configured with an ElevenLabs API key
* server starts locally
* `POST /generate-dialogue-line` accepts a valid request
* backend resolves a friendly voice label from `voices.json`
* backend successfully calls ElevenLabs
* backend saves one audio file to `projects/<projectId>/generated/dialogue/<sectionId>/`
* response returns file metadata
* error scenarios return the expected status codes and JSON shape
* Bruno can be used to verify success and failure cases

---

## Recommended first Cursor prompt

Create a new Node + TypeScript backend project for a local-only spike called `spike-elevenlabs-dialogue-generator-01`.

Implement:

* a Fastify or Express server in TypeScript
* environment variable loading via dotenv
* a `POST /generate-dialogue-line` endpoint
* Zod validation for the request body
* local voice resolution from `projects/<projectId>/voices.json`
* an ElevenLabs service wrapper that calls text-to-speech for one line of text
* file saving to `projects/<projectId>/generated/dialogue/<sectionId>/`
* deterministic incrementing filenames like `001-doctor.mp3`
* JSON success and error responses as described in the spec
* a sample `projects/demo-project/voices.json`
* a README with setup instructions

Keep the implementation small, readable, and modular.
Do not build a frontend.
Do not implement multi-line parsing or timeline features.
Focus only on one dialogue line per request.

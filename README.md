# spike-elevenlabs-dialogue-generator-01

Local-only Node + TypeScript backend spike that wraps the ElevenLabs text-to-speech API. You send one dialogue line per request (project, section, voice label, text); the server resolves the voice from a local JSON map, calls ElevenLabs, and saves the audio under the project directory.

**Backend only** — no web UI. Manual testing is done with [Bruno](https://www.usebruno.com/).

## What it does

- **POST /generate-dialogue-line** — accepts `projectId`, `sectionId`, `voice`, and `text`. Resolves `voice` to an ElevenLabs `voiceId` via `projects/<projectId>/voices.json`, calls the ElevenLabs API, and saves the returned audio to `projects/<projectId>/generated/dialogue/<sectionId>/` with deterministic names like `001-doctor.wav`. Returns JSON metadata (filename, paths, etc.) on success, or a structured JSON error with an appropriate HTTP status on failure.

## Install

```bash
npm install
```

## Environment

1. Copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Set your ElevenLabs API key in `.env`:
   ```env
   ELEVENLABS_API_KEY=your_api_key_here
   PORT=3001
   ```
   `PORT` is optional (defaults to 3001).

## Project setup (voices)

Each project has a `voices.json` that maps human-friendly labels to ElevenLabs voice IDs. For the demo project:

**Path:** `projects/demo-project/voices.json`

**Example:**

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

Create or edit this file for your project; the repo includes a sample for `demo-project`.

## Run the server

```bash
npm run dev
```

Server listens at **http://localhost:3001** (or the port in `PORT`).

Other scripts:

- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run compiled `dist/index.js`

## Test with Bruno

1. Install [Bruno](https://www.usebruno.com/) and open this repo (or add the `bruno/` folder as a collection).
2. Open **Generate dialogue line** in `bruno/generate-dialogue-line.bru`.
3. Send the request. Default body uses `demo-project`, `intro-scene`, voice `doctor`, and sample text.

**Suggested checks:**

- **Success:** Valid `projectId`, `sectionId`, `voice` from `voices.json`, non-empty `text` → expect **201** and JSON with `filename`, `relativePath`, `absolutePath`. A new file appears under `projects/<projectId>/generated/dialogue/<sectionId>/`.
- **Unknown voice:** Set `voice` to `"unknown"` → expect **400** and error code `UNKNOWN_VOICE`.
- **Empty text:** Set `text` to `""` → expect **400** and `INVALID_REQUEST`.
- **Bad project:** Use a non-existent `projectId` or omit required fields → expect **400** (`UNKNOWN_PROJECT` or `INVALID_REQUEST`).

## Where files are saved

Generated audio is written to:

```text
projects/<projectId>/generated/dialogue/<sectionId>/<NNN>-<voice>.wav
```

Example: `projects/demo-project/generated/dialogue/intro-scene/001-doctor.wav`. The numeric prefix increments per section so existing files are not overwritten.

## Error responses

All errors return JSON in the form:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

| Status | Typical codes |
|--------|----------------|
| 400    | `INVALID_REQUEST`, `UNKNOWN_PROJECT`, `UNKNOWN_VOICE` |
| 502    | `ELEVENLABS_ERROR` (upstream API failure) |
| 500    | `INTERNAL_ERROR` (e.g. filesystem or config) |

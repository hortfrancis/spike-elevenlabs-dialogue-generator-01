/**
 * ElevenLabs text-to-speech API wrapper.
 * Only place that knows about ElevenLabs HTTP details.
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_MODEL_ID = "eleven_v3";
/** MP3 44.1kHz 128kbps – API default, works on Creator tier (wav_44100 requires Pro). */
const OUTPUT_FORMAT = "mp3_44100_128";

async function parseAndThrowIfNotOk(res: Response): Promise<void> {
  if (res.ok) return;
  const text = await res.text();
  let detail: string = text;
  try {
    const json = JSON.parse(text) as {
      detail?: string | Record<string, unknown>;
      message?: string | Record<string, unknown>;
    };
    const raw =
      json.detail !== undefined
        ? json.detail
        : json.message !== undefined
          ? json.message
          : text;
    if (typeof raw === "string") {
      detail = raw;
    } else if (
      raw !== null &&
      typeof raw === "object" &&
      "message" in raw &&
      typeof (raw as { message: unknown }).message === "string"
    ) {
      detail = (raw as { message: string }).message;
    } else {
      detail = JSON.stringify(raw);
    }
  } catch {
    // use raw text
  }
  throw new ElevenLabsError(res.status, detail);
}

export interface GenerateDialogueLineInput {
  voiceId: string;
  text: string;
}

export interface GenerateDialogueLineResult {
  audioBuffer: ArrayBuffer;
  contentType?: string;
}

export interface ElevenLabsConfig {
  apiKey: string;
  modelId?: string;
}

export interface VoiceItem {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
  [key: string]: unknown;
}

export interface ListVoicesResult {
  voices: VoiceItem[];
}

export interface ListVoicesConfig {
  apiKey: string;
  showLegacy?: boolean;
}

/**
 * Call ElevenLabs GET /voices and return the list of account voices.
 */
export async function listVoices(config: ListVoicesConfig): Promise<ListVoicesResult> {
  const url =
    config.showLegacy === true
      ? `${ELEVENLABS_BASE}/voices?show_legacy=true`
      : `${ELEVENLABS_BASE}/voices`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": config.apiKey,
    },
  });
  await parseAndThrowIfNotOk(res);
  const data = (await res.json()) as ListVoicesResult;
  return data;
}

/**
 * Call ElevenLabs text-to-speech and return the binary audio.
 */
export async function generateDialogueLine(
  input: GenerateDialogueLineInput,
  config: ElevenLabsConfig
): Promise<GenerateDialogueLineResult> {
  const modelId = config.modelId ?? DEFAULT_MODEL_ID;
  const url = `${ELEVENLABS_BASE}/text-to-speech/${encodeURIComponent(input.voiceId)}?output_format=${OUTPUT_FORMAT}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": config.apiKey,
    },
    body: JSON.stringify({
      text: input.text,
      model_id: modelId,
    }),
  });

  await parseAndThrowIfNotOk(res);

  const audioBuffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? undefined;
  return { audioBuffer, contentType };
}

export class ElevenLabsError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "ElevenLabsError";
  }
}

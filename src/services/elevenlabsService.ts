/**
 * ElevenLabs text-to-speech API wrapper.
 * Only place that knows about ElevenLabs HTTP details.
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_MODEL_ID = "eleven_v3";
const OUTPUT_FORMAT = "wav_44100";

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

  if (!res.ok) {
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

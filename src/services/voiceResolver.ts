import { readFile } from "node:fs/promises";
import { getVoicesJsonPath } from "../utils/paths.js";
import { voicesJsonSchema, type VoiceEntry, type VoicesMap } from "../schemas/voicesJson.js";

export type { VoiceEntry, VoicesMap };

/**
 * Load and parse projects/<projectId>/voices.json.
 * @throws if file is missing, invalid JSON, or fails Zod validation
 */
export async function loadVoices(projectId: string): Promise<VoicesMap> {
  const voicesPath = getVoicesJsonPath(projectId);
  const raw = await readFile(voicesPath, "utf-8");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error("voices.json is not valid JSON");
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("voices.json must be an object");
  }
  const result = voicesJsonSchema.safeParse(data);
  if (!result.success) {
    const first = result.error.errors[0];
    const path = first?.path?.length ? first.path.join(".") : "root";
    throw new Error(`voices.json validation failed at ${path}: ${first?.message ?? "invalid structure"}`);
  }
  return result.data;
}

/**
 * Resolve a human-friendly voice label to an ElevenLabs voiceId.
 * Returns voiceId if found, null if label not in map.
 */
export function resolveVoice(voices: VoicesMap, voice: string): string | null {
  const entry = voices[voice];
  return entry ? entry.voiceId : null;
}

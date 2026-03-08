import { readFile } from "node:fs/promises";
import { getVoicesJsonPath } from "../utils/paths.js";

export interface VoiceEntry {
  voiceId: string;
  displayName?: string;
}

export type VoicesMap = Record<string, VoiceEntry>;

/**
 * Load and parse projects/<projectId>/voices.json.
 * @throws if file is missing or invalid JSON
 */
export async function loadVoices(projectId: string): Promise<VoicesMap> {
  const voicesPath = getVoicesJsonPath(projectId);
  const raw = await readFile(voicesPath, "utf-8");
  const data = JSON.parse(raw) as unknown;
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("voices.json must be an object");
  }
  const map: VoicesMap = {};
  for (const [label, entry] of Object.entries(data)) {
    if (
      entry !== null &&
      typeof entry === "object" &&
      "voiceId" in entry &&
      typeof (entry as VoiceEntry).voiceId === "string"
    ) {
      map[label] = entry as VoiceEntry;
    }
  }
  return map;
}

/**
 * Resolve a human-friendly voice label to an ElevenLabs voiceId.
 * Returns voiceId if found, null if label not in map.
 */
export function resolveVoice(voices: VoicesMap, voice: string): string | null {
  const entry = voices[voice];
  return entry ? entry.voiceId : null;
}

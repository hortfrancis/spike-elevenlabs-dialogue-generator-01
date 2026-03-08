import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getDialogueOutputDir } from "../utils/paths.js";

/**
 * Safe filename segment from voice label: kebab-case, no path separators.
 */
function safeVoiceSegment(voice: string): string {
  return voice
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Parse existing filenames in the section folder to find the next numeric prefix.
 * Expects names like 001-doctor.mp3, 002-naz.mp3 (or .wav).
 */
async function getNextSequenceNumber(
  outputDir: string,
  voiceSegment: string
): Promise<number> {
  let next = 1;
  try {
    const entries = await readdir(outputDir, { withFileTypes: true });
    const prefixPattern = /^(\d+)-/;
    for (const e of entries) {
      if (!e.isFile()) continue;
      const m = e.name.match(prefixPattern);
      if (m) {
        const n = parseInt(m[1]!, 10);
        if (n >= next) next = n + 1;
      }
    }
  } catch (err) {
    const nodeErr = err as NodeJS.ErrnoException;
    if (nodeErr.code !== "ENOENT") throw err;
    // directory doesn't exist yet, use 1
  }
  return next;
}

export interface SaveDialogueResult {
  filename: string;
  absolutePath: string;
}

/**
 * Ensure output directory exists, compute next filename, write audio buffer.
 * @param extension - File extension without dot (e.g. "mp3", "wav"). Default "mp3".
 */
export async function saveDialogueAudio(
  projectId: string,
  sectionId: string,
  voice: string,
  audioBuffer: ArrayBuffer,
  extension: string = "mp3"
): Promise<SaveDialogueResult> {
  const outputDir = getDialogueOutputDir(projectId, sectionId);
  await mkdir(outputDir, { recursive: true });

  const voiceSegment = safeVoiceSegment(voice);
  const nextNum = await getNextSequenceNumber(outputDir, voiceSegment);
  const filename = `${String(nextNum).padStart(3, "0")}-${voiceSegment}.${extension}`;
  const absolutePath = path.join(outputDir, filename);

  const buffer = Buffer.from(audioBuffer);
  await writeFile(absolutePath, buffer);

  return { filename, absolutePath };
}

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Root of the repo (parent of src). */
export const projectRoot = path.resolve(__dirname, "..", "..");

/** Directory for all projects. */
export const projectsDir = path.join(projectRoot, "projects");

export function getProjectDir(projectId: string): string {
  return path.join(projectsDir, projectId);
}

export function getVoicesJsonPath(projectId: string): string {
  return path.join(getProjectDir(projectId), "voices.json");
}

export function getDialogueOutputDir(projectId: string, sectionId: string): string {
  return path.join(getProjectDir(projectId), "generated", "dialogue", sectionId);
}

/**
 * Relative path from project root: generated/dialogue/<sectionId>/<filename>
 */
export function getRelativeDialoguePath(
  sectionId: string,
  filename: string
): string {
  return path.join("generated", "dialogue", sectionId, filename);
}

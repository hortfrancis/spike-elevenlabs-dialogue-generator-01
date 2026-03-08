import { z } from "zod";

/**
 * Strict slug: lowercase letters, digits, single hyphens; no leading/trailing hyphen.
 * Examples: "demo-project", "intro-scene", "my-section-2"
 */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(1, "required")
  .regex(
    SLUG_REGEX,
    "must be a slug (lowercase letters, digits, hyphens only; no leading/trailing hyphen)"
  );

export const projectIdParamSchema = z.object({
  projectId: slugSchema,
});

export type ProjectIdParams = z.infer<typeof projectIdParamSchema>;

import { z } from "zod";
import { slugSchema } from "./slugs.js";

export const generateDialogueLineBodySchema = z.object({
  projectId: slugSchema,
  sectionId: slugSchema,
  voice: z.string().min(1, "voice is required"),
  text: z.string().min(1, "text is required"),
});

export type GenerateDialogueLineBody = z.infer<
  typeof generateDialogueLineBodySchema
>;

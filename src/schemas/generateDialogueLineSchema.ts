import { z } from "zod";

export const generateDialogueLineBodySchema = z.object({
  projectId: z.string().min(1, "projectId is required"),
  sectionId: z.string().min(1, "sectionId is required"),
  voice: z.string().min(1, "voice is required"),
  text: z.string().min(1, "text is required"),
});

export type GenerateDialogueLineBody = z.infer<
  typeof generateDialogueLineBodySchema
>;

import { z } from "zod";

export const voiceEntrySchema = z.object({
  voiceId: z.string().min(1, "voiceId is required"),
  displayName: z.string().optional(),
});

export const voicesJsonSchema = z.record(
  z.string().min(1, "voice label cannot be empty"),
  voiceEntrySchema
);

export type VoiceEntry = z.infer<typeof voiceEntrySchema>;
export type VoicesMap = z.infer<typeof voicesJsonSchema>;

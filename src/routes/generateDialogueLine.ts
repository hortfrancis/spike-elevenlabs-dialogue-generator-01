import { FastifyPluginAsync } from "fastify";
import { existsSync } from "node:fs";
import {
  generateDialogueLineBodySchema,
  type GenerateDialogueLineBody,
} from "../schemas/generateDialogueLineSchema.js";
import { loadVoices, resolveVoice } from "../services/voiceResolver.js";
import {
  generateDialogueLine as callElevenLabs,
  ElevenLabsError,
} from "../services/elevenlabsService.js";
import { saveDialogueAudio } from "../services/fileStorage.js";
import {
  getProjectDir,
  getRelativeDialoguePath,
} from "../utils/paths.js";
import { apiError } from "../utils/errors.js";

export const generateDialogueLineRoute: FastifyPluginAsync = async (app) => {
  app.post<{
    Body: GenerateDialogueLineBody;
  }>("/generate-dialogue-line", async (request, reply) => {
    const bodyResult = generateDialogueLineBodySchema.safeParse(request.body);

    if (!bodyResult.success) {
      request.log.info(
        { validation: bodyResult.error.flatten() },
        "Request validation failed"
      );
      return reply.status(400).send(
        apiError(
          "INVALID_REQUEST",
          bodyResult.error.errors.map((e) => e.message).join("; ") ||
            "Invalid request body"
        )
      );
    }

    const { projectId, sectionId, voice, text } = bodyResult.data;

    // Ensure project folder exists
    const projectDir = getProjectDir(projectId);
    if (!existsSync(projectDir)) {
      request.log.info({ projectId, projectDir }, "Project folder not found");
      return reply.status(400).send(
        apiError(
          "UNKNOWN_PROJECT",
          `Project '${projectId}' not found at ${projectDir}`
        )
      );
    }

    let voices;
    try {
      voices = await loadVoices(projectId);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load voices.json";
      request.log.warn({ err, projectId }, "Failed to load voices.json");
      return reply.status(400).send(
        apiError(
          "UNKNOWN_PROJECT",
          `Could not load voices for project '${projectId}': ${message}`
        )
      );
    }

    const voiceId = resolveVoice(voices, voice);
    if (voiceId === null) {
      request.log.info({ voice, projectId }, "Unknown voice label");
      return reply.status(400).send(
        apiError(
          "UNKNOWN_VOICE",
          `Voice label '${voice}' was not found in projects/${projectId}/voices.json`
        )
      );
    }

    request.log.info(
      { voice, voiceId, projectId, sectionId },
      "Resolved voice, calling ElevenLabs"
    );

    let audioBuffer: ArrayBuffer;
    try {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        request.log.error("ELEVENLABS_API_KEY is not set");
        return reply.status(500).send(
          apiError(
            "INTERNAL_ERROR",
            "ELEVENLABS_API_KEY is not set. Set it in your environment or .env file."
          )
        );
      }
      const result = await callElevenLabs(
        { voiceId, text },
        { apiKey }
      );
      audioBuffer = result.audioBuffer;
    } catch (err) {
      if (err instanceof ElevenLabsError) {
        request.log.warn({ statusCode: err.statusCode }, "ElevenLabs API error");
        return reply.status(502).send(
          apiError("ELEVENLABS_ERROR", err.message)
        );
      }
      request.log.warn({ err }, "ElevenLabs request failed");
      return reply.status(502).send(
        apiError(
          "ELEVENLABS_ERROR",
          err instanceof Error ? err.message : "Upstream generation failed"
        )
      );
    }

    let saveResult;
    try {
      saveResult = await saveDialogueAudio(
        projectId,
        sectionId,
        voice,
        audioBuffer
      );
    } catch (err) {
      request.log.error({ err, projectId, sectionId }, "File write failed");
      return reply.status(500).send(
        apiError(
          "INTERNAL_ERROR",
          err instanceof Error ? err.message : "Failed to save audio file"
        )
      );
    }

    const relativePath = getRelativeDialoguePath(sectionId, saveResult.filename);
    request.log.info(
      { path: saveResult.absolutePath, filename: saveResult.filename },
      "Saved dialogue file"
    );

    return reply.status(201).send({
      projectId,
      sectionId,
      voice,
      filename: saveResult.filename,
      relativePath,
      absolutePath: saveResult.absolutePath,
      text,
    });
  });
};

import { FastifyPluginAsync } from "fastify";
import { existsSync } from "node:fs";
import { loadVoices } from "../services/voiceResolver.js";
import { getProjectDir } from "../utils/paths.js";
import { apiError } from "../utils/errors.js";

export const listProjectVoicesRoute: FastifyPluginAsync = async (app) => {
  app.get<{
    Params: { projectId: string };
  }>("/projects/:projectId/voices", async (request, reply) => {
    const { projectId } = request.params;

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

    const voicesList = Object.entries(voices).map(([label, entry]) => ({
      label,
      voiceId: entry.voiceId,
      ...(entry.displayName !== undefined && { displayName: entry.displayName }),
    }));

    return reply.send({ voices: voicesList });
  });
};

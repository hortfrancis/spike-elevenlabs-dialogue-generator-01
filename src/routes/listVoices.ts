import { FastifyPluginAsync } from "fastify";
import { listVoices as callListVoices, ElevenLabsError } from "../services/elevenlabsService.js";
import { apiError } from "../utils/errors.js";

export const listVoicesRoute: FastifyPluginAsync = async (app) => {
  app.get<{
    Querystring: { show_legacy?: string };
  }>("/voices", async (request, reply) => {
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

    const showLegacy = request.query.show_legacy === "true" || request.query.show_legacy === "1";

    try {
      const result = await callListVoices({ apiKey, showLegacy });
      return reply.send(result);
    } catch (err) {
      if (err instanceof ElevenLabsError) {
        request.log.warn({ statusCode: err.statusCode }, "ElevenLabs API error");
        return reply.status(502).send(apiError("ELEVENLABS_ERROR", err.message));
      }
      request.log.warn({ err }, "ElevenLabs list voices failed");
      return reply.status(502).send(
        apiError(
          "ELEVENLABS_ERROR",
          err instanceof Error ? err.message : "Upstream request failed"
        )
      );
    }
  });
};

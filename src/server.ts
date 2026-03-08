import Fastify from "fastify";
import { generateDialogueLineRoute } from "./routes/generateDialogueLine.js";
import { listVoicesRoute } from "./routes/listVoices.js";
import { listProjectVoicesRoute } from "./routes/listProjectVoices.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  app.get("/health", async (_request, reply) => {
    return reply.send({ ok: true });
  });

  app.register(generateDialogueLineRoute, { prefix: "/" });
  app.register(listVoicesRoute, { prefix: "/" });
  app.register(listProjectVoicesRoute, { prefix: "/" });

  return app;
}

import Fastify from "fastify";
import { generateDialogueLineRoute } from "./routes/generateDialogueLine.js";

export async function buildServer() {
  const app = Fastify({ logger: true });

  app.register(generateDialogueLineRoute, { prefix: "/" });

  return app;
}

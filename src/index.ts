import "dotenv/config";
import { buildServer } from "./server.js";

const PORT = Number(process.env.PORT) || 3001;

async function main() {
  const app = await buildServer();
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`Server listening at http://localhost:${PORT}`);
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }
}

main();

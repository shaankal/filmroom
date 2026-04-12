import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "dotenv";

config();

const port = Number(process.env.PORT) || 3000;

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: "*" });

  app.get("/health", async () => ({
    status: "ok" as const,
    ts: new Date().toISOString(),
  }));

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

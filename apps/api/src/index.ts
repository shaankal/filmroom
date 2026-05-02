import "./loadEnv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth";
import { registerAuthRoutes } from "./routes/auth";
import { registerChallengeRoutes } from "./routes/challenges";
import { registerLeagueRoutes } from "./routes/leagues";

const port = Number(process.env.PORT) || 3000;

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: "*" });
  await app.register(authPlugin);

  app.get("/health", async () => ({
    status: "ok" as const,
    ts: new Date().toISOString(),
  }));

  await registerAuthRoutes(app);
  await registerLeagueRoutes(app);
  await registerChallengeRoutes(app);

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

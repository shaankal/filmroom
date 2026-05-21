import "./loadEnv";
import Fastify from "fastify";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth";
import { registerAuthRoutes } from "./routes/auth";
import { registerChallengeRoutes } from "./routes/challenges";
import { registerInternalRoutes } from "./routes/internal";
import { registerLeagueRoutes } from "./routes/leagues";
import { registerPaymentRoutes } from "./routes/payments";
import { registerProfileRoutes } from "./routes/profile";
import { registerSundayRoutes } from "./routes/sunday";

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
  await registerSundayRoutes(app);
  await registerProfileRoutes(app);
  await registerPaymentRoutes(app);
  await registerInternalRoutes(app);

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

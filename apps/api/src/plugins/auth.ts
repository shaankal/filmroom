import fp from "fastify-plugin";
import jwt from "jsonwebtoken";
import type { FastifyPluginAsync } from "fastify";

import { getSupabaseAuth } from "../lib/supabase";

/** Resolve Supabase user id from access token (legacy HS256 secret or Auth API). */
async function resolveUserIdFromToken(token: string): Promise<string | null> {
  const secret = process.env.SUPABASE_JWT_SECRET?.trim();
  if (secret) {
    try {
      const payload = jwt.verify(token, secret) as { sub?: string };
      if (payload.sub) {
        return payload.sub;
      }
    } catch {
      /* HS256 verify failed — asymmetric JWT or wrong secret; fall through */
    }
  }

  const { data, error } = await getSupabaseAuth().auth.getUser(token);
  if (error || !data.user?.id) {
    return null;
  }
  return data.user.id;
}

function pathOnly(url: string): string {
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

/** Routes that skip Bearer JWT (logout still requires a valid token). */
function isPublicRoute(method: string, path: string): boolean {
  if (method === "OPTIONS") return true;
  if (path === "/health") return true;
  if (
    path === "/auth/register" ||
    path === "/auth/login" ||
    path === "/auth/refresh"
  ) {
    return true;
  }
  if (method === "GET" && /^\/leagues\/invite\/[^/]+$/.test(path)) return true;
  if (method === "POST" && path === "/payments/webhook") return true;
  return false;
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("Missing SUPABASE_JWT_SECRET — set it in apps/api/.env");
  }

  const cronSecret = process.env.INTERNAL_CRON_SECRET;

  fastify.addHook("preHandler", async (request, reply) => {
    const path = pathOnly(request.raw.url ?? "/");
    const method = request.method;

    if (path.startsWith("/internal")) {
      const header = request.headers["x-cron-secret"];
      const secret = Array.isArray(header) ? header[0] : header;
      if (!cronSecret || secret !== cronSecret) {
        return reply.code(401).send({ error: "unauthorized" });
      }
      return;
    }

    if (isPublicRoute(method, path)) {
      return;
    }

    // No registered route for this URL → let Fastify return 404, not 401
    if (!request.routeOptions?.url) {
      return;
    }

    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

    if (!token) {
      return reply.code(401).send({ error: "missing token" });
    }

    const userId = await resolveUserIdFromToken(token);
    if (!userId) {
      return reply.code(401).send({ error: "invalid token" });
    }
    request.userId = userId;
  });
};

export default fp(authPlugin, { name: "auth" });

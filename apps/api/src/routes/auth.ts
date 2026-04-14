import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuthRefreshBody, AuthSuccessBody } from "@filmroom/types";
import type { Session } from "@supabase/supabase-js";

import { getSupabase, getSupabaseAuth } from "../lib/supabase";

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

async function toAuthSuccessBody(
  session: Session
): Promise<AuthSuccessBody> {
  const supabase = getSupabase();
  const { data: profile, error } = await supabase
    .from("users")
    .select("email, username")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error || !profile) {
    throw new Error("profile_missing");
  }

  return {
    userId: session.user.id,
    email: profile.email,
    username: profile.username,
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in ?? 3600,
  };
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.post("/auth/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const { email, username, password } = parsed.data;
    const admin = getSupabase();

    const { data: taken } = await admin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (taken) {
      return reply.code(409).send({ error: "username_taken" });
    }

    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username },
    });

    if (cErr || !created.user) {
      const msg = cErr?.message ?? "signup_failed";
      const lower = msg.toLowerCase();
      if (lower.includes("registered") || lower.includes("already")) {
        return reply.code(409).send({ error: "email_taken" });
      }
      return reply.code(400).send({ error: msg });
    }

    const uid = created.user.id;
    const { error: insErr } = await admin.from("users").insert({
      id: uid,
      email,
      username,
    });

    if (insErr) {
      await admin.auth.admin.deleteUser(uid);
      if (insErr.code === "23505") {
        return reply.code(409).send({ error: "username_or_email_conflict" });
      }
      request.log.error(insErr);
      return reply.code(500).send({ error: "profile_create_failed" });
    }

    const auth = getSupabaseAuth();
    const { data: signData, error: sErr } = await auth.auth.signInWithPassword({
      email,
      password,
    });

    if (sErr || !signData.session) {
      return reply.code(500).send({ error: "session_failed" });
    }

    try {
      const body = await toAuthSuccessBody(signData.session);
      return reply.code(201).send(body);
    } catch {
      return reply.code(500).send({ error: "profile_load_failed" });
    }
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const auth = getSupabaseAuth();
    const { data: signData, error: sErr } = await auth.auth.signInWithPassword(
      {
        email: parsed.data.email,
        password: parsed.data.password,
      }
    );

    if (sErr || !signData.session) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    try {
      const body = await toAuthSuccessBody(signData.session);
      return reply.send(body);
    } catch {
      return reply.code(403).send({ error: "profile_missing" });
    }
  });

  app.post("/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "validation_failed" });
    }

    const auth = getSupabaseAuth();
    const { data, error } = await auth.auth.refreshSession({
      refresh_token: parsed.data.refresh_token,
    });

    if (error || !data.session) {
      return reply.code(401).send({ error: "invalid_refresh" });
    }

    const out: AuthRefreshBody = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in ?? 3600,
    };

    return reply.send(out);
  });

  app.delete("/auth/logout", async (_request, reply) => {
    return reply.code(204).send();
  });
}

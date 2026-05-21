import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type {
  LeaguePassPurchaseBody,
  LeaguePassPurchaseResponse,
  LeaguePassStatusResponse,
} from "@filmroom/types";

import {
  requireLeagueCommissioner,
  requireLeagueMembership,
} from "../lib/league-access";
import { getSupabase } from "../lib/supabase";

const purchaseSchema = z.object({
  leagueId: z.string().uuid(),
  platform: z.enum(["ios", "android", "web"]),
});

const webhookSchema = z.object({
  event: z
    .object({
      type: z.string(),
      app_user_id: z.string().optional(),
    })
    .passthrough(),
  product_id: z.string().optional(),
  app_user_id: z.string().optional(),
});

export async function registerPaymentRoutes(app: FastifyInstance) {
  app.post<{ Body: LeaguePassPurchaseBody }>(
    "/payments/league-pass",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = purchaseSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "validation_failed",
          details: parsed.error.flatten(),
        });
      }

      const { leagueId, platform } = parsed.data;
      const isCommish = await requireLeagueCommissioner(userId, leagueId);
      if (!isCommish) {
        return reply.code(403).send({ error: "commissioner_only" });
      }

      const body: LeaguePassPurchaseResponse = {
        leagueId,
        message:
          "Complete purchase in the App Store via RevenueCat SDK (TestFlight / production).",
        testMode: process.env.NODE_ENV !== "production",
      };

      if (process.env.LEAGUE_PASS_DEV_UNLOCK === "true") {
        const supabase = getSupabase();
        const seasonYear = new Date().getFullYear();
        await supabase
          .from("leagues")
          .update({ league_pass_active: true })
          .eq("id", leagueId);
        await supabase.from("league_pass_purchases").insert({
          league_id: leagueId,
          purchased_by: userId,
          amount_cents: 0,
          platform,
          status: "active",
          season_year: seasonYear,
        });
        body.message = "League Pass unlocked (dev mode).";
      }

      return body;
    }
  );

  app.get<{ Params: { leagueId: string } }>(
    "/payments/league-pass/:leagueId",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = z.string().uuid().safeParse(request.params.leagueId);
      if (!parsed.success) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const isMember = await requireLeagueMembership(userId, parsed.data);
      if (!isMember) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      const supabase = getSupabase();
      const { data: league } = await supabase
        .from("leagues")
        .select("league_pass_active, season_year")
        .eq("id", parsed.data)
        .maybeSingle();

      if (!league) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const body: LeaguePassStatusResponse = {
        leagueId: parsed.data,
        active: Boolean(league.league_pass_active),
        seasonYear: league.season_year as number,
      };

      return body;
    }
  );

  app.post("/payments/webhook", async (request, reply) => {
    const secret = process.env.REVENUECAT_WEBHOOK_SECRET;
    const header = request.headers.authorization;
    if (secret && header !== `Bearer ${secret}`) {
      return reply.code(401).send({ error: "unauthorized" });
    }

    const parsed = webhookSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "invalid_webhook" });
    }

    const body = request.body as {
      event?: { type?: string };
      app_user_id?: string;
      subscriber_attributes?: Record<string, unknown>;
    };

    const eventType = body.event?.type ?? "";
    if (
      eventType !== "INITIAL_PURCHASE" &&
      eventType !== "RENEWAL" &&
      eventType !== "NON_RENEWING_PURCHASE"
    ) {
      return { ok: true, ignored: true };
    }

    const leagueId =
      (body as { subscriber_attributes?: { league_id?: { value?: string } } })
        .subscriber_attributes?.league_id?.value ?? null;

    if (!leagueId) {
      return reply.code(400).send({ error: "missing_league_id" });
    }

    const purchaserId = body.app_user_id;
    if (!purchaserId) {
      return reply.code(400).send({ error: "missing_user" });
    }

    const supabase = getSupabase();
    const seasonYear = new Date().getFullYear();

    await supabase
      .from("leagues")
      .update({ league_pass_active: true })
      .eq("id", leagueId);

    await supabase.from("league_pass_purchases").insert({
      league_id: leagueId,
      purchased_by: purchaserId,
      amount_cents: 1999,
      platform: "ios",
      status: "active",
      season_year: seasonYear,
      revenuecat_txn_id: eventType,
    });

    return { ok: true, leagueId };
  });
}

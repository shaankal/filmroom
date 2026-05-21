import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { getSupabase } from "../lib/supabase";
import { recalcAllLeagueHealth } from "../services/health";
import { sendPushToUsers } from "../services/notifications";
import {
  recalcWeeklyResults,
  recalcWeeklyResultsForLeagueWeek,
} from "../services/standings";

const openWindowSchema = z.object({
  windowType: z.enum(["early_slate", "primetime"]),
  nflWeek: z.number().int().min(1).max(22).optional(),
  seasonYear: z.number().int().optional(),
});

const closeWindowSchema = z.object({
  windowId: z.string().uuid(),
});

const weeklyLockSchema = z.object({
  leagueId: z.string().uuid().optional(),
});

export async function registerInternalRoutes(app: FastifyInstance) {
  app.post("/internal/sunday/open-window", async (request, reply) => {
    const parsed = openWindowSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = getSupabase();
    const seasonYear =
      parsed.data.seasonYear ?? new Date().getFullYear();
    const nflWeek = parsed.data.nflWeek ?? 1;

    const { data: window, error } = await supabase
      .from("sunday_windows")
      .select("id, scenario_set_id, nfl_week, season_year")
      .eq("window_type", parsed.data.windowType)
      .eq("nfl_week", nflWeek)
      .eq("season_year", seasonYear)
      .in("status", ["scheduled", "closed"])
      .order("opens_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !window) {
      return reply.code(404).send({ error: "window_not_found" });
    }

    const opensAt = new Date().toISOString();
    const closesAt = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();

    await supabase
      .from("sunday_windows")
      .update({
        status: "open",
        opens_at: opensAt,
        closes_at: closesAt,
      })
      .eq("id", window.id);

    const { data: members } = await supabase
      .from("league_members")
      .select("user_id")
      .eq("is_active", true);

    const userIds = [...new Set((members ?? []).map((m) => m.user_id as string))];
    await sendPushToUsers(
      userIds,
      "Sunday Live is open",
      `${parsed.data.windowType === "primetime" ? "Primetime" : "Early slate"} window — play now.`
    );

    return { windowId: window.id, status: "open" as const };
  });

  app.post("/internal/sunday/close-window", async (request, reply) => {
    const parsed = closeWindowSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = getSupabase();
    const { data: window } = await supabase
      .from("sunday_windows")
      .select("id, nfl_week, season_year")
      .eq("id", parsed.data.windowId)
      .maybeSingle();

    if (!window) {
      return reply.code(404).send({ error: "window_not_found" });
    }

    await supabase
      .from("sunday_windows")
      .update({ status: "closed" })
      .eq("id", window.id);

    const { data: leagues } = await supabase
      .from("leagues")
      .select("id")
      .eq("current_week", window.nfl_week)
      .eq("season_year", window.season_year);

    for (const league of leagues ?? []) {
      await recalcWeeklyResultsForLeagueWeek(
        league.id as string,
        window.nfl_week as number,
        window.season_year as number
      );
    }

    await supabase
      .from("sunday_windows")
      .update({ status: "scored" })
      .eq("id", window.id);

    return { windowId: window.id, leaguesUpdated: (leagues ?? []).length };
  });

  app.post("/internal/weekly/lock", async (request, reply) => {
    const parsed = weeklyLockSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const supabase = getSupabase();
    let query = supabase
      .from("weekly_challenges")
      .select("id, league_id, week_number, season_year")
      .eq("status", "open");

    if (parsed.data.leagueId) {
      query = query.eq("league_id", parsed.data.leagueId);
    }

    const { data: challenges, error } = await query;
    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "lock_failed" });
    }

    let locked = 0;
    for (const challenge of challenges ?? []) {
      await supabase
        .from("weekly_challenges")
        .update({ status: "locked" })
        .eq("id", challenge.id);

      await recalcWeeklyResults({
        id: challenge.id as string,
        league_id: challenge.league_id as string,
        week_number: challenge.week_number as number,
        season_year: challenge.season_year as number,
      });

      await supabase
        .from("weekly_challenges")
        .update({ status: "scored" })
        .eq("id", challenge.id);

      const { data: league } = await supabase
        .from("leagues")
        .select("commissioner_id")
        .eq("id", challenge.league_id)
        .maybeSingle();

      const { data: winnerRow } = await supabase
        .from("weekly_results")
        .select("user_id")
        .eq("league_id", challenge.league_id)
        .eq("week_number", challenge.week_number)
        .eq("season_year", challenge.season_year)
        .eq("rank", 1)
        .maybeSingle();

      if (winnerRow) {
        await sendPushToUsers(
          [winnerRow.user_id as string],
          "You won the week",
          `Week ${challenge.week_number} — top of the standings.`
        );
      }

      if (league?.commissioner_id) {
        await sendPushToUsers(
          [league.commissioner_id as string],
          "Weekly results locked",
          `Week ${challenge.week_number} results are final.`
        );
      }

      await supabase
        .from("leagues")
        .update({ current_week: (challenge.week_number as number) + 1 })
        .eq("id", challenge.league_id);

      locked += 1;
    }

    return { locked };
  });

  app.post("/internal/health/recalculate", async (request, reply) => {
    const count = await recalcAllLeagueHealth();
    return { leaguesProcessed: count };
  });
}

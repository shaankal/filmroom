import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type {
  SundayLiveResponse,
  SundaySubmitBody,
  SundaySubmitResponse,
  SundayWindowScenariosResponse,
  SundayWindowStatus,
  SundayWindowsResponse,
  SundayWindowSummary,
  SundayWindowType,
  WeeklyChallengeResponseRow,
} from "@filmroom/types";

import { requireLeagueMembership, loadLeagueUsernames } from "../lib/league-access";
import { loadChallengeScenarios, normalizeChoices } from "../lib/scenarios";
import { getSupabase } from "../lib/supabase";
import { calcScenarioScore } from "../services/scoring";
import {
  recalcWeeklyResultsForLeagueWeek,
} from "../services/standings";

const uuidSchema = z.string().uuid();

const submitSchema = z.object({
  leagueId: z.string().uuid(),
  responses: z
    .array(
      z.object({
        scenarioId: z.string().uuid(),
        answer: z.enum(["A", "B", "C", "D"]),
        responseTimeMs: z.number().int().min(0).max(120_000),
      })
    )
    .min(1),
});

function mapWindow(row: {
  id: string;
  window_type: string;
  nfl_week: number;
  season_year: number;
  opens_at: string;
  closes_at: string;
  status: string;
}): SundayWindowSummary {
  return {
    id: row.id,
    windowType: row.window_type as SundayWindowType,
    nflWeek: row.nfl_week,
    seasonYear: row.season_year,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    status: row.status as SundayWindowStatus,
  };
}

export async function registerSundayRoutes(app: FastifyInstance) {
  app.get("/sunday/windows", async (request, reply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.code(401).send({ error: "missing token" });
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

    const { data: activeRow } = await supabase
      .from("sunday_windows")
      .select(
        "id, window_type, nfl_week, season_year, opens_at, closes_at, status"
      )
      .eq("status", "open")
      .lte("opens_at", now)
      .gte("closes_at", now)
      .order("opens_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: upcomingRows } = await supabase
      .from("sunday_windows")
      .select(
        "id, window_type, nfl_week, season_year, opens_at, closes_at, status"
      )
      .in("status", ["scheduled", "open"])
      .gte("closes_at", now)
      .order("opens_at", { ascending: true })
      .limit(5);

    const body: SundayWindowsResponse = {
      active: activeRow ? mapWindow(activeRow) : null,
      upcoming: (upcomingRows ?? [])
        .filter((row) => row.id !== activeRow?.id)
        .map(mapWindow),
    };

    return body;
  });

  app.get<{ Params: { id: string } }>(
    "/sunday/windows/:id/scenarios",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = uuidSchema.safeParse(request.params.id);
      if (!parsed.success) {
        return reply.code(404).send({ error: "window_not_found" });
      }

      const supabase = getSupabase();
      const { data: window, error } = await supabase
        .from("sunday_windows")
        .select(
          "id, window_type, nfl_week, season_year, opens_at, closes_at, status, scenario_set_id"
        )
        .eq("id", parsed.data)
        .maybeSingle();

      if (error || !window) {
        return reply.code(404).send({ error: "window_not_found" });
      }

      if (window.status !== "open") {
        return reply.code(409).send({ error: "window_not_open" });
      }

      const scenarios = await loadChallengeScenarios(
        window.scenario_set_id as string
      );
      if (!scenarios) {
        return reply.code(500).send({ error: "window_load_failed" });
      }

      const body: SundayWindowScenariosResponse = {
        window: mapWindow(window),
        scenarios: scenarios.map((row) => ({
          id: row.id,
          conceptTag: row.concept_tag,
          difficulty: row.difficulty,
          context: row.context,
          prompt: row.prompt,
          choices: normalizeChoices(row.choices),
        })),
        submission: null,
      };

      return body;
    }
  );

  app.post<{ Params: { id: string }; Body: SundaySubmitBody }>(
    "/sunday/windows/:id/submit",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const windowParsed = uuidSchema.safeParse(request.params.id);
      if (!windowParsed.success) {
        return reply.code(404).send({ error: "window_not_found" });
      }

      const bodyParsed = submitSchema.safeParse(request.body);
      if (!bodyParsed.success) {
        return reply.code(400).send({
          error: "validation_failed",
          details: bodyParsed.error.flatten(),
        });
      }

      const { leagueId, responses } = bodyParsed.data;
      const isMember = await requireLeagueMembership(userId, leagueId);
      if (!isMember) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      const supabase = getSupabase();
      const { data: window } = await supabase
        .from("sunday_windows")
        .select(
          "id, status, scenario_set_id, nfl_week, season_year, opens_at, closes_at"
        )
        .eq("id", windowParsed.data)
        .maybeSingle();

      if (!window) {
        return reply.code(404).send({ error: "window_not_found" });
      }

      if (window.status !== "open") {
        return reply.code(409).send({ error: "window_not_open" });
      }

      const now = Date.now();
      if (
        now < new Date(window.opens_at as string).getTime() ||
        now > new Date(window.closes_at as string).getTime()
      ) {
        return reply.code(409).send({ error: "window_not_open" });
      }

      const scenarioRows = await loadChallengeScenarios(
        window.scenario_set_id as string
      );
      if (!scenarioRows || scenarioRows.length === 0) {
        return reply.code(500).send({ error: "submit_failed" });
      }

      const scenarioIds = scenarioRows.map((row) => row.id);
      const submittedIds = responses.map((response) => response.scenarioId);
      const uniqueSubmittedIds = new Set(submittedIds);
      const expectedIds = new Set(scenarioIds);

      if (
        uniqueSubmittedIds.size !== scenarioIds.length ||
        responses.length !== scenarioIds.length
      ) {
        return reply.code(400).send({ error: "incomplete_submission" });
      }

      for (const scenarioId of uniqueSubmittedIds) {
        if (!expectedIds.has(scenarioId)) {
          return reply.code(400).send({ error: "invalid_scenario_submission" });
        }
      }

      const { data: existingResult, error: existingErr } = await supabase
        .from("sunday_results")
        .select("id")
        .eq("user_id", userId)
        .eq("window_id", window.id)
        .eq("league_id", leagueId)
        .maybeSingle();

      if (existingErr) {
        request.log.error(existingErr);
        return reply.code(500).send({ error: "submit_failed" });
      }
      if (existingResult) {
        return reply.code(409).send({ error: "already_submitted" });
      }

      const scenarioById = new Map(scenarioRows.map((row) => [row.id, row]));
      let totalPoints = 0;
      const responseRows: WeeklyChallengeResponseRow[] = [];

      for (const response of responses) {
        const scenario = scenarioById.get(response.scenarioId);
        if (!scenario) {
          return reply.code(400).send({ error: "invalid_scenario" });
        }

        const isCorrect = response.answer === scenario.correct_answer;
        const points = calcScenarioScore(
          isCorrect,
          scenario.difficulty,
          response.responseTimeMs
        );
        totalPoints += points;
        responseRows.push({
          scenarioId: response.scenarioId,
          answer: response.answer,
          isCorrect,
          pointsEarned: points,
          responseTimeMs: response.responseTimeMs,
        });
      }

      const { error: insertErr } = await supabase.from("sunday_results").insert({
          user_id: userId,
          window_id: window.id,
          league_id: leagueId,
          total_pts: totalPoints,
          completed_at: new Date().toISOString(),
      });

      if (insertErr) {
        request.log.error(insertErr);
        return reply.code(500).send({ error: "submit_failed" });
      }

      const { data: league } = await supabase
        .from("leagues")
        .select("current_week, season_year")
        .eq("id", leagueId)
        .maybeSingle();

      if (
        league &&
        league.current_week === window.nfl_week &&
        league.season_year === window.season_year
      ) {
        await recalcWeeklyResultsForLeagueWeek(
          leagueId,
          window.nfl_week as number,
          window.season_year as number
        );
      }

      const result: SundaySubmitResponse = {
        windowId: window.id as string,
        leagueId,
        totalPoints,
        responses: responseRows,
      };

      return reply.code(201).send(result);
    }
  );

  app.get<{ Params: { leagueId: string } }>(
    "/sunday/league/:leagueId/live",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = uuidSchema.safeParse(request.params.leagueId);
      if (!parsed.success) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const leagueId = parsed.data;
      const isMember = await requireLeagueMembership(userId, leagueId);
      if (!isMember) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      const supabase = getSupabase();
      const { data: league } = await supabase
        .from("leagues")
        .select("current_week, season_year")
        .eq("id", leagueId)
        .maybeSingle();

      if (!league) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const now = new Date().toISOString();
      const { data: activeWindow } = await supabase
        .from("sunday_windows")
        .select(
          "id, window_type, nfl_week, season_year, opens_at, closes_at, status"
        )
        .eq("status", "open")
        .eq("nfl_week", league.current_week)
        .eq("season_year", league.season_year)
        .lte("opens_at", now)
        .gte("closes_at", now)
        .maybeSingle();

      const { data: weeklyRows } = await supabase
        .from("weekly_results")
        .select(
          "user_id, weekly_challenge_pts, sunday_pts, h2h_bonus_pts, total_pts, rank"
        )
        .eq("league_id", leagueId)
        .eq("week_number", league.current_week)
        .eq("season_year", league.season_year)
        .order("rank", { ascending: true, nullsFirst: false });

      const userIds = (weeklyRows ?? []).map((row) => row.user_id as string);
      const usernames = await loadLeagueUsernames(userIds);

      const body: SundayLiveResponse = {
        leagueId,
        weekNumber: league.current_week as number,
        seasonYear: league.season_year as number,
        activeWindow: activeWindow ? mapWindow(activeWindow) : null,
        standings: (weeklyRows ?? []).map((row) => ({
          userId: row.user_id as string,
          username: usernames.get(row.user_id as string) ?? "unknown",
          totalPts: row.total_pts as number,
          rank: (row.rank as number | null) ?? null,
          weeklyChallengePts: row.weekly_challenge_pts as number,
          sundayPts: row.sunday_pts as number,
          h2hBonusPts: row.h2h_bonus_pts as number,
        })),
      };

      return body;
    }
  );
}

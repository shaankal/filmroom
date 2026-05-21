import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type {
  CreateH2HChallengeBody,
  CreateH2HChallengeResponse,
  H2HChallengeDetailResponse,
  H2HPendingListResponse,
  H2HChallengeSummary,
  ScenarioAnswer,
  ScenarioChoice,
  ScenarioDifficulty,
  SubmitH2HChallengeBody,
  SubmitH2HChallengeResponse,
  WeeklyChallengeDetailResponse,
  WeeklyChallengeResponseRow,
  WeeklyChallengeResultsResponse,
  WeeklyChallengeSubmitBody,
  WeeklyChallengeSubmitResponse,
} from "@filmroom/types";

import { getSupabase } from "../lib/supabase";
import { calcScenarioScore, H2H_WIN_BONUS } from "../services/scoring";
import { recalcWeeklyResults } from "../services/standings";

const uuidSchema = z.string().uuid();

const submitSchema = z.object({
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

const createH2HSchema = z.object({
  leagueId: z.string().uuid(),
  challengedUserId: z.string().uuid(),
});

type ScenarioRow = {
  id: string;
  concept_tag: string;
  difficulty: ScenarioDifficulty;
  context: string;
  prompt: string;
  choices: unknown;
  correct_answer: ScenarioAnswer;
  explanation: string;
  status: string;
};

type WeeklyChallengeRow = {
  id: string;
  league_id: string;
  week_number: number;
  season_year: number;
  scenario_set_id: string;
  opens_at: string;
  locks_at: string;
  status: "open" | "locked" | "scored";
};

type H2HChallengeRow = {
  id: string;
  league_id: string;
  challenger_id: string;
  challenged_id: string;
  scenario_set_id: string;
  week_number: number;
  season_year: number;
  status: "pending" | "active" | "complete" | "expired";
  challenger_score: number | null;
  challenged_score: number | null;
  winner_id: string | null;
  expires_at: string;
  completed_at: string | null;
  created_at: string;
};

type PreviousRankRow = {
  user_id: string;
  rank: number | null;
};

type WeeklyResultsRow = {
  user_id: string;
  weekly_challenge_pts: number;
  sunday_pts: number;
  h2h_bonus_pts: number;
  total_pts: number;
  rank: number | null;
  previous_rank: number | null;
};

type H2HWinAggregateRow = {
  winner_id: string;
};

function normalizeChoices(raw: unknown): ScenarioChoice[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized = raw
    .map((choice, index) => {
      if (typeof choice === "string") {
        const key = ["A", "B", "C", "D"][index] as ScenarioAnswer | undefined;
        return key ? { key, text: choice } : null;
      }

      if (
        choice &&
        typeof choice === "object" &&
        "key" in choice &&
        "text" in choice
      ) {
        const key = (choice as { key: unknown }).key;
        const text = (choice as { text: unknown }).text;
        if (
          (key === "A" || key === "B" || key === "C" || key === "D") &&
          typeof text === "string"
        ) {
          return { key, text };
        }
      }

      return null;
    })
    .filter((choice): choice is ScenarioChoice => Boolean(choice));

  return normalized;
}

async function requireLeagueMembership(
  userId: string,
  leagueId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", leagueId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();

  return Boolean(data);
}

async function loadLeagueUsernames(userIds: string[]) {
  const supabase = getSupabase();
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const { data: users } = await supabase
    .from("users")
    .select("id, username")
    .in("id", uniqueIds);

  return new Map(
    (users ?? []).map((row) => [row.id as string, row.username as string] as const)
  );
}

async function getWeeklyChallengeForLeague(leagueId: string) {
  const supabase = getSupabase();

  const { data: league, error: leagueErr } = await supabase
    .from("leagues")
    .select("id, current_week, season_year")
    .eq("id", leagueId)
    .maybeSingle();

  if (leagueErr || !league) {
    return { league: null, challenge: null };
  }

  const { data: challenge, error: challengeErr } = await supabase
    .from("weekly_challenges")
    .select(
      "id, league_id, week_number, season_year, scenario_set_id, opens_at, locks_at, status"
    )
    .eq("league_id", leagueId)
    .eq("week_number", league.current_week)
    .eq("season_year", league.season_year)
    .maybeSingle();

  if (challengeErr || !challenge) {
    return { league, challenge: null };
  }

  return {
    league,
    challenge: challenge as WeeklyChallengeRow,
  };
}

async function loadChallengeScenarios(scenarioSetId: string) {
  const supabase = getSupabase();
  const { data: setRow, error: setErr } = await supabase
    .from("scenario_sets")
    .select("scenario_ids")
    .eq("id", scenarioSetId)
    .maybeSingle();

  if (setErr || !setRow) {
    return null;
  }

  const scenarioIds = ((setRow.scenario_ids as string[] | null) ?? []).filter(
    Boolean
  );
  if (scenarioIds.length === 0) {
    return [];
  }

  const { data: scenarioRows, error: scenarioErr } = await supabase
    .from("scenarios")
    .select(
      "id, concept_tag, difficulty, context, prompt, choices, correct_answer, explanation, status"
    )
    .in("id", scenarioIds);

  if (scenarioErr || !scenarioRows) {
    return null;
  }

  const byId = new Map(
    (scenarioRows as ScenarioRow[]).map((row) => [row.id, row] as const)
  );

  return scenarioIds
    .map((id) => byId.get(id))
    .filter((row): row is ScenarioRow => Boolean(row));
}

function toH2HSummary(
  row: H2HChallengeRow,
  usernames: Map<string, string>
): H2HChallengeSummary {
  return {
    id: row.id,
    leagueId: row.league_id,
    weekNumber: row.week_number,
    seasonYear: row.season_year,
    status: row.status,
    challengerId: row.challenger_id,
    challengerUsername: usernames.get(row.challenger_id) ?? "unknown",
    challengedId: row.challenged_id,
    challengedUsername: usernames.get(row.challenged_id) ?? "unknown",
    challengerScore: row.challenger_score,
    challengedScore: row.challenged_score,
    winnerId: row.winner_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

async function loadH2HChallenge(
  challengeId: string
): Promise<H2HChallengeRow | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("h2h_challenges")
    .select(
      "id, league_id, challenger_id, challenged_id, scenario_set_id, week_number, season_year, status, challenger_score, challenged_score, winner_id, expires_at, completed_at, created_at"
    )
    .eq("id", challengeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as H2HChallengeRow;
}

async function upsertRivalryForCompletedChallenge(challenge: H2HChallengeRow) {
  if (!challenge.winner_id) return;

  const supabase = getSupabase();
  const userAId =
    challenge.challenger_id < challenge.challenged_id
      ? challenge.challenger_id
      : challenge.challenged_id;
  const userBId =
    challenge.challenger_id < challenge.challenged_id
      ? challenge.challenged_id
      : challenge.challenger_id;

  const { data: existing } = await supabase
    .from("rivalries")
    .select("id, user_a_wins, user_b_wins")
    .eq("league_id", challenge.league_id)
    .eq("user_a_id", userAId)
    .eq("user_b_id", userBId)
    .maybeSingle();

  const winnerIsA = challenge.winner_id === userAId;

  if (existing) {
    await supabase
      .from("rivalries")
      .update({
        user_a_wins: (existing.user_a_wins as number) + (winnerIsA ? 1 : 0),
        user_b_wins: (existing.user_b_wins as number) + (winnerIsA ? 0 : 1),
        last_played: new Date().toISOString(),
      })
      .eq("id", existing.id as string);
    return;
  }

  await supabase.from("rivalries").insert({
    league_id: challenge.league_id,
    user_a_id: userAId,
    user_b_id: userBId,
    user_a_wins: winnerIsA ? 1 : 0,
    user_b_wins: winnerIsA ? 0 : 1,
    last_played: new Date().toISOString(),
  });
}

export async function registerChallengeRoutes(app: FastifyInstance) {
  app.get<{ Params: { leagueId: string } }>(
    "/challenges/weekly/:leagueId",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = uuidSchema.safeParse(request.params.leagueId);
      if (!parsed.success) {
        return reply.code(404).send({ error: "challenge_not_found" });
      }

      const leagueId = parsed.data;
      const isMember = await requireLeagueMembership(userId, leagueId);
      if (!isMember) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      const { challenge } = await getWeeklyChallengeForLeague(leagueId);
      if (!challenge) {
        return reply.code(404).send({ error: "challenge_not_found" });
      }

      const scenarios = await loadChallengeScenarios(challenge.scenario_set_id);
      if (!scenarios) {
        return reply.code(500).send({ error: "challenge_load_failed" });
      }

      const supabase = getSupabase();
      const { data: existingRows, error: existingErr } = await supabase
        .from("challenge_responses")
        .select(
          "scenario_id, answer, is_correct, points_earned, response_time_ms, created_at"
        )
        .eq("user_id", userId)
        .eq("source_type", "weekly")
        .eq("source_id", challenge.id)
        .order("created_at", { ascending: true });

      if (existingErr) {
        request.log.error(existingErr);
        return reply.code(500).send({ error: "challenge_load_failed" });
      }

      const responseRows = (existingRows ?? []).map(
        (row) =>
          ({
            scenarioId: row.scenario_id as string,
            answer: row.answer as ScenarioAnswer,
            isCorrect: row.is_correct as boolean,
            pointsEarned: row.points_earned as number,
            responseTimeMs: row.response_time_ms as number,
          }) satisfies WeeklyChallengeResponseRow
      );

      const body: WeeklyChallengeDetailResponse = {
        challenge: {
          id: challenge.id,
          leagueId: challenge.league_id,
          weekNumber: challenge.week_number,
          seasonYear: challenge.season_year,
          opensAt: challenge.opens_at,
          locksAt: challenge.locks_at,
          status: challenge.status,
        },
        scenarios: scenarios.map((row) => ({
          id: row.id,
          conceptTag: row.concept_tag,
          difficulty: row.difficulty,
          context: row.context,
          prompt: row.prompt,
          choices: normalizeChoices(row.choices),
          correctAnswer: row.correct_answer,
          explanation: row.explanation,
        })),
        submission:
          responseRows.length > 0
            ? {
                totalPoints: responseRows.reduce(
                  (sum, row) => sum + row.pointsEarned,
                  0
                ),
                submittedAt:
                  ((existingRows ?? [])[0]?.created_at as string) ??
                  new Date().toISOString(),
                responses: responseRows,
              }
            : null,
      };

      return body;
    }
  );

  app.post<{ Params: { id: string }; Body: WeeklyChallengeSubmitBody }>(
    "/challenges/weekly/:id/submit",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const idParsed = uuidSchema.safeParse(request.params.id);
      if (!idParsed.success) {
        return reply.code(404).send({ error: "challenge_not_found" });
      }

      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "validation_failed",
          details: parsed.error.flatten(),
        });
      }

      const challengeId = idParsed.data;
      const supabase = getSupabase();
      const { data: challenge, error: challengeErr } = await supabase
        .from("weekly_challenges")
        .select(
          "id, league_id, week_number, season_year, scenario_set_id, opens_at, locks_at, status"
        )
        .eq("id", challengeId)
        .maybeSingle();

      if (challengeErr || !challenge) {
        if (challengeErr) request.log.error(challengeErr);
        return reply.code(404).send({ error: "challenge_not_found" });
      }

      const isMember = await requireLeagueMembership(
        userId,
        challenge.league_id as string
      );
      if (!isMember) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      if (challenge.status !== "open") {
        return reply.code(409).send({ error: "challenge_closed" });
      }

      const now = Date.now();
      const opensAt = new Date(challenge.opens_at as string).getTime();
      const locksAt = new Date(challenge.locks_at as string).getTime();
      if (now < opensAt || now > locksAt) {
        return reply.code(409).send({ error: "challenge_closed" });
      }

      const { count: existingCount, error: existingErr } = await supabase
        .from("challenge_responses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("source_type", "weekly")
        .eq("source_id", challengeId);

      if (existingErr) {
        request.log.error(existingErr);
        return reply.code(500).send({ error: "submit_failed" });
      }
      if ((existingCount ?? 0) > 0) {
        return reply.code(409).send({ error: "already_submitted" });
      }

      const scenarios = await loadChallengeScenarios(
        challenge.scenario_set_id as string
      );
      if (!scenarios || scenarios.length === 0) {
        return reply.code(500).send({ error: "challenge_load_failed" });
      }

      const scenarioIds = scenarios.map((s) => s.id);
      const submittedIds = parsed.data.responses.map((r) => r.scenarioId);
      const uniqueSubmittedIds = new Set(submittedIds);
      const expectedIds = new Set(scenarioIds);

      if (
        uniqueSubmittedIds.size !== scenarioIds.length ||
        parsed.data.responses.length !== scenarioIds.length
      ) {
        return reply.code(400).send({ error: "incomplete_submission" });
      }

      for (const scenarioId of uniqueSubmittedIds) {
        if (!expectedIds.has(scenarioId)) {
          return reply.code(400).send({ error: "invalid_scenario_submission" });
        }
      }

      const scenarioById = new Map(scenarios.map((s) => [s.id, s] as const));

      const rows = parsed.data.responses.map((response) => {
        const scenario = scenarioById.get(response.scenarioId);
        if (!scenario) {
          throw new Error("scenario_missing");
        }

        const isCorrect = response.answer === scenario.correct_answer;
        const pointsEarned = calcScenarioScore(
          isCorrect,
          scenario.difficulty,
          response.responseTimeMs
        );

        return {
          user_id: userId,
          scenario_id: response.scenarioId,
          source_type: "weekly" as const,
          source_id: challengeId,
          answer: response.answer,
          is_correct: isCorrect,
          response_time_ms: response.responseTimeMs,
          points_earned: pointsEarned,
        };
      });

      const { error: insertErr } = await supabase
        .from("challenge_responses")
        .insert(rows);

      if (insertErr) {
        request.log.error(insertErr);
        return reply.code(500).send({ error: "submit_failed" });
      }

      const responseRows: WeeklyChallengeResponseRow[] = rows.map((row) => ({
        scenarioId: row.scenario_id,
        answer: row.answer,
        isCorrect: row.is_correct,
        pointsEarned: row.points_earned,
        responseTimeMs: row.response_time_ms,
      }));

      await recalcWeeklyResults(challenge as WeeklyChallengeRow);

      const { data: userWeeklyResult } = await supabase
        .from("weekly_results")
        .select("rank, previous_rank")
        .eq("league_id", challenge.league_id)
        .eq("week_number", challenge.week_number)
        .eq("season_year", challenge.season_year)
        .eq("user_id", userId)
        .maybeSingle();

      const body: WeeklyChallengeSubmitResponse = {
        challengeId,
        totalPoints: responseRows.reduce(
          (sum, row) => sum + row.pointsEarned,
          0
        ),
        responses: responseRows,
        currentRank: userWeeklyResult?.rank ?? null,
        previousRank: userWeeklyResult?.previous_rank ?? null,
        rankChange:
          userWeeklyResult?.previous_rank && userWeeklyResult?.rank
            ? userWeeklyResult.previous_rank - userWeeklyResult.rank
            : 0,
      };

      return reply.code(201).send(body);
    }
  );

  app.get<{ Params: { id: string } }>(
    "/challenges/weekly/:id/results",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = uuidSchema.safeParse(request.params.id);
      if (!parsed.success) {
        return reply.code(404).send({ error: "challenge_not_found" });
      }

      const challengeId = parsed.data;
      const supabase = getSupabase();
      const { data: challenge, error: challengeErr } = await supabase
        .from("weekly_challenges")
        .select(
          "id, league_id, week_number, season_year, scenario_set_id, opens_at, locks_at, status"
        )
        .eq("id", challengeId)
        .maybeSingle();

      if (challengeErr || !challenge) {
        if (challengeErr) request.log.error(challengeErr);
        return reply.code(404).send({ error: "challenge_not_found" });
      }

      const leagueId = challenge.league_id as string;
      const isMember = await requireLeagueMembership(userId, leagueId);
      if (!isMember) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      const { data: weeklyRows, error: weeklyErr } = await supabase
        .from("weekly_results")
        .select(
          "user_id, weekly_challenge_pts, sunday_pts, h2h_bonus_pts, total_pts, rank, previous_rank"
        )
        .eq("league_id", leagueId)
        .eq("week_number", challenge.week_number as number)
        .eq("season_year", challenge.season_year as number)
        .order("rank", { ascending: true, nullsFirst: false });

      if (weeklyErr || !weeklyRows || weeklyRows.length === 0) {
        if (weeklyErr) request.log.error(weeklyErr);
        return reply.code(404).send({ error: "results_not_found" });
      }

      const memberIds = (weeklyRows as WeeklyResultsRow[]).map((row) => row.user_id);
      const { data: users, error: usersErr } = await supabase
        .from("users")
        .select("id, username")
        .in("id", memberIds);

      if (usersErr) {
        request.log.error(usersErr);
        return reply.code(500).send({ error: "results_load_failed" });
      }

      const usernameById = new Map(
        (users ?? []).map((row) => [row.id as string, row.username as string] as const)
      );

      const standings = (weeklyRows as WeeklyResultsRow[]).map((row) => ({
        userId: row.user_id,
        username: usernameById.get(row.user_id) ?? "unknown",
        weeklyChallengePts: row.weekly_challenge_pts,
        sundayPts: row.sunday_pts,
        h2hBonusPts: row.h2h_bonus_pts,
        totalPts: row.total_pts,
        rank: row.rank,
      }));

      const yourRow = (weeklyRows as WeeklyResultsRow[]).find(
        (row) => row.user_id === userId
      );
      if (!yourRow) {
        return reply.code(404).send({ error: "results_not_found" });
      }

      const body: WeeklyChallengeResultsResponse = {
        challenge: {
          id: challenge.id as string,
          leagueId,
          weekNumber: challenge.week_number as number,
          seasonYear: challenge.season_year as number,
          opensAt: challenge.opens_at as string,
          locksAt: challenge.locks_at as string,
          status: challenge.status as "open" | "locked" | "scored",
        },
        yourResult: {
          userId,
          username: usernameById.get(userId) ?? "unknown",
          weeklyChallengePts: yourRow.weekly_challenge_pts,
          sundayPts: yourRow.sunday_pts,
          h2hBonusPts: yourRow.h2h_bonus_pts,
          totalPts: yourRow.total_pts,
          rank: yourRow.rank,
          previousRank: yourRow.previous_rank,
          rankChange:
            yourRow.previous_rank && yourRow.rank
              ? yourRow.previous_rank - yourRow.rank
              : 0,
        },
        standings,
      };

      return body;
    }
  );

  app.post<{ Body: CreateH2HChallengeBody }>(
    "/challenges/h2h",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = createH2HSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "validation_failed",
          details: parsed.error.flatten(),
        });
      }

      const { leagueId, challengedUserId } = parsed.data;
      if (challengedUserId === userId) {
        return reply.code(400).send({ error: "cannot_challenge_self" });
      }

      const isMember = await requireLeagueMembership(userId, leagueId);
      const isOpponentMember = await requireLeagueMembership(
        challengedUserId,
        leagueId
      );
      if (!isMember || !isOpponentMember) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      const { challenge: weeklyChallenge } = await getWeeklyChallengeForLeague(
        leagueId
      );
      if (!weeklyChallenge) {
        return reply.code(404).send({ error: "weekly_challenge_not_found" });
      }

      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from("h2h_challenges")
        .select(
          "id, league_id, challenger_id, challenged_id, scenario_set_id, week_number, season_year, status, challenger_score, challenged_score, winner_id, expires_at, completed_at, created_at"
        )
        .eq("league_id", leagueId)
        .eq("week_number", weeklyChallenge.week_number)
        .eq("season_year", weeklyChallenge.season_year)
        .eq("challenger_id", userId)
        .eq("challenged_id", challengedUserId)
        .in("status", ["pending", "active"])
        .maybeSingle();

      if (existing) {
        const usernames = await loadLeagueUsernames([userId, challengedUserId]);
        const body: CreateH2HChallengeResponse = {
          challenge: toH2HSummary(existing as H2HChallengeRow, usernames),
        };
        return reply.code(200).send(body);
      }

      const { data: created, error: createErr } = await supabase
        .from("h2h_challenges")
        .insert({
          league_id: leagueId,
          challenger_id: userId,
          challenged_id: challengedUserId,
          scenario_set_id: weeklyChallenge.scenario_set_id,
          week_number: weeklyChallenge.week_number,
          season_year: weeklyChallenge.season_year,
          status: "pending",
          expires_at: new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ).toISOString(),
        })
        .select(
          "id, league_id, challenger_id, challenged_id, scenario_set_id, week_number, season_year, status, challenger_score, challenged_score, winner_id, expires_at, completed_at, created_at"
        )
        .single();

      if (createErr || !created) {
        request.log.error(createErr);
        return reply.code(500).send({ error: "create_h2h_failed" });
      }

      const usernames = await loadLeagueUsernames([userId, challengedUserId]);
      const body: CreateH2HChallengeResponse = {
        challenge: toH2HSummary(created as H2HChallengeRow, usernames),
      };
      return reply.code(201).send(body);
    }
  );

  app.get("/challenges/h2h/pending", async (request, reply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.code(401).send({ error: "missing token" });
    }

    const supabase = getSupabase();
    const { data: rows, error } = await supabase
      .from("h2h_challenges")
      .select(
        "id, league_id, challenger_id, challenged_id, scenario_set_id, week_number, season_year, status, challenger_score, challenged_score, winner_id, expires_at, completed_at, created_at"
      )
      .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false });

    if (error) {
      request.log.error(error);
      return reply.code(500).send({ error: "pending_h2h_load_failed" });
    }

    const typedRows = (rows ?? []) as H2HChallengeRow[];
    const usernames = await loadLeagueUsernames(
      typedRows.flatMap((row) => [row.challenger_id, row.challenged_id])
    );

    const body: H2HPendingListResponse = {
      challenges: typedRows.map((row) => toH2HSummary(row, usernames)),
    };

    return body;
  });

  app.get<{ Params: { id: string } }>(
    "/challenges/h2h/:id",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = uuidSchema.safeParse(request.params.id);
      if (!parsed.success) {
        return reply.code(404).send({ error: "h2h_not_found" });
      }

      const challenge = await loadH2HChallenge(parsed.data);
      if (!challenge) {
        return reply.code(404).send({ error: "h2h_not_found" });
      }

      if (
        challenge.challenger_id !== userId &&
        challenge.challenged_id !== userId
      ) {
        return reply.code(403).send({ error: "not_a_participant" });
      }

      const scenarios = await loadChallengeScenarios(challenge.scenario_set_id);
      if (!scenarios) {
        return reply.code(500).send({ error: "h2h_load_failed" });
      }

      const supabase = getSupabase();
      const { data: existingRows, error: existingErr } = await supabase
        .from("challenge_responses")
        .select(
          "scenario_id, answer, is_correct, points_earned, response_time_ms, created_at"
        )
        .eq("user_id", userId)
        .eq("source_type", "h2h")
        .eq("source_id", challenge.id)
        .order("created_at", { ascending: true });

      if (existingErr) {
        request.log.error(existingErr);
        return reply.code(500).send({ error: "h2h_load_failed" });
      }

      const responseRows = (existingRows ?? []).map(
        (row) =>
          ({
            scenarioId: row.scenario_id as string,
            answer: row.answer as ScenarioAnswer,
            isCorrect: row.is_correct as boolean,
            pointsEarned: row.points_earned as number,
            responseTimeMs: row.response_time_ms as number,
          }) satisfies WeeklyChallengeResponseRow
      );

      const usernames = await loadLeagueUsernames([
        challenge.challenger_id,
        challenge.challenged_id,
      ]);

      const body: H2HChallengeDetailResponse = {
        challenge: toH2HSummary(challenge, usernames),
        scenarios: scenarios.map((row) => ({
          id: row.id,
          conceptTag: row.concept_tag,
          difficulty: row.difficulty,
          context: row.context,
          prompt: row.prompt,
          choices: normalizeChoices(row.choices),
          correctAnswer: row.correct_answer,
          explanation: row.explanation,
        })),
        submission:
          responseRows.length > 0
            ? {
                totalPoints: responseRows.reduce(
                  (sum, row) => sum + row.pointsEarned,
                  0
                ),
                submittedAt:
                  ((existingRows ?? [])[0]?.created_at as string) ??
                  new Date().toISOString(),
                responses: responseRows,
              }
            : null,
      };

      return body;
    }
  );

  app.post<{ Params: { id: string }; Body: SubmitH2HChallengeBody }>(
    "/challenges/h2h/:id/submit",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const idParsed = uuidSchema.safeParse(request.params.id);
      if (!idParsed.success) {
        return reply.code(404).send({ error: "h2h_not_found" });
      }

      const parsed = submitSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "validation_failed",
          details: parsed.error.flatten(),
        });
      }

      const challenge = await loadH2HChallenge(idParsed.data);
      if (!challenge) {
        return reply.code(404).send({ error: "h2h_not_found" });
      }

      if (
        challenge.challenger_id !== userId &&
        challenge.challenged_id !== userId
      ) {
        return reply.code(403).send({ error: "not_a_participant" });
      }

      if (challenge.status === "complete" || challenge.status === "expired") {
        return reply.code(409).send({ error: "h2h_closed" });
      }

      if (Date.now() > new Date(challenge.expires_at).getTime()) {
        const supabase = getSupabase();
        await supabase
          .from("h2h_challenges")
          .update({ status: "expired" })
          .eq("id", challenge.id);
        return reply.code(409).send({ error: "h2h_closed" });
      }

      const supabase = getSupabase();
      const { count: existingCount, error: existingErr } = await supabase
        .from("challenge_responses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("source_type", "h2h")
        .eq("source_id", challenge.id);

      if (existingErr) {
        request.log.error(existingErr);
        return reply.code(500).send({ error: "submit_failed" });
      }
      if ((existingCount ?? 0) > 0) {
        return reply.code(409).send({ error: "already_submitted" });
      }

      const scenarios = await loadChallengeScenarios(challenge.scenario_set_id);
      if (!scenarios || scenarios.length === 0) {
        return reply.code(500).send({ error: "h2h_load_failed" });
      }

      const scenarioIds = scenarios.map((s) => s.id);
      const submittedIds = parsed.data.responses.map((r) => r.scenarioId);
      const uniqueSubmittedIds = new Set(submittedIds);
      const expectedIds = new Set(scenarioIds);
      if (
        uniqueSubmittedIds.size !== scenarioIds.length ||
        parsed.data.responses.length !== scenarioIds.length
      ) {
        return reply.code(400).send({ error: "incomplete_submission" });
      }
      for (const scenarioId of uniqueSubmittedIds) {
        if (!expectedIds.has(scenarioId)) {
          return reply.code(400).send({ error: "invalid_scenario_submission" });
        }
      }

      const scenarioById = new Map(scenarios.map((s) => [s.id, s] as const));
      const rows = parsed.data.responses.map((response) => {
        const scenario = scenarioById.get(response.scenarioId);
        if (!scenario) {
          throw new Error("scenario_missing");
        }

        const isCorrect = response.answer === scenario.correct_answer;
        const pointsEarned = calcScenarioScore(
          isCorrect,
          scenario.difficulty,
          response.responseTimeMs
        );

        return {
          user_id: userId,
          scenario_id: response.scenarioId,
          source_type: "h2h" as const,
          source_id: challenge.id,
          answer: response.answer,
          is_correct: isCorrect,
          response_time_ms: response.responseTimeMs,
          points_earned: pointsEarned,
        };
      });

      const { error: insertErr } = await supabase
        .from("challenge_responses")
        .insert(rows);

      if (insertErr) {
        request.log.error(insertErr);
        return reply.code(500).send({ error: "submit_failed" });
      }

      const totalPoints = rows.reduce((sum, row) => sum + row.points_earned, 0);

      const scoreField =
        userId === challenge.challenger_id ? "challenger_score" : "challenged_score";
      const interimStatus =
        challenge.status === "pending" ? "active" : challenge.status;

      const { error: scoreUpdateErr } = await supabase
        .from("h2h_challenges")
        .update({
          [scoreField]: totalPoints,
          status: interimStatus,
        })
        .eq("id", challenge.id);

      if (scoreUpdateErr) {
        request.log.error(scoreUpdateErr);
        return reply.code(500).send({ error: "submit_failed" });
      }

      let refreshed = await loadH2HChallenge(challenge.id);
      if (!refreshed) {
        return reply.code(500).send({ error: "submit_failed" });
      }

      if (
        refreshed.challenger_score !== null &&
        refreshed.challenged_score !== null &&
        refreshed.status !== "complete"
      ) {
        const winnerId =
          refreshed.challenger_score >= refreshed.challenged_score
            ? refreshed.challenger_id
            : refreshed.challenged_id;

        const { error: finalizeErr } = await supabase
          .from("h2h_challenges")
          .update({
            status: "complete",
            winner_id: winnerId,
            completed_at: new Date().toISOString(),
          })
          .eq("id", refreshed.id);

        if (finalizeErr) {
          request.log.error(finalizeErr);
          return reply.code(500).send({ error: "submit_failed" });
        }

        refreshed = await loadH2HChallenge(challenge.id);
        if (!refreshed) {
          return reply.code(500).send({ error: "submit_failed" });
        }

        await upsertRivalryForCompletedChallenge(refreshed);

        const { challenge: weeklyChallenge } = await getWeeklyChallengeForLeague(
          refreshed.league_id
        );
        if (weeklyChallenge) {
          await recalcWeeklyResults(weeklyChallenge);
        }
      }

      const responseRows: WeeklyChallengeResponseRow[] = rows.map((row) => ({
        scenarioId: row.scenario_id,
        answer: row.answer,
        isCorrect: row.is_correct,
        pointsEarned: row.points_earned,
        responseTimeMs: row.response_time_ms,
      }));

      const body: SubmitH2HChallengeResponse = {
        challengeId: refreshed.id,
        totalPoints,
        responses: responseRows,
        status: refreshed.status,
        winnerId: refreshed.winner_id,
        challengerScore: refreshed.challenger_score,
        challengedScore: refreshed.challenged_score,
      };

      return reply.code(201).send(body);
    }
  );
}

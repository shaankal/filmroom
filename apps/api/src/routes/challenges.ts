import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type {
  ScenarioAnswer,
  ScenarioChoice,
  ScenarioDifficulty,
  WeeklyChallengeDetailResponse,
  WeeklyChallengeResponseRow,
  WeeklyChallengeResultsResponse,
  WeeklyChallengeSubmitBody,
  WeeklyChallengeSubmitResponse,
} from "@filmroom/types";

import { getSupabase } from "../lib/supabase";
import { calcScenarioScore } from "../services/scoring";

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

async function recalcWeeklyResults(
  challenge: WeeklyChallengeRow
): Promise<Map<string, WeeklyResultsRow>> {
  const supabase = getSupabase();
  const leagueId = challenge.league_id;
  const weekNumber = challenge.week_number;
  const seasonYear = challenge.season_year;

  const { data: previousStandings } = await supabase
    .from("season_standings")
    .select("user_id, rank")
    .eq("league_id", leagueId)
    .eq("season_year", seasonYear);

  const previousRankByUser = new Map<string, number | null>(
    ((previousStandings ?? []) as PreviousRankRow[]).map((row) => [
      row.user_id,
      row.rank,
    ])
  );

  const { data: members, error: membersErr } = await supabase
    .from("league_members")
    .select("user_id, joined_at")
    .eq("league_id", leagueId)
    .eq("is_active", true);

  if (membersErr || !members) {
    throw membersErr ?? new Error("members_missing");
  }

  const memberIds = members.map((row) => row.user_id as string);

  const { data: weeklyResponses, error: responsesErr } = await supabase
    .from("challenge_responses")
    .select("user_id, points_earned, response_time_ms")
    .eq("source_type", "weekly")
    .eq("source_id", challenge.id);

  if (responsesErr) {
    throw responsesErr;
  }

  const responseStats = new Map<
    string,
    { points: number; totalResponseMs: number; count: number }
  >();

  for (const row of weeklyResponses ?? []) {
    const userId = row.user_id as string;
    const current = responseStats.get(userId) ?? {
      points: 0,
      totalResponseMs: 0,
      count: 0,
    };
    current.points += row.points_earned as number;
    current.totalResponseMs += row.response_time_ms as number;
    current.count += 1;
    responseStats.set(userId, current);
  }

  const joinedAtByUser = new Map<string, string>(
    (members ?? []).map((row) => [
      row.user_id as string,
      row.joined_at as string,
    ])
  );

  const upsertRows = memberIds.map((userId) => ({
    league_id: leagueId,
    week_number: weekNumber,
    season_year: seasonYear,
    user_id: userId,
    weekly_challenge_pts: responseStats.get(userId)?.points ?? 0,
    sunday_pts: 0,
    h2h_bonus_pts: 0,
    previous_rank: previousRankByUser.get(userId) ?? null,
  }));

  const { error: upsertErr } = await supabase.from("weekly_results").upsert(
    upsertRows,
    {
      onConflict: "league_id,week_number,season_year,user_id",
    }
  );

  if (upsertErr) {
    throw upsertErr;
  }

  const { data: weeklyRows, error: weeklyRowsErr } = await supabase
    .from("weekly_results")
    .select(
      "user_id, weekly_challenge_pts, sunday_pts, h2h_bonus_pts, total_pts, rank, previous_rank"
    )
    .eq("league_id", leagueId)
    .eq("week_number", weekNumber)
    .eq("season_year", seasonYear);

  if (weeklyRowsErr || !weeklyRows) {
    throw weeklyRowsErr ?? new Error("weekly_rows_missing");
  }

  const rankedRows = [...(weeklyRows as WeeklyResultsRow[])].sort((a, b) => {
    if (b.total_pts !== a.total_pts) return b.total_pts - a.total_pts;

    const aStats = responseStats.get(a.user_id);
    const bStats = responseStats.get(b.user_id);
    const aAvg =
      aStats && aStats.count > 0 ? aStats.totalResponseMs / aStats.count : Infinity;
    const bAvg =
      bStats && bStats.count > 0 ? bStats.totalResponseMs / bStats.count : Infinity;
    if (aAvg !== bAvg) return aAvg - bAvg;

    const aJoined = joinedAtByUser.get(a.user_id) ?? "";
    const bJoined = joinedAtByUser.get(b.user_id) ?? "";
    return aJoined.localeCompare(bJoined);
  });

  for (let index = 0; index < rankedRows.length; index += 1) {
    rankedRows[index]!.rank = index + 1;
  }

  const rankUpdates = rankedRows.map((row) =>
    supabase
      .from("weekly_results")
      .update({ rank: row.rank })
      .eq("league_id", leagueId)
      .eq("week_number", weekNumber)
      .eq("season_year", seasonYear)
      .eq("user_id", row.user_id)
  );
  await Promise.all(rankUpdates);

  const { data: allSeasonRows, error: seasonRowsErr } = await supabase
    .from("weekly_results")
    .select("user_id, total_pts, rank")
    .eq("league_id", leagueId)
    .eq("season_year", seasonYear);

  if (seasonRowsErr || !allSeasonRows) {
    throw seasonRowsErr ?? new Error("season_rows_missing");
  }

  const totalsByUser = new Map<string, { totalPts: number; weeksWon: number }>();
  for (const userId of memberIds) {
    totalsByUser.set(userId, { totalPts: 0, weeksWon: 0 });
  }

  for (const row of allSeasonRows) {
    const userId = row.user_id as string;
    const current = totalsByUser.get(userId) ?? { totalPts: 0, weeksWon: 0 };
    current.totalPts += row.total_pts as number;
    if ((row.rank as number | null) === 1) {
      current.weeksWon += 1;
    }
    totalsByUser.set(userId, current);
  }

  const seasonStandingRows = memberIds.map((userId) => ({
    league_id: leagueId,
    user_id: userId,
    season_year: seasonYear,
    total_pts: totalsByUser.get(userId)?.totalPts ?? 0,
    weeks_won: totalsByUser.get(userId)?.weeksWon ?? 0,
  }));

  const { error: seasonUpsertErr } = await supabase
    .from("season_standings")
    .upsert(seasonStandingRows, {
      onConflict: "league_id,user_id,season_year",
    });

  if (seasonUpsertErr) {
    throw seasonUpsertErr;
  }

  const rankedSeasonRows = [...seasonStandingRows].sort((a, b) => {
    if (b.total_pts !== a.total_pts) return b.total_pts - a.total_pts;
    if (b.weeks_won !== a.weeks_won) return b.weeks_won - a.weeks_won;

    const aJoined = joinedAtByUser.get(a.user_id) ?? "";
    const bJoined = joinedAtByUser.get(b.user_id) ?? "";
    return aJoined.localeCompare(bJoined);
  });

  await Promise.all(
    rankedSeasonRows.map((row, index) =>
      supabase
        .from("season_standings")
        .update({ rank: index + 1, updated_at: new Date().toISOString() })
        .eq("league_id", leagueId)
        .eq("season_year", seasonYear)
        .eq("user_id", row.user_id)
    )
  );

  return new Map(rankedRows.map((row) => [row.user_id, row] as const));
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

      const weeklyResultsByUser = await recalcWeeklyResults(
        challenge as WeeklyChallengeRow
      );
      const userWeeklyResult = weeklyResultsByUser.get(userId);

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
}

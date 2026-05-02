import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type {
  ScenarioAnswer,
  ScenarioChoice,
  ScenarioDifficulty,
  WeeklyChallengeDetailResponse,
  WeeklyChallengeResponseRow,
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

      const body: WeeklyChallengeSubmitResponse = {
        challengeId,
        totalPoints: responseRows.reduce(
          (sum, row) => sum + row.pointsEarned,
          0
        ),
        responses: responseRows,
      };

      return reply.code(201).send(body);
    }
  );
}

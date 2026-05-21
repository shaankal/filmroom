import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ProfileResponse } from "@filmroom/types";

import { requireLeagueMembership, loadLeagueUsernames } from "../lib/league-access";
import { getSupabase } from "../lib/supabase";

const uuidSchema = z.string().uuid();

export async function registerProfileRoutes(app: FastifyInstance) {
  app.get("/profile/me", async (request, reply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.code(401).send({ error: "missing token" });
    }

    const body = await buildProfile(userId, userId, null);
    if (!body) {
      return reply.code(404).send({ error: "profile_not_found" });
    }
    return body;
  });

  app.get<{ Params: { userId: string }; Querystring: { leagueId?: string } }>(
    "/profile/:userId",
    async (request, reply) => {
      const viewerId = request.userId;
      if (!viewerId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const parsed = uuidSchema.safeParse(request.params.userId);
      if (!parsed.success) {
        return reply.code(404).send({ error: "profile_not_found" });
      }

      const leagueId = request.query.leagueId;
      if (leagueId) {
        const ok =
          (await requireLeagueMembership(viewerId, leagueId)) &&
          (await requireLeagueMembership(parsed.data, leagueId));
        if (!ok) {
          return reply.code(403).send({ error: "not_a_member" });
        }
      }

      const body = await buildProfile(parsed.data, viewerId, leagueId ?? null);
      if (!body) {
        return reply.code(404).send({ error: "profile_not_found" });
      }
      return body;
    }
  );
}

async function buildProfile(
  userId: string,
  viewerId: string,
  leagueIdFilter: string | null
): Promise<ProfileResponse | null> {
  const supabase = getSupabase();
  const { data: user } = await supabase
    .from("users")
    .select("id, email, username, global_score, rank_tier, favorite_team")
    .eq("id", userId)
    .maybeSingle();

  if (!user) {
    return null;
  }

  const { data: memberships } = await supabase
    .from("league_members")
    .select("league_id")
    .eq("user_id", userId)
    .eq("is_active", true);

  const leagueIds = (memberships ?? []).map((m) => m.league_id as string);
  const filteredLeagueIds = leagueIdFilter
    ? leagueIds.filter((id) => id === leagueIdFilter)
    : leagueIds;

  const { data: leagues } =
    filteredLeagueIds.length > 0
      ? await supabase
          .from("leagues")
          .select("id, name, season_year")
          .in("id", filteredLeagueIds)
      : { data: [] };

  const { data: standings } =
    filteredLeagueIds.length > 0
      ? await supabase
          .from("season_standings")
          .select("league_id, total_pts, rank, weeks_won, season_year")
          .eq("user_id", userId)
          .in("league_id", filteredLeagueIds)
      : { data: [] };

  const leagueStandings = (leagues ?? []).map((league) => {
    const standing = (standings ?? []).find(
      (row) => row.league_id === league.id
    );
    return {
      leagueId: league.id as string,
      leagueName: league.name as string,
      seasonYear: (standing?.season_year ??
        league.season_year) as number,
      totalPts: (standing?.total_pts as number) ?? 0,
      rank: (standing?.rank as number | null) ?? null,
      weeksWon: (standing?.weeks_won as number) ?? 0,
    };
  });

  let rivalryQuery = supabase
    .from("rivalries")
    .select(
      "league_id, user_a_id, user_b_id, user_a_wins, user_b_wins, last_played"
    )
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  if (leagueIdFilter) {
    rivalryQuery = rivalryQuery.eq("league_id", leagueIdFilter);
  }

  const { data: rivalryRows } = await rivalryQuery;

  const opponentIds = (rivalryRows ?? []).map((row) =>
    row.user_a_id === userId
      ? (row.user_b_id as string)
      : (row.user_a_id as string)
  );
  const usernames = await loadLeagueUsernames([userId, viewerId, ...opponentIds]);

  const rivalries = (rivalryRows ?? []).map((row) => {
    const isA = row.user_a_id === userId;
    const opponentId = isA
      ? (row.user_b_id as string)
      : (row.user_a_id as string);
    return {
      opponentId,
      opponentUsername: usernames.get(opponentId) ?? "unknown",
      yourWins: isA ? (row.user_a_wins as number) : (row.user_b_wins as number),
      theirWins: isA ? (row.user_b_wins as number) : (row.user_a_wins as number),
      lastPlayed: (row.last_played as string | null) ?? null,
    };
  });

  return {
    userId: user.id as string,
    username: user.username as string,
    email: userId === viewerId ? (user.email as string) : "",
    globalScore: user.global_score as number,
    rankTier: user.rank_tier as string,
    favoriteTeam: (user.favorite_team as string | null) ?? null,
    leagueStandings,
    rivalries,
  };
}

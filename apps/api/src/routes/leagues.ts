import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type {
  CreateLeagueBody,
  InvitePreviewResponse,
  LeagueHealthResponse,
  LeagueHubResponse,
  LeagueNudgeResponse,
  LeagueSummary,
  LeaguesListResponse,
  UpdateLeagueSettingsBody,
} from "@filmroom/types";

import {
  loadLeagueUsernames,
  requireLeagueCommissioner,
  requireLeagueMembership,
} from "../lib/league-access";
import { getSupabase } from "../lib/supabase";
import { recalcLeagueHealth } from "../services/health";
import { sendPushToUsers } from "../services/notifications";

const createSchema = z.object({
  name: z.string().min(2).max(64).trim(),
  type: z.enum(["private_fantasy", "creator"]).optional(),
});

const joinSchema = z.object({
  invite_code: z.string().min(4).max(32).trim(),
});

const settingsSchema = z.object({
  name: z.string().min(2).max(64).trim().optional(),
  memberCap: z.number().int().min(2).max(50).optional(),
});

const uuidSchema = z.string().uuid();

function toLeagueSummary(
  row: {
    id: string;
    name: string;
    type: string;
    invite_code: string;
    current_week: number;
    season_year: number;
    commissioner_id: string;
  },
  memberCount: number,
  userId: string
): LeagueSummary {
  return {
    id: row.id,
    name: row.name,
    type: row.type as LeagueSummary["type"],
    inviteCode: row.invite_code,
    currentWeek: row.current_week,
    seasonYear: row.season_year,
    commissionerId: row.commissioner_id,
    memberCount,
    role: row.commissioner_id === userId ? "commissioner" : "member",
  };
}

export async function registerLeagueRoutes(app: FastifyInstance) {
  app.get("/leagues", async (request, reply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.code(401).send({ error: "missing token" });
    }

    const supabase = getSupabase();
    const { data: memberships, error: mErr } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", userId)
      .eq("is_active", true);

    if (mErr) {
      request.log.error(mErr);
      return reply.code(500).send({ error: "server_error" });
    }

    const leagueIds = (memberships ?? []).map((m) => m.league_id);
    if (leagueIds.length === 0) {
      return { leagues: [] satisfies LeaguesListResponse["leagues"] };
    }

    const { data: leagues, error: lErr } = await supabase
      .from("leagues")
      .select(
        "id, name, type, invite_code, current_week, season_year, commissioner_id"
      )
      .in("id", leagueIds);

    if (lErr || !leagues) {
      request.log.error(lErr);
      return reply.code(500).send({ error: "server_error" });
    }

    const { data: memberRows } = await supabase
      .from("league_members")
      .select("league_id")
      .in("league_id", leagueIds)
      .eq("is_active", true);

    const countByLeague = new Map<string, number>();
    for (const r of memberRows ?? []) {
      const id = r.league_id as string;
      countByLeague.set(id, (countByLeague.get(id) ?? 0) + 1);
    }

    const list: LeagueSummary[] = leagues.map((row) =>
      toLeagueSummary(
        row as Parameters<typeof toLeagueSummary>[0],
        countByLeague.get(row.id) ?? 0,
        userId
      )
    );

    list.sort((a, b) => a.name.localeCompare(b.name));
    return { leagues: list };
  });

  app.post<{ Body: CreateLeagueBody }>("/leagues", async (request, reply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.code(401).send({ error: "missing token" });
    }

    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const { name, type } = parsed.data;
    const supabase = getSupabase();

    const { data: league, error: insErr } = await supabase
      .from("leagues")
      .insert({
        name,
        type: type ?? "private_fantasy",
        commissioner_id: userId,
      })
      .select(
        "id, name, type, invite_code, current_week, season_year, commissioner_id"
      )
      .single();

    if (insErr || !league) {
      request.log.error(insErr);
      return reply.code(500).send({ error: "create_failed" });
    }

    const { error: memErr } = await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: userId,
    });

    if (memErr) {
      request.log.error(memErr);
      await supabase.from("leagues").delete().eq("id", league.id);
      return reply.code(500).send({ error: "create_failed" });
    }

    return {
      league: toLeagueSummary(
        league as Parameters<typeof toLeagueSummary>[0],
        1,
        userId
      ),
    };
  });

  app.get<{ Params: { code: string } }>(
    "/leagues/invite/:code",
    async (request, reply) => {
      const raw = request.params.code?.trim() ?? "";
      const code = raw.toLowerCase();
      if (!code) {
        return reply.code(400).send({ error: "invalid_code" });
      }

      const supabase = getSupabase();
      const { data: league, error } = await supabase
        .from("leagues")
        .select(
          "id, name, type, invite_code, member_cap, commissioner_id, health_state"
        )
        .ilike("invite_code", code)
        .maybeSingle();

      if (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "server_error" });
      }
      if (!league) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const { data: comm } = await supabase
        .from("users")
        .select("username")
        .eq("id", league.commissioner_id)
        .maybeSingle();

      const { count, error: cErr } = await supabase
        .from("league_members")
        .select("id", { count: "exact", head: true })
        .eq("league_id", league.id)
        .eq("is_active", true);

      if (cErr) {
        request.log.error(cErr);
        return reply.code(500).send({ error: "server_error" });
      }

      const body: InvitePreviewResponse = {
        leagueId: league.id,
        name: league.name,
        type: league.type as InvitePreviewResponse["type"],
        commissionerUsername: comm?.username ?? "unknown",
        memberCount: count ?? 0,
        memberCap: league.member_cap,
        inviteCode: league.invite_code,
      };

      return body;
    }
  );

  app.post("/leagues/join", async (request, reply) => {
    const userId = request.userId;
    if (!userId) {
      return reply.code(401).send({ error: "missing token" });
    }

    const parsed = joinSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "validation_failed",
        details: parsed.error.flatten(),
      });
    }

    const code = parsed.data.invite_code.toLowerCase();
    const supabase = getSupabase();

    const { data: league, error: lErr } = await supabase
      .from("leagues")
      .select("id, member_cap, health_state")
      .ilike("invite_code", code)
      .maybeSingle();

    if (lErr) {
      request.log.error(lErr);
      return reply.code(500).send({ error: "server_error" });
    }
    if (!league) {
      return reply.code(404).send({ error: "league_not_found" });
    }
    const { data: existing } = await supabase
      .from("league_members")
      .select("id")
      .eq("league_id", league.id)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      return reply.code(409).send({ error: "already_member" });
    }

    const { count, error: cntErr } = await supabase
      .from("league_members")
      .select("id", { count: "exact", head: true })
      .eq("league_id", league.id)
      .eq("is_active", true);

    if (cntErr) {
      request.log.error(cntErr);
      return reply.code(500).send({ error: "server_error" });
    }

    if ((count ?? 0) >= league.member_cap) {
      return reply.code(403).send({ error: "league_full" });
    }

    const { error: jErr } = await supabase.from("league_members").insert({
      league_id: league.id,
      user_id: userId,
    });

    if (jErr) {
      request.log.error(jErr);
      return reply.code(500).send({ error: "join_failed" });
    }

    return { leagueId: league.id };
  });

  app.get<{ Params: { id: string } }>(
    "/leagues/:id",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const idParse = z.string().uuid().safeParse(request.params.id);
      if (!idParse.success) {
        return reply.code(404).send({ error: "league_not_found" });
      }
      const leagueId = idParse.data;

      const supabase = getSupabase();

      const { data: membership } = await supabase
        .from("league_members")
        .select("id")
        .eq("league_id", leagueId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (!membership) {
        return reply.code(403).send({ error: "not_a_member" });
      }

      const { data: league, error: lErr } = await supabase
        .from("leagues")
        .select(
          "id, name, type, invite_code, current_week, season_year, commissioner_id, member_cap, health_state, league_pass_active"
        )
        .eq("id", leagueId)
        .maybeSingle();

      if (lErr || !league) {
        if (lErr) request.log.error(lErr);
        return reply.code(404).send({ error: "league_not_found" });
      }

      const { data: memberRows, error: memErr } = await supabase
        .from("league_members")
        .select("user_id, joined_at")
        .eq("league_id", leagueId)
        .eq("is_active", true);

      if (memErr || !memberRows) {
        request.log.error(memErr);
        return reply.code(500).send({ error: "server_error" });
      }

      const userIds = memberRows.map((m) => m.user_id);
      const { data: users } = await supabase
        .from("users")
        .select("id, username")
        .in("id", userIds);

      const usernameById = new Map(
        (users ?? []).map((u) => [u.id as string, u.username as string])
      );

      const members = memberRows.map((m) => ({
        userId: m.user_id as string,
        username: usernameById.get(m.user_id as string) ?? "unknown",
        joinedAt: (m.joined_at as string) ?? new Date().toISOString(),
        isCommissioner: (m.user_id as string) === league.commissioner_id,
      }));
      members.sort((a, b) => a.username.localeCompare(b.username));

      const { data: standingRows } = await supabase
        .from("season_standings")
        .select("user_id, total_pts, rank, weeks_won")
        .eq("league_id", leagueId)
        .eq("season_year", league.season_year)
        .order("rank", { ascending: true, nullsFirst: false });

      const standings = (standingRows ?? []).map((s) => ({
        userId: s.user_id as string,
        username: usernameById.get(s.user_id as string) ?? "unknown",
        totalPts: s.total_pts as number,
        rank: (s.rank as number | null) ?? null,
        weeksWon: s.weeks_won as number,
      }));

      const { count: pendingH2hCount } = await supabase
        .from("h2h_challenges")
        .select("id", { count: "exact", head: true })
        .eq("league_id", leagueId)
        .or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
        .in("status", ["pending", "active"]);

      const { data: weeklyChallenge } = await supabase
        .from("weekly_challenges")
        .select("id")
        .eq("league_id", leagueId)
        .eq("week_number", league.current_week)
        .eq("season_year", league.season_year)
        .maybeSingle();

      const { data: rivalryRows } = await supabase
        .from("rivalries")
        .select(
          "user_a_id, user_b_id, user_a_wins, user_b_wins, last_played"
        )
        .eq("league_id", leagueId)
        .order("last_played", { ascending: false, nullsFirst: false })
        .limit(10);

      const rivalryUserIds = (rivalryRows ?? []).flatMap((r) => [
        r.user_a_id as string,
        r.user_b_id as string,
      ]);
      const rivalryNames = await loadLeagueUsernames(rivalryUserIds);

      const rivalries = (rivalryRows ?? []).map((row) => ({
        userAId: row.user_a_id as string,
        userAUsername:
          rivalryNames.get(row.user_a_id as string) ?? "unknown",
        userBId: row.user_b_id as string,
        userBUsername:
          rivalryNames.get(row.user_b_id as string) ?? "unknown",
        userAWins: row.user_a_wins as number,
        userBWins: row.user_b_wins as number,
        lastPlayed: (row.last_played as string | null) ?? null,
      }));

      const body: LeagueHubResponse = {
        league: {
          id: league.id,
          name: league.name,
          type: league.type as LeagueHubResponse["league"]["type"],
          inviteCode: league.invite_code,
          currentWeek: league.current_week,
          seasonYear: league.season_year,
          commissionerId: league.commissioner_id,
          memberCap: league.member_cap,
          healthState: league.health_state as LeagueHubResponse["league"]["healthState"],
          leaguePassActive: Boolean(league.league_pass_active),
        },
        members,
        standings,
        pendingH2hCount: pendingH2hCount ?? 0,
        currentWeeklyChallengeId: (weeklyChallenge?.id as string) ?? null,
        rivalries,
      };

      return body;
    }
  );

  app.put<{ Params: { id: string }; Body: UpdateLeagueSettingsBody }>(
    "/leagues/:id/settings",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const idParse = uuidSchema.safeParse(request.params.id);
      if (!idParse.success) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const isCommish = await requireLeagueCommissioner(userId, idParse.data);
      if (!isCommish) {
        return reply.code(403).send({ error: "commissioner_only" });
      }

      const parsed = settingsSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({
          error: "validation_failed",
          details: parsed.error.flatten(),
        });
      }

      const updates: Record<string, unknown> = {};
      if (parsed.data.name) updates.name = parsed.data.name;
      if (parsed.data.memberCap) updates.member_cap = parsed.data.memberCap;

      if (Object.keys(updates).length === 0) {
        return reply.code(400).send({ error: "no_changes" });
      }

      const supabase = getSupabase();
      const { error } = await supabase
        .from("leagues")
        .update(updates)
        .eq("id", idParse.data);

      if (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "update_failed" });
      }

      return { ok: true };
    }
  );

  app.get<{ Params: { id: string } }>(
    "/leagues/:id/health",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const idParse = uuidSchema.safeParse(request.params.id);
      if (!idParse.success) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const isCommish = await requireLeagueCommissioner(userId, idParse.data);
      if (!isCommish) {
        return reply.code(403).send({ error: "commissioner_only" });
      }

      const healthState = await recalcLeagueHealth(idParse.data);
      const supabase = getSupabase();

      const { data: memberRows } = await supabase
        .from("league_members")
        .select("user_id")
        .eq("league_id", idParse.data)
        .eq("is_active", true);

      const memberIds = (memberRows ?? []).map((m) => m.user_id as string);
      const names = await loadLeagueUsernames(memberIds);

      const { data: league } = await supabase
        .from("leagues")
        .select("current_week, season_year")
        .eq("id", idParse.data)
        .maybeSingle();

      const { data: weeklyChallenge } = await supabase
        .from("weekly_challenges")
        .select("id")
        .eq("league_id", idParse.data)
        .eq("week_number", league?.current_week ?? 1)
        .eq("season_year", league?.season_year ?? new Date().getFullYear())
        .maybeSingle();

      let playedSet = new Set<string>();
      if (weeklyChallenge) {
        const { data: played } = await supabase
          .from("challenge_responses")
          .select("user_id")
          .eq("source_type", "weekly")
          .eq("source_id", weeklyChallenge.id);
        playedSet = new Set((played ?? []).map((p) => p.user_id as string));
      }

      const members = memberIds.map((memberId) => ({
        userId: memberId,
        username: names.get(memberId) ?? "unknown",
        playedThisWeek: playedSet.has(memberId),
        lastActiveAt: null,
      }));

      const body: LeagueHealthResponse = {
        leagueId: idParse.data,
        healthState,
        memberCount: memberIds.length,
        activeThisWeek: playedSet.size,
        members,
      };

      return body;
    }
  );

  app.post<{ Params: { id: string } }>(
    "/leagues/:id/nudge",
    async (request, reply) => {
      const userId = request.userId;
      if (!userId) {
        return reply.code(401).send({ error: "missing token" });
      }

      const idParse = uuidSchema.safeParse(request.params.id);
      if (!idParse.success) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const isCommish = await requireLeagueCommissioner(userId, idParse.data);
      if (!isCommish) {
        return reply.code(403).send({ error: "commissioner_only" });
      }

      const supabase = getSupabase();
      const { data: league } = await supabase
        .from("leagues")
        .select("current_week, season_year, name")
        .eq("id", idParse.data)
        .maybeSingle();

      if (!league) {
        return reply.code(404).send({ error: "league_not_found" });
      }

      const { data: memberRows } = await supabase
        .from("league_members")
        .select("user_id")
        .eq("league_id", idParse.data)
        .eq("is_active", true);

      const { data: weeklyChallenge } = await supabase
        .from("weekly_challenges")
        .select("id")
        .eq("league_id", idParse.data)
        .eq("week_number", league.current_week)
        .eq("season_year", league.season_year)
        .maybeSingle();

      const memberIds = (memberRows ?? [])
        .map((m) => m.user_id as string)
        .filter((id) => id !== userId);

      let inactiveUserIds = memberIds;
      if (weeklyChallenge) {
        const { data: played } = await supabase
          .from("challenge_responses")
          .select("user_id")
          .eq("source_type", "weekly")
          .eq("source_id", weeklyChallenge.id);

        const playedSet = new Set((played ?? []).map((p) => p.user_id as string));
        inactiveUserIds = memberIds.filter((id) => !playedSet.has(id));
      }

      await sendPushToUsers(
        inactiveUserIds,
        `${league.name} — Week ${league.current_week}`,
        "Your commish nudged you: play this week's challenge before it locks."
      );

      const body: LeagueNudgeResponse = {
        sent: inactiveUserIds.length,
        inactiveUserIds,
      };

      return body;
    }
  );
}

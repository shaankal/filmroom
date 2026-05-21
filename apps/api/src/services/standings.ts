import { H2H_WIN_BONUS } from "@filmroom/types";

import { getSupabase } from "../lib/supabase";

export type WeeklyChallengeRef = {
  id: string;
  league_id: string;
  week_number: number;
  season_year: number;
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

async function sundayPtsByUser(
  leagueId: string,
  weekNumber: number,
  seasonYear: number
): Promise<Map<string, number>> {
  const supabase = getSupabase();
  const { data: windows } = await supabase
    .from("sunday_windows")
    .select("id")
    .eq("nfl_week", weekNumber)
    .eq("season_year", seasonYear)
    .in("status", ["closed", "scored", "open"]);

  const windowIds = (windows ?? []).map((w) => w.id as string);
  if (windowIds.length === 0) {
    return new Map();
  }

  const { data: results } = await supabase
    .from("sunday_results")
    .select("user_id, total_pts")
    .eq("league_id", leagueId)
    .in("window_id", windowIds);

  const map = new Map<string, number>();
  for (const row of results ?? []) {
    const userId = row.user_id as string;
    map.set(userId, (map.get(userId) ?? 0) + (row.total_pts as number));
  }
  return map;
}

export async function recalcWeeklyResults(
  challenge: WeeklyChallengeRef
): Promise<void> {
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

  const { data: h2hWinRows, error: h2hErr } = await supabase
    .from("h2h_challenges")
    .select("winner_id")
    .eq("league_id", leagueId)
    .eq("week_number", weekNumber)
    .eq("season_year", seasonYear)
    .eq("status", "complete")
    .not("winner_id", "is", null);

  if (h2hErr) {
    throw h2hErr;
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

  const h2hWinsByUser = new Map<string, number>();
  for (const row of (h2hWinRows ?? []) as H2HWinAggregateRow[]) {
    const userId = row.winner_id;
    h2hWinsByUser.set(userId, (h2hWinsByUser.get(userId) ?? 0) + 1);
  }

  const sundayByUser = await sundayPtsByUser(leagueId, weekNumber, seasonYear);

  const upsertRows = memberIds.map((userId) => ({
    league_id: leagueId,
    week_number: weekNumber,
    season_year: seasonYear,
    user_id: userId,
    weekly_challenge_pts: responseStats.get(userId)?.points ?? 0,
    sunday_pts: sundayByUser.get(userId) ?? 0,
    h2h_bonus_pts: (h2hWinsByUser.get(userId) ?? 0) * H2H_WIN_BONUS,
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
      aStats && aStats.count > 0
        ? aStats.totalResponseMs / aStats.count
        : Infinity;
    const bAvg =
      bStats && bStats.count > 0
        ? bStats.totalResponseMs / bStats.count
        : Infinity;
    if (aAvg !== bAvg) return aAvg - bAvg;

    const aJoined = joinedAtByUser.get(a.user_id) ?? "";
    const bJoined = joinedAtByUser.get(b.user_id) ?? "";
    return aJoined.localeCompare(bJoined);
  });

  for (let index = 0; index < rankedRows.length; index += 1) {
    rankedRows[index]!.rank = index + 1;
  }

  await Promise.all(
    rankedRows.map((row) =>
      supabase
        .from("weekly_results")
        .update({ rank: row.rank })
        .eq("league_id", leagueId)
        .eq("week_number", weekNumber)
        .eq("season_year", seasonYear)
        .eq("user_id", row.user_id)
    )
  );

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
}

export async function recalcWeeklyResultsForLeagueWeek(
  leagueId: string,
  weekNumber: number,
  seasonYear: number
): Promise<void> {
  const supabase = getSupabase();
  const { data: challenge } = await supabase
    .from("weekly_challenges")
    .select("id, league_id, week_number, season_year")
    .eq("league_id", leagueId)
    .eq("week_number", weekNumber)
    .eq("season_year", seasonYear)
    .maybeSingle();

  if (!challenge) {
    return;
  }

  await recalcWeeklyResults(challenge as WeeklyChallengeRef);
}

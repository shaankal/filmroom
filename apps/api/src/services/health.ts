import { getSupabase } from "../lib/supabase";

export type LeagueHealthState = "healthy" | "slipping" | "at_risk" | "dormant";

export async function recalcLeagueHealth(leagueId: string): Promise<LeagueHealthState> {
  const supabase = getSupabase();

  const { data: league } = await supabase
    .from("leagues")
    .select("id, current_week, season_year")
    .eq("id", leagueId)
    .maybeSingle();

  if (!league) {
    throw new Error("league_not_found");
  }

  const { count: memberCount } = await supabase
    .from("league_members")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId)
    .eq("is_active", true);

  const totalMembers = memberCount ?? 0;
  if (totalMembers === 0) {
    await supabase
      .from("leagues")
      .update({ health_state: "dormant" })
      .eq("id", leagueId);
    return "dormant";
  }

  const { data: weeklyChallenge } = await supabase
    .from("weekly_challenges")
    .select("id")
    .eq("league_id", leagueId)
    .eq("week_number", league.current_week)
    .eq("season_year", league.season_year)
    .maybeSingle();

  let activeCount = 0;
  if (weeklyChallenge) {
    const { data: responders } = await supabase
      .from("challenge_responses")
      .select("user_id")
      .eq("source_type", "weekly")
      .eq("source_id", weeklyChallenge.id);

    activeCount = new Set(
      (responders ?? []).map((row) => row.user_id as string)
    ).size;
  }

  const ratio = activeCount / totalMembers;
  let health: LeagueHealthState = "healthy";
  if (ratio < 0.25) health = "dormant";
  else if (ratio < 0.5) health = "at_risk";
  else if (ratio < 0.7) health = "slipping";

  await supabase
    .from("leagues")
    .update({ health_state: health })
    .eq("id", leagueId);

  return health;
}

export async function recalcAllLeagueHealth(): Promise<number> {
  const supabase = getSupabase();
  const { data: leagues } = await supabase.from("leagues").select("id");

  for (const row of leagues ?? []) {
    await recalcLeagueHealth(row.id as string);
  }

  return (leagues ?? []).length;
}

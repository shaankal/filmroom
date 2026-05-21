import { getSupabase } from "./supabase";

export async function requireLeagueMembership(
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

export async function requireLeagueCommissioner(
  userId: string,
  leagueId: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("leagues")
    .select("id")
    .eq("id", leagueId)
    .eq("commissioner_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function loadLeagueUsernames(userIds: string[]) {
  const supabase = getSupabase();
  const uniqueIds = [...new Set(userIds)];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const { data: users } = await supabase
    .from("users")
    .select("id, username")
    .in("id", uniqueIds);

  return new Map(
    (users ?? []).map(
      (row) => [row.id as string, row.username as string] as const
    )
  );
}

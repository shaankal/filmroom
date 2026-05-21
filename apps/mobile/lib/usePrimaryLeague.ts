import { useLeagueHubQuery, useLeaguesQuery } from "@/queries/leagues";

export function usePrimaryLeague() {
  const leagues = useLeaguesQuery();
  const primary = leagues.data?.leagues[0] ?? null;
  const hub = useLeagueHubQuery(primary?.id ?? null);

  return { leagues, primary, hub };
}

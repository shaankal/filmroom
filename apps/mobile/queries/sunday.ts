import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SundaySubmitBody } from "@filmroom/types";

import { sundayApi } from "@/lib/sunday-api";

export function useSundayWindowsQuery() {
  return useQuery({
    queryKey: ["sunday", "windows"],
    queryFn: () => sundayApi.windows(),
    staleTime: 60_000,
  });
}

export function useSundayScenariosQuery(windowId: string | null) {
  return useQuery({
    queryKey: ["sunday", "scenarios", windowId],
    queryFn: () => sundayApi.scenarios(windowId!),
    enabled: Boolean(windowId),
  });
}

export function useSundayLiveQuery(leagueId: string | null) {
  return useQuery({
    queryKey: ["sunday", "live", leagueId],
    queryFn: () => sundayApi.live(leagueId!),
    enabled: Boolean(leagueId),
    refetchInterval: 15_000,
  });
}

export function useSubmitSundayMutation(windowId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SundaySubmitBody) => sundayApi.submit(windowId!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["sunday"] });
      void qc.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
}

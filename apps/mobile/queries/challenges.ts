import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { WeeklyChallengeSubmitBody } from "@filmroom/types";

import { challengesApi } from "@/lib/challenges-api";

export function useWeeklyChallengeQuery(leagueId: string | null) {
  return useQuery({
    queryKey: ["challenges", "weekly", leagueId],
    queryFn: () => challengesApi.weeklyForLeague(leagueId!),
    enabled: Boolean(leagueId),
  });
}

export function useSubmitWeeklyChallengeMutation(leagueId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      challengeId,
      body,
    }: {
      challengeId: string;
      body: WeeklyChallengeSubmitBody;
    }) => challengesApi.submitWeekly(challengeId, body),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["challenges", "weekly", leagueId] }),
        qc.invalidateQueries({ queryKey: ["leagues"] }),
        qc.invalidateQueries({ queryKey: ["leagues", "hub", leagueId] }),
      ]);
    },
  });
}

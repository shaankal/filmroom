import type {
  WeeklyChallengeDetailResponse,
  WeeklyChallengeResultsResponse,
  WeeklyChallengeSubmitBody,
  WeeklyChallengeSubmitResponse,
} from "@filmroom/types";

import { api } from "@/lib/api";

export const challengesApi = {
  weeklyForLeague: (leagueId: string) =>
    api.get<WeeklyChallengeDetailResponse>(
      `/challenges/weekly/${encodeURIComponent(leagueId)}`
    ),

  submitWeekly: (challengeId: string, body: WeeklyChallengeSubmitBody) =>
    api.post<WeeklyChallengeSubmitResponse>(
      `/challenges/weekly/${encodeURIComponent(challengeId)}/submit`,
      body
    ),

  weeklyResults: (challengeId: string) =>
    api.get<WeeklyChallengeResultsResponse>(
      `/challenges/weekly/${encodeURIComponent(challengeId)}/results`
    ),
};

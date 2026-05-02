import type {
  CreateLeagueBody,
  CreateLeagueResponse,
  InvitePreviewResponse,
  JoinLeagueBody,
  JoinLeagueResponse,
  LeagueHubResponse,
  LeaguesListResponse,
} from "@filmroom/types";

import { api } from "@/lib/api";

export const leaguesApi = {
  list: () => api.get<LeaguesListResponse>("/leagues"),

  create: (body: CreateLeagueBody) =>
    api.post<CreateLeagueResponse>("/leagues", body),

  invitePreview: (code: string) =>
    api.get<InvitePreviewResponse>(
      `/leagues/invite/${encodeURIComponent(code.trim())}`
    ),

  join: (body: JoinLeagueBody) =>
    api.post<JoinLeagueResponse>("/leagues/join", body),

  hub: (leagueId: string) =>
    api.get<LeagueHubResponse>(`/leagues/${leagueId}`),
};

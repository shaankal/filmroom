import type {
  SundayLiveResponse,
  SundaySubmitBody,
  SundaySubmitResponse,
  SundayWindowScenariosResponse,
  SundayWindowsResponse,
} from "@filmroom/types";

import { api } from "@/lib/api";

export const sundayApi = {
  windows: () => api.get<SundayWindowsResponse>("/sunday/windows"),

  scenarios: (windowId: string) =>
    api.get<SundayWindowScenariosResponse>(
      `/sunday/windows/${encodeURIComponent(windowId)}/scenarios`
    ),

  submit: (windowId: string, body: SundaySubmitBody) =>
    api.post<SundaySubmitResponse>(
      `/sunday/windows/${encodeURIComponent(windowId)}/submit`,
      body
    ),

  live: (leagueId: string) =>
    api.get<SundayLiveResponse>(
      `/sunday/league/${encodeURIComponent(leagueId)}/live`
    ),
};

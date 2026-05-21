import type { ProfileResponse } from "@filmroom/types";

import { api } from "@/lib/api";

export const profileApi = {
  me: () => api.get<ProfileResponse>("/profile/me"),

  user: (userId: string, leagueId?: string) => {
    const q = leagueId ? `?leagueId=${encodeURIComponent(leagueId)}` : "";
    return api.get<ProfileResponse>(`/profile/${encodeURIComponent(userId)}${q}`);
  },
};

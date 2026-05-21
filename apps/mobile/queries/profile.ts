import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/profile-api";

export function useProfileMeQuery() {
  return useQuery({
    queryKey: ["profile", "me"],
    queryFn: () => profileApi.me(),
  });
}

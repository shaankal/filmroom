import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export type HealthResponse = { status: "ok"; ts: string };

export function useHealthQuery() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthResponse>("/health"),
    staleTime: 15_000,
  });
}

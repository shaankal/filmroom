import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CreateH2HChallengeBody, SubmitH2HChallengeBody } from "@filmroom/types";

import { h2hApi } from "@/lib/h2h-api";

export function usePendingH2hQuery() {
  return useQuery({
    queryKey: ["h2h", "pending"],
    queryFn: () => h2hApi.pending(),
    staleTime: 30_000,
  });
}

export function useH2hDetailQuery(id: string | null) {
  return useQuery({
    queryKey: ["h2h", "detail", id],
    queryFn: () => h2hApi.detail(id!),
    enabled: Boolean(id),
  });
}

export function useCreateH2hMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateH2HChallengeBody) => h2hApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["h2h"] });
      void qc.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
}

export function useSubmitH2hMutation(id: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SubmitH2HChallengeBody) => h2hApi.submit(id!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["h2h"] });
      void qc.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
}

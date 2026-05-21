import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { CreateLeagueBody, JoinLeagueBody } from "@filmroom/types";

import { leaguesApi } from "@/lib/leagues-api";

export function useLeaguesQuery() {
  return useQuery({
    queryKey: ["leagues"],
    queryFn: () => leaguesApi.list(),
  });
}

export function useInvitePreviewQuery(code: string | null) {
  const trimmed = code?.trim() ?? "";
  const enabled = trimmed.length >= 4;
  return useQuery({
    queryKey: ["leagues", "invite", trimmed.toLowerCase()],
    queryFn: () => leaguesApi.invitePreview(trimmed),
    enabled,
    retry: false,
  });
}

export function useLeagueHubQuery(leagueId: string | null) {
  return useQuery({
    queryKey: ["leagues", "hub", leagueId],
    queryFn: () => leaguesApi.hub(leagueId!),
    enabled: Boolean(leagueId),
  });
}

export function useCreateLeagueMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLeagueBody) => leaguesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
}

export function useJoinLeagueMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JoinLeagueBody) => leaguesApi.join(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leagues"] });
    },
  });
}

export function useLeagueNudgeMutation(leagueId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => leaguesApi.nudge(leagueId!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leagues", "hub", leagueId] });
    },
  });
}

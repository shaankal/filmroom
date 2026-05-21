import type {
  CreateH2HChallengeBody,
  CreateH2HChallengeResponse,
  H2HChallengeDetailResponse,
  H2HPendingListResponse,
  SubmitH2HChallengeBody,
  SubmitH2HChallengeResponse,
} from "@filmroom/types";

import { api } from "@/lib/api";

export const h2hApi = {
  pending: () => api.get<H2HPendingListResponse>("/challenges/h2h/pending"),

  create: (body: CreateH2HChallengeBody) =>
    api.post<CreateH2HChallengeResponse>("/challenges/h2h", body),

  detail: (id: string) =>
    api.get<H2HChallengeDetailResponse>(
      `/challenges/h2h/${encodeURIComponent(id)}`
    ),

  submit: (id: string, body: SubmitH2HChallengeBody) =>
    api.post<SubmitH2HChallengeResponse>(
      `/challenges/h2h/${encodeURIComponent(id)}/submit`,
      body
    ),
};

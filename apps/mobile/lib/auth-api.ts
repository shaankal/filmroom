import type { AuthSuccessBody } from "@filmroom/types";

import { api } from "./api";
import type { AuthSession } from "@/stores/auth";

export function authSuccessToSession(body: AuthSuccessBody): AuthSession {
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
    userId: body.userId,
    email: body.email,
    username: body.username,
  };
}

export async function registerAccount(input: {
  email: string;
  username: string;
  password: string;
}): Promise<AuthSession> {
  const body = await api.post<AuthSuccessBody>("/auth/register", input);
  return authSuccessToSession(body);
}

export async function loginAccount(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const body = await api.post<AuthSuccessBody>("/auth/login", input);
  return authSuccessToSession(body);
}

export async function refreshSession(
  refresh_token: string
): Promise<Pick<AuthSession, "access_token" | "refresh_token">> {
  const body = await api.post<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }>("/auth/refresh", { refresh_token });
  return {
    access_token: body.access_token,
    refresh_token: body.refresh_token,
  };
}

export async function logoutAccount(): Promise<void> {
  await api.delete("/auth/logout");
}

export async function deleteAccount(): Promise<void> {
  await api.delete("/auth/me");
}

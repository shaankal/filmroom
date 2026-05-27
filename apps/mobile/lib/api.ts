import { useAuthStore } from "@/stores/auth";

function getBaseUrl(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error("EXPO_PUBLIC_API_URL is not set");
  }
  return raw.replace(/\/$/, "");
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const session = useAuthStore.getState().session;
  if (!session?.refresh_token) {
    return false;
  }
  try {
    const res = await fetch(`${getBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(text || `HTTP ${res.status}`);
    }
    const body = JSON.parse(text) as {
      access_token: string;
      refresh_token: string;
    };
    useAuthStore.getState().setSession({
      ...session,
      access_token: body.access_token,
      refresh_token: body.refresh_token,
    });
    return true;
  } catch {
    useAuthStore.getState().clearSession();
    return false;
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retried = false
): Promise<T> {
  const token = useAuthStore.getState().session?.access_token;
  const url = `${getBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  const text = await res.text();
  if (
    res.status === 401 &&
    !retried &&
    token &&
    path !== "/auth/refresh" &&
    path !== "/auth/login" &&
    path !== "/auth/register"
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, init, true);
    }
  }

  if (!res.ok) {
    let message = text || `HTTP ${res.status}`;
    try {
      const body = JSON.parse(text) as { error?: string; message?: string };
      message = body.error ?? body.message ?? message;
    } catch {
      /* keep raw text */
    }
    throw new ApiError(res.status, message);
  }

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  delete: async (path: string) => {
    await apiFetch<void>(path, { method: "DELETE" });
  },
};

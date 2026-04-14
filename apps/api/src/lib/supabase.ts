import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let serviceClient: SupabaseClient | null = null;
let authClient: SupabaseClient | null = null;

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(`Missing ${name} — set it in apps/api/.env`);
  }
  return v;
}

/** Service role — DB writes, auth.admin.*, never expose to clients. */
export function getSupabase(): SupabaseClient {
  if (!serviceClient) {
    const url = requireEnv("SUPABASE_URL");
    const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    serviceClient = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

/**
 * Anon key — GoTrue sign-in / refresh on the server (do not use service role for password grant).
 * Same anon key as EXPO_PUBLIC_SUPABASE_ANON_KEY in the dashboard.
 */
export function getSupabaseAuth(): SupabaseClient {
  if (!authClient) {
    const url = requireEnv("SUPABASE_URL");
    const anon = requireEnv("SUPABASE_ANON_KEY");
    authClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return authClient;
}

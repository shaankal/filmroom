import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const secureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

/**
 * Supabase client for Auth + Realtime (anon key). League data uses the Fastify API.
 * Null until EXPO_PUBLIC_* vars are set in .env.
 */
export const supabase =
  url && anon
    ? createClient(url, anon, {
        auth: {
          storage: Platform.OS === "web" ? undefined : secureStoreAdapter,
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

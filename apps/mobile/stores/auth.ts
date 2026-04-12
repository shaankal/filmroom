import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Mirrors what we will persist after Supabase Auth + API login (Day 7+). */
export type AuthSession = {
  access_token: string;
  refresh_token: string;
  userId: string;
  email?: string;
  username?: string;
};

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession | null) => void;
  clearSession: () => void;
};

const PERSIST_KEY = "filmroom-auth-v1";

function webLikeStorage() {
  return {
    getItem: async (name: string): Promise<string | null> => {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(name);
    },
    setItem: async (name: string, value: string): Promise<void> => {
      localStorage.setItem(name, value);
    },
    removeItem: async (name: string): Promise<void> => {
      localStorage.removeItem(name);
    },
  };
}

function nativeSecureStorage() {
  return {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: PERSIST_KEY,
      storage: createJSONStorage(() =>
        Platform.OS === "web" ? webLikeStorage() : nativeSecureStorage()
      ),
      partialize: (s) => ({ session: s.session }),
    }
  )
);

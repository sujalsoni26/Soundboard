"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/sync";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";

interface SignUpInput {
  email: string;
  password: string;
  securityQuestion: string;
  securityAnswer: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (input: SignUpInput) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchAuthFromServer(): Promise<{
  user: User | null;
  profile: UserProfile | null;
}> {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) return { user: null, profile: null };
    const json = (await res.json()) as {
      user?: { id: string; email?: string | null } | null;
      profile?: UserProfile | null;
    };
    if (!json.user) return { user: null, profile: null };

    const user = {
      id: json.user.id,
      email: json.user.email ?? undefined,
    } as User;

    return { user, profile: json.profile ?? null };
  } catch {
    return { user: null, profile: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);

  const refreshAuth = useCallback(async () => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const auth = await fetchAuthFromServer();
    setUser(auth.user);
    setProfile(auth.profile);
    setLoading(false);
  }, [configured]);

  useEffect(() => {
    if (!configured) return;

    let active = true;

    void (async () => {
      await refreshAuth();
      if (!active) return;
    })();

    const supabase = getSupabaseClient();
    if (!supabase) {
      void Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      // Defer async work — Supabase recommendation to avoid deadlocks
      setTimeout(() => {
        if (!active) return;
        if (session?.user) {
          void refreshAuth();
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }, 0);
    });

    const safetyTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 8000);

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [configured, refreshAuth]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseClient();
      if (!supabase) return { error: "Supabase is not configured" };

      const trimmed = email.trim().toLowerCase();
      if (!trimmed || !password) return { error: "Email and password are required." };

      const { error } = await supabase.auth.signInWithPassword({
        email: trimmed,
        password,
      });

      if (error) return { error: error.message };
      router.refresh();
      await refreshAuth();
      return {};
    },
    [refreshAuth, router],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      const trimmed = input.email.trim().toLowerCase();
      if (!trimmed || !input.password) return { error: "Email and password are required." };

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmed,
            password: input.password,
            securityQuestion: input.securityQuestion,
            securityAnswer: input.securityAnswer,
          }),
        });
        const json = (await res.json()) as { error?: string };
        if (!res.ok) return { error: json.error ?? "Could not create account." };

        const supabase = getSupabaseClient();
        if (!supabase) return { error: "Supabase is not configured" };

        const { error } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password: input.password,
        });

        if (error) return { error: error.message };
        router.refresh();
        await refreshAuth();
        return {};
      } catch {
        return { error: "Could not create account." };
      }
    },
    [refreshAuth, router],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLoading(false);
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured,
      isAdmin: profile?.role === "admin",
      signIn,
      signUp,
      signOut,
      refreshAuth,
    }),
    [user, profile, loading, configured, signIn, signUp, signOut, refreshAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

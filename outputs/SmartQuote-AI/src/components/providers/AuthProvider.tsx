import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { AuthContext, type AuthContextValue } from "@/hooks/auth-context";
import { assertSupabaseConfigured, env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

const DEMO_AUTH_STORAGE_KEY = "smartquote-demo-authenticated";
const DEMO_USER_ID = "00000000-0000-4000-8000-000000000001";

function createDemoSession(): Session {
  const now = new Date().toISOString();
  const demoUser: User = {
    id: DEMO_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "demo@smartquote.ai",
    email_confirmed_at: now,
    confirmed_at: now,
    created_at: now,
    updated_at: now,
    app_metadata: { provider: "demo", providers: ["demo"] },
    user_metadata: { company_name: "SmartQuote AI Demo", name: "Demo User" },
    identities: [],
    is_anonymous: false,
  };

  return {
    access_token: "smartquote-demo-access-token",
    refresh_token: "smartquote-demo-refresh-token",
    expires_in: 60 * 60 * 24 * 7,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    token_type: "bearer",
    user: demoUser,
  };
}

function getStoredDemoSession() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY) === "true" ? createDemoSession() : null;
}

function setStoredDemoSession(enabled: boolean) {
  if (typeof window === "undefined") return;

  if (enabled) {
    window.localStorage.setItem(DEMO_AUTH_STORAGE_KEY, "true");
    return;
  }

  window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (env.demoMode) {
      setSession(getStoredDemoSession());
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, nextSession: Session | null) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      async signIn(email, password) {
        if (env.demoMode) {
          const demoSession = createDemoSession();
          setStoredDemoSession(true);
          setSession(demoSession);
          return;
        }

        assertSupabaseConfigured();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email, password, companyName) {
        assertSupabaseConfigured();
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: env.appUrl + "/verify-email",
            data: { company_name: companyName },
          },
        });
        if (error) throw error;
      },
      async resetPassword(email) {
        assertSupabaseConfigured();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: env.appUrl + "/login",
        });
        if (error) throw error;
      },
      async signOut() {
        if (env.demoMode) {
          setStoredDemoSession(false);
          setSession(null);
          return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

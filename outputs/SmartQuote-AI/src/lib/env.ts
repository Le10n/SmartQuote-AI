const FALLBACK_SUPABASE_URL = "https://placeholder.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "placeholder-anon-key";

interface AppEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appUrl: string;
  isSupabaseConfigured: boolean;
  demoMode: boolean;
}

function readEnv(name: keyof ImportMetaEnv, fallback = "") {
  return import.meta.env[name] || fallback;
}

const configuredSupabaseUrl = readEnv("VITE_SUPABASE_URL");
const configuredSupabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY");

export const env: AppEnv = {
  supabaseUrl: configuredSupabaseUrl || FALLBACK_SUPABASE_URL,
  supabaseAnonKey: configuredSupabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY,
  appUrl: readEnv("VITE_APP_URL", typeof window === "undefined" ? "http://localhost:5173" : window.location.origin),
  isSupabaseConfigured: Boolean(configuredSupabaseUrl && configuredSupabaseAnonKey),
  demoMode: readEnv("VITE_DEMO_MODE") === "true",
};

export function assertSupabaseConfigured() {
  if (!env.isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.");
  }
}

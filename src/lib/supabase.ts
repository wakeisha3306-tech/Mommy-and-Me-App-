import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const hasValidSupabaseUrl = Boolean(supabaseUrl && /^https?:\/\//i.test(supabaseUrl));
const hasValidSupabaseKey = Boolean(
  supabaseAnonKey &&
    supabaseAnonKey !== "your_key_here" &&
    supabaseAnonKey !== "your-anon-key",
);

export const isSupabaseConfigured = hasValidSupabaseUrl && hasValidSupabaseKey;

export function getAuthRedirectUrl(path = "/") {
  if (typeof window === "undefined") {
    return path;
  }

  const base = new URL(import.meta.env.BASE_URL || "/", window.location.origin);
  const normalizedPath = path.replace(/^\/+/, "");

  return new URL(normalizedPath, base).toString();
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

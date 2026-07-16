"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getConfig, isSupabaseConfigured } from "./config";

let cached: { url: string; key: string; client: SupabaseClient } | null = null;

/**
 * Returns a Supabase client built from the runtime BYOK config, or null when
 * Supabase is not configured (the app then runs in local demo mode).
 * Client-side only — the anon key lives in the browser config.
 */
export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const { supabase } = getConfig();
  if (!isSupabaseConfigured()) return null;
  if (cached && cached.url === supabase.url && cached.key === supabase.anonKey) {
    return cached.client;
  }
  try {
    const client = createClient(supabase.url, supabase.anonKey, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
    cached = { url: supabase.url, key: supabase.anonKey, client };
    return client;
  } catch {
    return null;
  }
}

/**
 * BYOK (Bring Your Own Key) configuration store.
 *
 * All third-party credentials for TourSafe are configured at RUNTIME from the
 * UI (Settings) and persisted to the browser's localStorage. No source edits,
 * no .env changes are required to run the app. Optional NEXT_PUBLIC_* env vars
 * act only as first-load defaults.
 *
 * This module is deliberately framework-agnostic (no React) so it can be used
 * from client components, hooks, and fetch helpers alike.
 */

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (fast, recommended)" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (highest quality)" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
] as const;

export const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Google Maps JavaScript API key — the SOLE source used to initialize the
 * Maps loader. Read once from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY at build time,
 * so its value is a stable constant for the entire app lifetime.
 *
 * Deliberately NOT sourced from BYOK/localStorage: @react-google-maps/api's
 * loader is a page-lifetime singleton keyed by `id` — calling it twice with a
 * different `googleMapsApiKey` (e.g. because a user-editable, localStorage-
 * backed key changed at runtime) throws "Loader must not be called again with
 * different options." A build-time constant can never change at runtime, so
 * the loader is always called with identical options.
 */
export const GOOGLE_MAPS_API_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "").trim();

export interface AppConfig {
  gemini: { apiKey: string; model: string };
  maps: { apiKey: string; placesApiKey: string };
  supabase: { url: string; anonKey: string };
}

const STORAGE_KEY = "toursafe.config.v1";

export const CONFIG_CHANGED_EVENT = "toursafe:config-changed";

function envDefaults(): AppConfig {
  return {
    gemini: {
      apiKey: "",
      model: DEFAULT_MODEL,
    },
    maps: {
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      placesApiKey:
        process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ??
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
        "",
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    },
  };
}

export function getConfig(): AppConfig {
  const defaults = envDefaults();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<AppConfig>;
    return {
      gemini: { ...defaults.gemini, ...parsed.gemini },
      maps: { ...defaults.maps, ...parsed.maps },
      supabase: { ...defaults.supabase, ...parsed.supabase },
    };
  } catch {
    return defaults;
  }
}

export function saveConfig(next: AppConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CONFIG_CHANGED_EVENT));
}

export function updateConfig(patch: Partial<AppConfig>): AppConfig {
  const current = getConfig();
  const next: AppConfig = {
    gemini: { ...current.gemini, ...patch.gemini },
    maps: { ...current.maps, ...patch.maps },
    supabase: { ...current.supabase, ...patch.supabase },
  };
  saveConfig(next);
  return next;
}

export function isGeminiConfigured(c: AppConfig = getConfig()): boolean {
  return c.gemini.apiKey.trim().length > 0;
}

export function isMapsConfigured(c: AppConfig = getConfig()): boolean {
  return c.maps.apiKey.trim().length > 0;
}

export function isSupabaseConfigured(c: AppConfig = getConfig()): boolean {
  return c.supabase.url.trim().length > 0 && c.supabase.anonKey.trim().length > 0;
}

/** Mask a secret for safe display, e.g. AIzaSy****...**9kQ */
export function maskKey(key: string): string {
  const k = key.trim();
  if (!k) return "";
  if (k.length <= 8) return "•".repeat(k.length);
  return `${k.slice(0, 4)}${"•".repeat(6)}${k.slice(-4)}`;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AppConfig,
  CONFIG_CHANGED_EVENT,
  getConfig,
  isGeminiConfigured,
  isMapsConfigured,
  isSupabaseConfigured,
  updateConfig as persistUpdate,
} from "@/lib/config";

interface ConfigContextValue {
  config: AppConfig;
  ready: boolean;
  geminiReady: boolean;
  mapsReady: boolean;
  supabaseReady: boolean;
  update: (patch: Partial<AppConfig>) => void;
  refresh: () => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  // Start from env defaults on the server render, hydrate from storage after mount.
  const [config, setConfig] = useState<AppConfig>(() => getConfig());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(() => {
    setConfig(getConfig());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);
    const onChange = () => refresh();
    window.addEventListener(CONFIG_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CONFIG_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const update = useCallback((patch: Partial<AppConfig>) => {
    setConfig(persistUpdate(patch));
  }, []);

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      ready,
      geminiReady: isGeminiConfigured(config),
      mapsReady: isMapsConfigured(config),
      supabaseReady: isSupabaseConfigured(config),
      update,
      refresh,
    }),
    [config, ready, update, refresh],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}

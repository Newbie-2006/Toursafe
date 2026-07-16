"use client";

import { useCallback, useEffect, useState } from "react";

export interface Preferences {
  notifPush: boolean;
  notifWeather: boolean;
  notifCrowd: boolean;
  shareLocation: boolean;
  anonymizeReports: boolean;
  autoShareId: boolean;
}

const DEFAULTS: Preferences = {
  notifPush: true,
  notifWeather: true,
  notifCrowd: true,
  shareLocation: true,
  anonymizeReports: false,
  autoShareId: true,
};

const KEY = "toursafe.preferences.v1";

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setPrefs({ ...DEFAULTS, ...(JSON.parse(raw) as Partial<Preferences>) });
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback((key: keyof Preferences, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { prefs, toggle };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { DigitalIdentity } from "@/types";
import { DEFAULT_IDENTITY } from "@/lib/demo-data";

const KEY = "toursafe.identity.v1";
const EVENT = "toursafe:identity-changed";

function load(): DigitalIdentity {
  if (typeof window === "undefined") return DEFAULT_IDENTITY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_IDENTITY, ...(JSON.parse(raw) as Partial<DigitalIdentity>) };
  } catch {
    /* ignore */
  }
  return DEFAULT_IDENTITY;
}

export function useIdentity() {
  const [identity, setIdentity] = useState<DigitalIdentity>(DEFAULT_IDENTITY);

  useEffect(() => {
    setIdentity(load());
    const onChange = () => setIdentity(load());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const update = useCallback((patch: Partial<DigitalIdentity>) => {
    const next = { ...load(), ...patch };
    window.localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT));
    setIdentity(next);
  }, []);

  return { identity, update };
}

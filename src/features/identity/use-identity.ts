"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DigitalIdentity } from "@/types";
import { generateIdentity, registerIssuedId } from "@/lib/identity";
import { useAuth, type Session } from "@/features/auth/auth-provider";

const PREFIX = "toursafe.identity.v2:";
const EVENT = "toursafe:identity-changed";

/** A stable per-account seed. Two accounts never collide; guests share a persona. */
function seedFor(session: Session | null): string {
  if (!session) return "anon";
  return `${session.role}:${session.email.trim().toLowerCase()}`;
}

function storageKey(seed: string): string {
  return `${PREFIX}${seed}`;
}

function baseIdentity(seed: string, session: Session | null): DigitalIdentity {
  return generateIdentity({
    seed,
    name: session?.name ?? "Traveler",
    guest: session?.guest,
  });
}

/** Load this account's stored identity, or mint + persist a fresh unique one. */
function loadOrCreate(seed: string, session: Session | null): DigitalIdentity {
  const base = baseIdentity(seed, session);
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(storageKey(seed));
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DigitalIdentity>;
      // Merge so any newly-added fields are always present; stored values win.
      return { ...base, ...parsed } as DigitalIdentity;
    }
  } catch {
    /* ignore */
  }
  try {
    window.localStorage.setItem(storageKey(seed), JSON.stringify(base));
  } catch {
    /* ignore quota */
  }
  return base;
}

export function useIdentity() {
  const { session } = useAuth();
  const seed = useMemo(() => seedFor(session), [session]);
  const [identity, setIdentity] = useState<DigitalIdentity>(() => baseIdentity("anon", null));

  useEffect(() => {
    const id = loadOrCreate(seed, session);
    setIdentity(id);
    registerIssuedId(id);
    const onChange = () => setIdentity(loadOrCreate(seed, session));
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
    // Re-run when the signed-in account changes so we always show THAT tourist.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const update = useCallback(
    (patch: Partial<DigitalIdentity>) => {
      const next = { ...loadOrCreate(seed, session), ...patch };
      window.localStorage.setItem(storageKey(seed), JSON.stringify(next));
      registerIssuedId(next);
      window.dispatchEvent(new CustomEvent(EVENT));
      setIdentity(next);
    },
    [seed, session],
  );

  return { identity, update };
}

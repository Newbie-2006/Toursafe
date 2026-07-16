"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DigitalIdentity } from "@/types";
import { generateIdentity, registerIssuedId } from "@/lib/identity";
import { useAuth, type Session } from "@/features/auth/auth-provider";
import { getSupabase } from "@/lib/supabase";

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

/** Best-effort mirror of the issued ID to Supabase (no-op when unconfigured). */
function mirrorIdentity(identity: DigitalIdentity): void {
  const sb = getSupabase();
  if (!sb) return;
  sb.from("digital_ids")
    .upsert({
      tourist_id: identity.touristId,
      full_name: identity.fullName,
      nationality: identity.nationality,
      passport_no: identity.passportNo,
      visa_no: identity.visaNo,
      blood_group: identity.bloodGroup,
      insurance_provider: identity.insuranceProvider,
      insurance_no: identity.insuranceNo,
      emergency_contact_name: identity.emergencyContactName || null,
      emergency_contact_phone: identity.emergencyContactPhone || null,
      verified: identity.verified,
      issued_at: identity.issuedAt,
      expires_at: identity.expiresAt,
      updated_at: new Date().toISOString(),
    })
    .then(
      () => undefined,
      () => undefined,
    );
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
    if (session) mirrorIdentity(id);
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
      mirrorIdentity(next);
      window.dispatchEvent(new CustomEvent(EVENT));
      setIdentity(next);
    },
    [seed, session],
  );

  return { identity, update };
}

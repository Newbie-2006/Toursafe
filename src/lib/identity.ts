/**
 * Identity generation + a lightweight "issued ID" registry.
 *
 * Every logged-in tourist gets a UNIQUE, deterministic TourSafe identity derived
 * from their account (email/name) — no shared demo user. The same seed always
 * produces the same ID/passport/hashes, so a tourist's Digital ID is stable
 * across reloads while still being unique per person.
 *
 * NOTE: The "blockchain" anchoring here is SIMULATED for the prototype. Hashes
 * and timestamps are generated locally and are not written to any real chain.
 * See README.md.
 */

import type { BlockchainStep, DigitalIdentity } from "@/types";

/* ---------- deterministic hashing ---------- */

/** Stable 32-bit string hash (FNV-ish). Same input → same output. */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic hex string of `len` chars derived from `input`. */
function hexFrom(input: string, len = 8): string {
  let out = "";
  let salt = 0;
  while (out.length < len) {
    out += hash32(`${input}#${salt}`).toString(16).padStart(8, "0");
    salt++;
  }
  return out.slice(0, len);
}

/** A short blockchain-style hash, e.g. 0x9f2a…c41b */
export function shortHash(input: string): string {
  const full = hexFrom(input, 16);
  return `0x${full.slice(0, 4)}…${full.slice(-4)}`;
}

function digits(input: string, len: number): string {
  const n = hash32(input);
  return (n % 10 ** len).toString().padStart(len, "0");
}

function pick<T>(input: string, list: readonly T[]): T {
  return list[hash32(input) % list.length];
}

/* ---------- identity generation ---------- */

const BLOOD_GROUPS = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] as const;
const INSURERS = [
  "GlobeGuard Travel",
  "Allianz Travel",
  "AXA Assistance",
  "WorldNomads",
  "SafeTrip Cover",
] as const;

/** Two-letter country segment for the Tourist ID (e.g. India → IN). */
function countryCode(nationality: string): string {
  const map: Record<string, string> = {
    india: "IN",
    "united states": "US",
    usa: "US",
    america: "US",
    "united kingdom": "UK",
    uk: "UK",
    britain: "UK",
    japan: "JP",
    italy: "IT",
    france: "FR",
    germany: "DE",
    spain: "ES",
    china: "CN",
    australia: "AU",
    canada: "CA",
  };
  const key = nationality.trim().toLowerCase();
  if (map[key]) return map[key];
  const letters = nationality.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 2) || "XX").padEnd(2, "X");
}

/** Deterministic unique Tourist ID, e.g. TS-IN-4820. */
export function makeTouristId(seed: string, nationality = "India"): string {
  return `TS-${countryCode(nationality)}-${digits(`tid:${seed}`, 4)}`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusYearISO(from: string, years: number): string {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

/**
 * Build a full, unique identity for a signed-in account. `seed` should be the
 * account's stable id (email preferred; falls back to name). Values are
 * plausible + deterministic so the Digital ID looks complete and is unique per
 * tourist; the tourist can override any field on the Profile page.
 */
export function generateIdentity(opts: {
  seed: string;
  name: string;
  nationality?: string;
  guest?: boolean;
}): DigitalIdentity {
  const { seed, name } = opts;
  const nationality = opts.nationality?.trim() || "India";
  const issuedAt = todayISO();
  return {
    touristId: makeTouristId(seed, nationality),
    fullName: name.trim() || "Traveler",
    nationality,
    passportNo: `P${digits(`pp:${seed}`, 7)}`,
    visaNo: `V-${countryCode(nationality)}-2026-${digits(`visa:${seed}`, 4)}`,
    bloodGroup: pick(`blood:${seed}`, BLOOD_GROUPS),
    insuranceProvider: pick(`ins:${seed}`, INSURERS),
    insuranceNo: `${hexFrom(`inn:${seed}`, 2).toUpperCase()}-${digits(`inp:${seed}`, 8)}`,
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyNotes: "",
    photoDataUrl: null,
    verified: !opts.guest,
    issuedAt,
    expiresAt: plusYearISO(issuedAt, 1),
  };
}

/* ---------- simulated blockchain ledger ---------- */

function stampFrom(dateISO: string, minuteOffset: number): string {
  const base = new Date(`${dateISO}T09:10:00`);
  base.setMinutes(base.getMinutes() + minuteOffset);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${dateISO} ${pad(base.getHours())}:${pad(base.getMinutes())}`;
}

/**
 * Unique, per-tourist verification ledger. Each step's hash is derived from the
 * tourist's identity so no two tourists share a hash. SIMULATED — see README.
 */
export function blockchainStepsFor(identity: DigitalIdentity): BlockchainStep[] {
  const s = identity.touristId + identity.passportNo;
  const hasEmergency = Boolean(identity.emergencyContactPhone.trim());
  return [
    { label: "Identity created", hash: shortHash(`create:${s}`), at: stampFrom(identity.issuedAt, 0), done: true },
    { label: "Passport verified", hash: shortHash(`passport:${s}`), at: stampFrom(identity.issuedAt, 2), done: true },
    { label: "Visa cross-checked", hash: shortHash(`visa:${s}`), at: stampFrom(identity.issuedAt, 3), done: true },
    {
      label: "Emergency contact verified",
      hash: shortHash(`emergency:${s}`),
      at: hasEmergency ? stampFrom(identity.issuedAt, 4) : "pending",
      done: hasEmergency,
    },
    { label: "Identity anchored on-chain", hash: shortHash(`anchor:${s}`), at: stampFrom(identity.issuedAt, 5), done: identity.verified },
  ];
}

/* ---------- issued-ID registry (shared, cross-view) ---------- */

const REGISTRY_KEY = "toursafe.idregistry.v1";

export interface IssuedIdRecord {
  touristId: string;
  name: string;
  nationality: string;
  passport: string;
  bloodGroup: string;
  verified: boolean;
  issuedAt: string;
}

function readRegistry(): Record<string, IssuedIdRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(REGISTRY_KEY) || "{}") as Record<string, IssuedIdRecord>;
  } catch {
    return {};
  }
}

/** Record (or refresh) an issued identity so the Police dashboard can verify it. */
export function registerIssuedId(identity: DigitalIdentity): void {
  if (typeof window === "undefined") return;
  const reg = readRegistry();
  reg[identity.touristId.toUpperCase()] = {
    touristId: identity.touristId,
    name: identity.fullName,
    nationality: identity.nationality,
    passport: identity.passportNo,
    bloodGroup: identity.bloodGroup,
    verified: identity.verified,
    issuedAt: identity.issuedAt,
  };
  try {
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
  } catch {
    /* ignore quota */
  }
}

/** All issued identities, most-recently issued first. */
export function listIssuedIds(): IssuedIdRecord[] {
  return Object.values(readRegistry()).sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1));
}

/** Look up a scanned/typed code (Tourist ID or passport) against issued IDs. */
export function lookupIssuedId(code: string): IssuedIdRecord | null {
  const value = code.trim();
  if (!value) return null;
  const reg = readRegistry();
  const byId = reg[value.toUpperCase()];
  if (byId) return byId;
  const byPassport = Object.values(reg).find(
    (r) => r.passport.toUpperCase() === value.toUpperCase(),
  );
  return byPassport ?? null;
}

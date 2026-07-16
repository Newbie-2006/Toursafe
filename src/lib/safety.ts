import type { LatLng, Poi, PoiType, Zone } from "@/types";
import { haversineKm } from "./utils";

export function nearestPoi(from: LatLng, pois: Poi[], type: PoiType): { poi: Poi; km: number } | null {
  const candidates = pois.filter((p) => p.type === type);
  if (candidates.length === 0) return null;
  let best = candidates[0];
  let bestKm = haversineKm(from, best.location);
  for (const p of candidates.slice(1)) {
    const km = haversineKm(from, p.location);
    if (km < bestKm) {
      best = p;
      bestKm = km;
    }
  }
  return { poi: best, km: bestKm };
}

export type RiskLevel = "low" | "moderate" | "high";

export function activeZone(loc: LatLng, zones: Zone[]): Zone | null {
  for (const z of zones) {
    if (haversineKm(loc, z.center) * 1000 <= z.radiusM) return z;
  }
  return null;
}

export function riskForLocation(loc: LatLng, zones: Zone[]): RiskLevel {
  const z = activeZone(loc, zones);
  if (!z) return "moderate";
  if (z.type === "danger") return "high";
  if (z.type === "caution") return "moderate";
  return "low";
}

/** Derives a 0–100 safety score from current risk + a little live signal. */
export function safetyScore(risk: RiskLevel, activeSosCount: number): number {
  const base = risk === "low" ? 92 : risk === "moderate" ? 74 : 48;
  const penalty = Math.min(activeSosCount * 4, 16);
  return Math.max(20, base - penalty);
}

export function riskColorVar(risk: RiskLevel): string {
  return risk === "low" ? "success" : risk === "moderate" ? "warning" : "danger";
}

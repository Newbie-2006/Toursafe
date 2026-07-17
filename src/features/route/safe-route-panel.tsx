"use client";

import * as React from "react";
import { Clock, Route, Shield, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/features/i18n/i18n-provider";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import { isGmpDenied, markGmpDenied } from "@/lib/maps-availability";
import { useGeolocation } from "@/features/location/use-geolocation";
import { zonesAround } from "@/lib/demo-data";
import { cn, haversineKm } from "@/lib/utils";
import type { LatLng, Zone } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

type Mode = "fastest" | "safest" | "avoidCrowds" | "avoidCrime";

const MODES: { id: Mode; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { id: "fastest", labelKey: "route.fastest", icon: Clock },
  { id: "safest", labelKey: "route.safest", icon: ShieldCheck },
  { id: "avoidCrowds", labelKey: "route.avoidCrowds", icon: Users },
  { id: "avoidCrime", labelKey: "route.avoidCrime", icon: Shield },
];

interface RouteResult {
  mode: Mode;
  etaMin: number;
  distanceKm: number;
  safety: number; // 0-100
}

// Average travel speed used to derive ETA from the route distance.
const AVG_SPEED_KMH = 40;

/** ETA (minutes) for a given road distance at the assumed average speed. */
function etaMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / AVG_SPEED_KMH) * 60));
}

// Fallback deterministic planner, used only when Google Maps is not configured
// or the Directions request can't resolve the destination.
function planRoute(destination: string, mode: Mode): RouteResult {
  const seed = [...destination].reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
  const baseDist = 1.4 + (seed % 40) / 10; // 1.4 - 5.4 km
  const map: Record<Mode, { d: number; s: number }> = {
    fastest: { d: baseDist, s: 68 },
    safest: { d: baseDist * 1.18, s: 94 },
    avoidCrowds: { d: baseDist * 1.1, s: 86 },
    avoidCrime: { d: baseDist * 1.22, s: 91 },
  };
  const m = map[mode];
  return { mode, distanceKm: +m.d.toFixed(1), etaMin: etaMinutes(m.d), safety: m.s };
}

/**
 * How much a route intrudes into the app's caution/danger geofences — used to
 * pick the "safest" / "avoid crime" route out of Google's alternatives.
 */
function dangerScore(route: google.maps.DirectionsRoute, zones: Zone[]): number {
  const path = route.overview_path ?? [];
  if (path.length === 0) return 0;
  let score = 0;
  for (const zone of zones) {
    if (zone.type === "safe") continue;
    const weight = zone.type === "danger" ? 2 : 1;
    for (const pt of path) {
      if (haversineKm({ lat: pt.lat(), lng: pt.lng() }, zone.center) * 1000 <= zone.radiusM) {
        score += weight;
        break;
      }
    }
  }
  return score;
}

/**
 * Real road routing via the Google Directions API. Requests alternatives and
 * picks one according to the selected mode:
 *  - fastest / avoidCrowds → shortest time (traffic-aware),
 *  - safest / avoidCrime  → least intrusion into danger/caution geofences.
 * Returns null if the API isn't loaded or the destination can't be routed.
 */
async function planWithGoogle(
  origin: LatLng,
  destination: string,
  mode: Mode,
  zones: Zone[],
): Promise<RouteResult | null> {
  if (typeof google === "undefined" || !google.maps) return null;
  if (isGmpDenied()) return null; // billing off — use the estimate silently
  const service = new google.maps.DirectionsService();
  const trafficAware = mode === "fastest" || mode === "avoidCrowds";
  const request: google.maps.DirectionsRequest = {
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true,
    ...(trafficAware
      ? { drivingOptions: { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS } }
      : {}),
  };

  let res: google.maps.DirectionsResult;
  try {
    res = await service.route(request);
  } catch (e) {
    // REQUEST_DENIED = key lacks Directions access / billing — latch so we
    // don't retry a doomed request on every keystroke.
    if (/REQUEST_DENIED|OVER_QUERY_LIMIT/i.test(String(e))) markGmpDenied();
    return null;
  }
  const routes = res.routes ?? [];
  if (routes.length === 0) return null;

  const scored = routes.map((r) => {
    const legs = r.legs ?? [];
    const meters = legs.reduce((a, l) => a + (l.distance?.value ?? 0), 0);
    const seconds = legs.reduce(
      (a, l) => a + (l.duration_in_traffic?.value ?? l.duration?.value ?? 0),
      0,
    );
    return { distanceKm: meters / 1000, etaMin: seconds / 60, danger: dangerScore(r, zones) };
  });

  const chosen =
    mode === "fastest" || mode === "avoidCrowds"
      ? scored.reduce((best, c) => (c.etaMin < best.etaMin ? c : best))
      : scored.reduce((best, c) =>
          c.danger < best.danger || (c.danger === best.danger && c.etaMin < best.etaMin) ? c : best,
        );

  const safety = Math.max(55, Math.min(98, 96 - chosen.danger * 12));
  // ETA derived from the real road distance at the assumed average speed.
  return { mode, distanceKm: chosen.distanceKm, etaMin: etaMinutes(chosen.distanceKm), safety };
}

export function SafeRoutePanel({ className }: { className?: string }) {
  const { t } = useI18n();
  const { position } = useGeolocation();
  const [destination, setDestination] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("safest");
  const [result, setResult] = React.useState<RouteResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const compute = React.useCallback(
    async (dest: string, m: Mode) => {
      const trimmed = dest.trim();
      if (!trimmed) return;
      setLoading(true);
      let next: RouteResult | null = null;
      if (GOOGLE_MAPS_API_KEY) {
        next = await planWithGoogle(position, trimmed, m, zonesAround(position));
      }
      if (!next) next = planRoute(trimmed, m); // no key/billing, or not routable
      setResult(next);
      setLoading(false);
    },
    [position],
  );

  // Recompute whenever the destination (debounced) or the routing preference
  // changes, so the shown distance/ETA always reflect the current selection.
  React.useEffect(() => {
    const trimmed = destination.trim();
    if (!trimmed) {
      setResult(null);
      return;
    }
    const id = setTimeout(() => compute(trimmed, mode), 650);
    return () => clearTimeout(id);
  }, [destination, mode, compute]);

  const onFind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    compute(destination, mode);
  };

  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Route className="size-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">{t("route.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("route.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={onFind} className="space-y-3">
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={t("route.destPlaceholder")}
        />
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <m.icon className="size-4" />
                {t(m.labelKey)}
              </button>
            );
          })}
        </div>
        <Button type="submit" className="w-full" disabled={!destination.trim() || loading}>
          <Sparkles className="size-4" />
          {t("route.find")}
        </Button>
      </form>

      {result && (
        <div className="mt-4 animate-fade-in rounded-2xl border border-border/70 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t(MODES.find((m) => m.id === result.mode)!.labelKey)}</p>
            <Badge variant={result.safety >= 90 ? "success" : result.safety >= 80 ? "warning" : "default"}>
              {t("route.safetyRating")} {result.safety}%
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t("route.eta")}</p>
              <p className="font-semibold">{result.etaMin} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("route.distance")}</p>
              <p className="font-semibold">{result.distanceKm.toFixed(1)} km</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

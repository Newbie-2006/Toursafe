"use client";

import * as React from "react";
import { Hospital, Info, Landmark, Phone, Pill, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafetyMap } from "@/features/map/safety-map";
import { SafeRoutePanel } from "@/features/route/safe-route-panel";
import { useI18n } from "@/features/i18n/i18n-provider";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import { useData } from "@/features/data/data-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { poisAround, zonesAround } from "@/lib/demo-data";
import { isGmpDenied, markGmpDenied } from "@/lib/maps-availability";
import { haversineKm, formatDistance, cn } from "@/lib/utils";
import type { LatLng } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

type HelpCategory = "police" | "hospital" | "tourist_info" | "pharmacy" | "atm";

interface HelpItem {
  id: string;
  name: string;
  category: HelpCategory;
  km: number;
  phone?: string;
}

// Practical nearby emergency resources. `request` drives the Google Places
// nearbySearch; `phone` supplies the emergency call number where one applies.
const CATEGORY_META: Record<
  HelpCategory,
  { icon: React.ElementType; tint: string; labelKey: TranslationKey; request: { type?: string; keyword?: string }; phone?: string }
> = {
  police: { icon: ShieldCheck, tint: "text-primary", labelKey: "map.police", request: { type: "police" }, phone: "112" },
  hospital: { icon: Hospital, tint: "text-danger", labelKey: "map.hospital", request: { type: "hospital" }, phone: "102" },
  tourist_info: { icon: Info, tint: "text-accent", labelKey: "map.touristInfo", request: { keyword: "tourist information center" } },
  pharmacy: { icon: Pill, tint: "text-primary", labelKey: "map.pharmacy", request: { type: "pharmacy" } },
  atm: { icon: Landmark, tint: "text-accent", labelKey: "map.atmBank", request: { type: "atm" } },
};

const HELP_ORDER: HelpCategory[] = ["police", "hospital", "tourist_info", "pharmacy", "atm"];

interface CategoryResult {
  item: HelpItem | null;
  /** True when the API rejected the request (no billing / key restriction). */
  denied: boolean;
}

/** Nearest real place of a category from the user's location (via Google Places). */
function nearestForCategory(
  service: google.maps.places.PlacesService,
  location: LatLng,
  category: HelpCategory,
): Promise<CategoryResult> {
  const meta = CATEGORY_META[category];
  return new Promise((resolve) => {
    const request: google.maps.places.PlaceSearchRequest = {
      location,
      rankBy: google.maps.places.RankBy.DISTANCE,
      ...(meta.request.type ? { type: meta.request.type } : {}),
      ...(meta.request.keyword ? { keyword: meta.request.keyword } : {}),
    };
    service.nearbySearch(request, (results, status) => {
      const S = google.maps.places.PlacesServiceStatus;
      if (status === S.REQUEST_DENIED || status === S.OVER_QUERY_LIMIT) {
        resolve({ item: null, denied: true });
        return;
      }
      if (status !== S.OK || !results || results.length === 0) {
        resolve({ item: null, denied: false });
        return;
      }
      const place = results[0];
      const loc = place.geometry?.location;
      if (!loc) {
        resolve({ item: null, denied: false });
        return;
      }
      resolve({
        item: {
          id: place.place_id ?? `${category}-${place.name ?? ""}`,
          name: place.name ?? "",
          category,
          km: haversineKm(location, { lat: loc.lat(), lng: loc.lng() }),
          phone: meta.phone,
        },
        denied: false,
      });
    });
  });
}

// Shared across React StrictMode's double-mounted effects so the capability
// probe issues exactly ONE network request per fetch cycle.
let probePromise: Promise<CategoryResult> | null = null;

export default function MapPage() {
  const { t } = useI18n();
  const { sos } = useData();
  const { position } = useGeolocation();

  const zones = React.useMemo(() => zonesAround(position), [position]);
  const pois = React.useMemo(() => poisAround(position), [position]);

  // Static fallback (nearest police + hospital) when Maps/Places isn't available.
  const fallback = React.useMemo<HelpItem[]>(
    () =>
      poisAround(position)
        .filter((p) => p.type === "police" || p.type === "hospital")
        .map((p) => ({
          id: p.id,
          name: p.name,
          category: p.type as HelpCategory,
          km: haversineKm(position, p.location),
          phone: p.phone,
        }))
        .sort((a, b) => a.km - b.km),
    [position],
  );

  const [places, setPlaces] = React.useState<HelpItem[] | null>(null);

  // Fetch real nearby services from Google Places once the Maps JS API (loaded
  // by the map on this page) is ready. A single probe request runs first: if
  // the Places API is denied (billing off), we latch and keep the fallback
  // silently instead of spamming failed requests.
  React.useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setPlaces(null);
      return;
    }
    let cancelled = false;
    let tries = 0;
    const run = async () => {
      if (cancelled) return;
      if (typeof google === "undefined" || !google.maps?.places) {
        if (tries++ < 20) window.setTimeout(run, 500);
        return;
      }
      if (isGmpDenied()) return;
      const service = new google.maps.places.PlacesService(document.createElement("div"));
      // StrictMode's double-mounted effects share one probe promise → 1 request.
      probePromise ??= nearestForCategory(service, position, HELP_ORDER[0]);
      const probe = await probePromise;
      probePromise = null;
      if (probe.denied) {
        markGmpDenied();
        return;
      }
      if (cancelled) return;
      const rest = await Promise.all(
        HELP_ORDER.slice(1).map((c) => nearestForCategory(service, position, c)),
      );
      if (cancelled) return;
      if (rest.some((r) => r.denied)) markGmpDenied();
      const items = [probe.item, ...rest.map((r) => r.item)].filter(
        (x): x is HelpItem => x !== null,
      );
      if (items.length > 0) setPlaces(items);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [position]);

  const nearby = places ?? fallback;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("dash.liveMap")}</h1>
        <p className="mt-1 text-muted-foreground">{t("map.notConfiguredBody")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SafetyMap
            userPosition={position}
            zones={zones}
            pois={pois}
            sos={sos.filter((s) => s.status !== "resolved")}
            height="min(68vh, 640px)"
          />
        </div>
        <div className="space-y-6">
          <SafeRoutePanel />
          <Card className="p-5">
            <h3 className="mb-3 text-base font-semibold">{t("dash.nearbyHelp")}</h3>
            <div className="space-y-2">
              {nearby.map((item) => (
                <NearbyRow key={item.id} item={item} tLabel={t(CATEGORY_META[item.category].labelKey)} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NearbyRow({ item, tLabel }: { item: HelpItem; tLabel: string }) {
  const meta = CATEGORY_META[item.category];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 p-3">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl bg-muted", meta.tint)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {tLabel} · {formatDistance(item.km)}
        </p>
      </div>
      {item.phone ? (
        <Button asChild variant="outline" size="icon-sm" aria-label="Call">
          <a href={`tel:${item.phone}`}>
            <Phone className="size-4" />
          </a>
        </Button>
      ) : (
        <Badge variant="outline">{formatDistance(item.km)}</Badge>
      )}
    </div>
  );
}

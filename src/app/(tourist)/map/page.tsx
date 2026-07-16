"use client";

import * as React from "react";
import { Building2, Hospital, Phone, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SafetyMap } from "@/features/map/safety-map";
import { SafeRoutePanel } from "@/features/route/safe-route-panel";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useData } from "@/features/data/data-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { poisAround, zonesAround } from "@/lib/demo-data";
import { haversineKm, formatDistance, cn } from "@/lib/utils";
import type { Poi } from "@/types";

const POI_META = {
  police: { icon: ShieldCheck, tint: "text-primary", label: "map.police" },
  hospital: { icon: Hospital, tint: "text-danger", label: "map.hospital" },
  embassy: { icon: Building2, tint: "text-accent", label: "map.embassy" },
} as const;

export default function MapPage() {
  const { t } = useI18n();
  const { sos } = useData();
  const { position } = useGeolocation();

  const zones = React.useMemo(() => zonesAround(position), [position]);
  const pois = React.useMemo(() => poisAround(position), [position]);
  const nearby = React.useMemo(
    () =>
      pois
        .map((p) => ({ ...p, km: haversineKm(position, p.location) }))
        .sort((a, b) => a.km - b.km),
    [pois, position],
  );

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
              {nearby.map((p) => (
                <NearbyRow key={p.id} poi={p} km={p.km} tLabel={t(POI_META[p.type].label)} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NearbyRow({ poi, km, tLabel }: { poi: Poi; km: number; tLabel: string }) {
  const meta = POI_META[poi.type];
  const Icon = meta.icon;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 p-3">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl bg-muted", meta.tint)}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{poi.name}</p>
        <p className="text-xs text-muted-foreground">
          {tLabel} · {formatDistance(km)}
        </p>
      </div>
      {poi.phone ? (
        <Button asChild variant="outline" size="icon-sm" aria-label="Call">
          <a href={`tel:${poi.phone}`}>
            <Phone className="size-4" />
          </a>
        </Button>
      ) : (
        <Badge variant="outline">{formatDistance(km)}</Badge>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Circle,
  GoogleMap,
  Marker,
  useJsApiLoader,
  type Libraries,
} from "@react-google-maps/api";
import { MapPin, MapPinOff, Loader2 } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/lib/config";
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from "./map-styles";
import { DEFAULT_CENTER, POIS, ZONES } from "@/lib/demo-data";
import type { LatLng, Poi, SosRequest, TouristPresence, Zone } from "@/types";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

const LIBRARIES: Libraries = ["places"];

const ZONE_COLORS: Record<Zone["type"], string> = {
  safe: "#48A868",
  caution: "#F2B84B",
  danger: "#E05656",
};

const POI_COLORS: Record<Poi["type"], string> = {
  police: "#2E6B5A",
  hospital: "#E05656",
  embassy: "#74A892",
};

export interface SafetyMapProps {
  center?: LatLng;
  userPosition?: LatLng;
  zones?: Zone[];
  pois?: Poi[];
  sos?: SosRequest[];
  tourists?: TouristPresence[];
  height?: string | number;
  className?: string;
  showUser?: boolean;
  onMarkerClick?: (id: string) => void;
}

export function SafetyMap(props: SafetyMapProps) {
  const { t } = useI18n();

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-border/70 bg-muted/40 bg-grid p-8 text-center",
          props.className,
        )}
        style={{ height: props.height ?? 420 }}
      >
        <div className="grid size-14 place-items-center rounded-2xl bg-card shadow-soft">
          <MapPinOff className="size-7 text-muted-foreground" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="font-semibold">{t("map.notConfigured")}</p>
          <p className="text-sm text-muted-foreground">{t("map.notConfiguredBody")}</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href="/settings/maps">{t("map.configure")}</Link>
        </Button>
      </div>
    );
  }

  return <MapInner {...props} />;
}

function MapInner({
  center,
  userPosition,
  zones = ZONES,
  pois = POIS,
  sos = [],
  tourists = [],
  height = 420,
  className,
  showUser = true,
  onMarkerClick,
}: SafetyMapProps) {
  const { resolvedTheme } = useTheme();
  const { t } = useI18n();
  // Single, app-wide loader instance: same `id` + the same constant apiKey on
  // every mount (dashboard, /map, /police, Settings preview), everywhere.
  const { isLoaded, loadError } = useJsApiLoader({
    id: "toursafe-gmap",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });
  // Google calls window.gm_authFailure on an invalid key / disabled API / no
  // billing. Catch it and show our own clean placeholder instead of Google's
  // red "Oops! Something went wrong" overlay.
  const [authFailed, setAuthFailed] = React.useState(false);
  React.useEffect(() => {
    const w = window as Window & { gm_authFailure?: () => void };
    w.gm_authFailure = () => setAuthFailed(true);
    return () => {
      w.gm_authFailure = undefined;
    };
  }, []);
  const mapRef = React.useRef<google.maps.Map | null>(null);
  const resolvedCenter = center ?? userPosition ?? DEFAULT_CENTER;

  const mapOptions = React.useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      styles: resolvedTheme === "dark" ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      backgroundColor: resolvedTheme === "dark" ? "#12151b" : "#f4f5f2",
      gestureHandling: "greedy",
    }),
    [resolvedTheme],
  );

  const recenter = React.useCallback(() => {
    mapRef.current?.panTo(resolvedCenter);
    mapRef.current?.setZoom(14);
  }, [resolvedCenter]);

  if (loadError || authFailed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl border border-border/70 bg-muted/40 bg-grid p-8 text-center",
          className,
        )}
        style={{ height }}
      >
        <div className="grid size-14 place-items-center rounded-2xl bg-card shadow-soft">
          <MapPinOff className="size-7 text-muted-foreground" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="font-semibold">{t("map.unavailable")}</p>
          <p className="text-sm text-muted-foreground">{t("map.unavailableBody")}</p>
        </div>
        <Button asChild variant="primary" size="sm">
          <Link href="/settings/maps">{t("map.configure")}</Link>
        </Button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-3xl border border-border/70 bg-muted/40",
          className,
        )}
        style={{ height }}
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-border/70", className)} style={{ height }}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={resolvedCenter}
        zoom={14}
        options={mapOptions}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {zones.map((z) => (
          <Circle
            key={z.id}
            center={z.center}
            radius={z.radiusM}
            options={{
              strokeColor: ZONE_COLORS[z.type],
              strokeOpacity: 0.6,
              strokeWeight: 1.5,
              fillColor: ZONE_COLORS[z.type],
              fillOpacity: 0.14,
              clickable: false,
            }}
          />
        ))}

        {pois.map((p) => (
          <Marker
            key={p.id}
            position={p.location}
            title={p.name}
            onClick={() => onMarkerClick?.(p.id)}
            icon={dotIcon(POI_COLORS[p.type])}
          />
        ))}

        {tourists.map((tourist) => (
          <Marker
            key={tourist.id}
            position={tourist.location}
            title={`${tourist.name} · ${tourist.touristId}${
              tourist.safetyScore != null ? ` · safety ${tourist.safetyScore}` : ""
            }`}
            icon={touristIcon(tourist.simulated)}
            onClick={() => onMarkerClick?.(tourist.id)}
            zIndex={500}
          />
        ))}

        {sos.map((s) => (
          <Marker
            key={s.id}
            position={s.location}
            title={`SOS · ${s.touristName}`}
            icon={pulseIcon()}
            zIndex={999}
          />
        ))}

        {showUser && (userPosition || center) && (
          <Marker position={userPosition ?? resolvedCenter} title={t("map.you")} icon={userIcon()} zIndex={998} />
        )}
      </GoogleMap>

      <button
        onClick={recenter}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-2xl border border-border/70 bg-card/90 px-3 py-2 text-xs font-medium text-foreground shadow-soft backdrop-blur transition-colors hover:bg-card"
      >
        <MapPin className="size-3.5" />
        {t("map.recenter")}
      </button>
    </div>
  );
}

function dotIcon(color: string): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 7,
  };
}

function userIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#2E6B5A",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
    scale: 9,
  };
}

function pulseIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#E05656",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
    scale: 10,
  };
}

function touristIcon(simulated?: boolean): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: simulated ? "#8B93A7" : "#5B8DEF",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale: 6,
  };
}

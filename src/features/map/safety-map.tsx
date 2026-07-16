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
import { useConfig } from "@/features/config/config-provider";
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from "./map-styles";
import { DEFAULT_CENTER, POIS, ZONES } from "@/lib/demo-data";
import type { LatLng, Poi, SosRequest, Zone } from "@/types";
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
  height?: string | number;
  className?: string;
  showUser?: boolean;
  onMarkerClick?: (id: string) => void;
}

export function SafetyMap(props: SafetyMapProps) {
  const { config, mapsReady } = useConfig();
  const { t } = useI18n();

  if (!mapsReady) {
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

  return <MapInner key={config.maps.apiKey} apiKey={config.maps.apiKey} {...props} />;
}

function MapInner({
  apiKey,
  center,
  userPosition,
  zones = ZONES,
  pois = POIS,
  sos = [],
  height = 420,
  className,
  showUser = true,
  onMarkerClick,
}: SafetyMapProps & { apiKey: string }) {
  const { resolvedTheme } = useTheme();
  const { t } = useI18n();
  const { isLoaded, loadError } = useJsApiLoader({
    id: "toursafe-gmap",
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });
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

  if (loadError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-3xl border border-border/70 bg-muted/40 p-8 text-center",
          className,
        )}
        style={{ height }}
      >
        <MapPinOff className="size-7 text-danger" />
        <p className="text-sm text-muted-foreground">
          Failed to load Google Maps. Check that your API key is valid and the Maps
          JavaScript API is enabled.
        </p>
        <Button asChild variant="outline" size="sm">
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

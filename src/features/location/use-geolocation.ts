"use client";

import { useCallback, useEffect, useState } from "react";
import type { LatLng } from "@/types";
import { DEFAULT_CENTER } from "@/lib/demo-data";

interface GeolocationState {
  position: LatLng;
  accuracy: number | null;
  status: "idle" | "locating" | "ready" | "denied" | "unavailable";
  isReal: boolean;
}

/**
 * Tries the browser Geolocation API and falls back to the demo center so the
 * app always has a usable position (never blocks the UI).
 */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: DEFAULT_CENTER,
    accuracy: null,
    status: "idle",
    isReal: false,
  });

  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, status: "unavailable" }));
      return;
    }
    setState((s) => ({ ...s, status: "locating" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          status: "ready",
          isReal: true,
        });
      },
      () => {
        setState((s) => ({ ...s, status: "denied" }));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  return { ...state, locate };
}

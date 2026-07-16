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
 *
 * Pass `{ watch: true }` to keep the position live via `watchPosition` (used by
 * the presence reporter so the Police map sees tourists move). Default is a
 * one-shot fix so map views don't jitter/re-center on GPS noise.
 */
export function useGeolocation({ watch = false }: { watch?: boolean } = {}) {
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

  // Optional continuous tracking for live-location features.
  useEffect(() => {
    if (!watch || typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          status: "ready",
          isReal: true,
        });
      },
      () => {
        /* keep last known position */
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [watch]);

  return { ...state, locate };
}

"use client";

import * as React from "react";
import { useAuth } from "@/features/auth/auth-provider";
import { useIdentity } from "@/features/identity/use-identity";
import { useGeolocation } from "@/features/location/use-geolocation";
import { usePresence } from "@/features/presence/presence-provider";
import { zonesAround } from "@/lib/demo-data";
import { riskForLocation, safetyScore } from "@/lib/safety";
import type { TouristPresence } from "@/types";

/**
 * Headless: keeps the signed-in tourist's live presence flowing to the Police
 * Command Center. Renders nothing. Mounted once inside the tourist shell.
 */
export function PresenceReporter() {
  const { session } = useAuth();
  const { identity } = useIdentity();
  const { position } = useGeolocation({ watch: true });
  const { heartbeat, leave } = usePresence();

  // Keep the latest payload in a ref so the heartbeat interval always sends
  // fresh data without re-subscribing on every position change.
  const payloadRef = React.useRef<Omit<TouristPresence, "lastSeen"> | null>(null);

  const isTourist = session?.role === "tourist";
  const score = React.useMemo(() => {
    const zones = zonesAround(position);
    return safetyScore(riskForLocation(position, zones), 0);
  }, [position]);

  payloadRef.current = isTourist
    ? {
        id: identity.touristId,
        touristId: identity.touristId,
        name: identity.fullName || session?.name || "Traveler",
        nationality: identity.nationality,
        location: position,
        safetyScore: score,
      }
    : null;

  // Heartbeat loop + cleanup.
  React.useEffect(() => {
    if (!isTourist) return;
    const id = identity.touristId;
    const beat = () => {
      if (payloadRef.current) heartbeat(payloadRef.current);
    };
    beat();
    const interval = window.setInterval(beat, 6000);
    const onUnload = () => leave(id);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("beforeunload", onUnload);
      leave(id);
    };
  }, [isTourist, identity.touristId, heartbeat, leave]);

  // Send an immediate update when the tourist moves.
  React.useEffect(() => {
    if (isTourist && payloadRef.current) heartbeat(payloadRef.current);
  }, [position, isTourist, heartbeat]);

  return null;
}

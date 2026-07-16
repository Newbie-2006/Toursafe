"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { LatLng, TouristPresence } from "@/types";

/**
 * Live tourist presence bus.
 *
 * Tourist tabs broadcast a periodic "heartbeat" (id + location + safety score);
 * the Police Command Center consumes the fresh set for the live map + crowd
 * density. Transport is a dedicated BroadcastChannel (instant, same-origin) plus
 * a localStorage mirror so a police tab opened later hydrates immediately.
 *
 * This is intentionally separate from DataProvider so frequent heartbeats don't
 * re-render SOS/incident consumers.
 */

const CHANNEL = "toursafe-presence";
const STORAGE_KEY = "toursafe.presence.v1";
const FRESH_MS = 45_000; // shown as "active" if seen within this window
const PRUNE_MS = 180_000; // dropped from storage after this window

type Msg = { type: "beat"; presence: TouristPresence } | { type: "leave"; id: string };

interface PresenceContextValue {
  tourists: TouristPresence[];
  heartbeat: (p: Omit<TouristPresence, "lastSeen">) => void;
  leave: (id: string) => void;
  /** Officer-triggered drill: spawn N simulated, drifting tourists. */
  spawnSimulated: (center: LatLng, count?: number) => void;
  clearSimulated: () => void;
  simulatedCount: number;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

type PresenceMap = Record<string, TouristPresence>;

function loadStore(): PresenceMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as PresenceMap;
  } catch {
    return {};
  }
}

function writeStore(map: PresenceMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function prune(map: PresenceMap): PresenceMap {
  const cutoff = Date.now() - PRUNE_MS;
  const out: PresenceMap = {};
  for (const [id, p] of Object.entries(map)) if (p.lastSeen >= cutoff) out[id] = p;
  return out;
}

/* ---------- simulated-tourist helpers (officer drill only) ---------- */

const SIM_NAMES = [
  "Liam Carter", "Sofia Rossi", "Kenji Tanaka", "Amara Okafor", "Noah Meyer",
  "Yuki Sato", "Elena Petrova", "Mateo Silva", "Aisha Rahman", "Chloe Dubois",
];
const SIM_NATIONS = ["UK", "Italy", "Japan", "Nigeria", "Germany", "Japan", "Russia", "Brazil", "UAE", "France"];

function makeSimAgent(center: LatLng, i: number): TouristPresence {
  const angle = (i / SIM_NAMES.length) * Math.PI * 2;
  const r = 0.006 + Math.random() * 0.02;
  return {
    id: `sim_${i}`,
    touristId: `TS-SM-${(1000 + i * 137).toString().slice(0, 4)}`,
    name: SIM_NAMES[i % SIM_NAMES.length],
    nationality: SIM_NATIONS[i % SIM_NATIONS.length],
    location: { lat: center.lat + Math.sin(angle) * r, lng: center.lng + Math.cos(angle) * r },
    safetyScore: 60 + Math.floor(Math.random() * 38),
    lastSeen: Date.now(),
    simulated: true,
  };
}

function driftAgent(a: TouristPresence): TouristPresence {
  return {
    ...a,
    location: {
      lat: a.location.lat + (Math.random() - 0.5) * 0.0016,
      lng: a.location.lng + (Math.random() - 0.5) * 0.0016,
    },
    lastSeen: Date.now(),
  };
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<PresenceMap>({});
  const [nowTick, setNowTick] = useState(0);
  const [simulatedCount, setSimulatedCount] = useState(0);
  const chanRef = useRef<BroadcastChannel | null>(null);
  const simTimer = useRef<number | null>(null);

  // Hydrate + subscribe to the presence channel and cross-tab storage writes.
  useEffect(() => {
    setMap(prune(loadStore()));
    setNowTick(Date.now());
    let ch: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = (ev: MessageEvent<Msg>) => {
        const msg = ev.data;
        setMap((prev) => {
          if (msg.type === "leave") {
            if (!prev[msg.id]) return prev;
            const next = { ...prev };
            delete next[msg.id];
            return next;
          }
          return { ...prev, [msg.presence.id]: msg.presence };
        });
      };
      chanRef.current = ch;
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setMap(prune(loadStore()));
    };
    window.addEventListener("storage", onStorage);
    return () => {
      ch?.close();
      window.removeEventListener("storage", onStorage);
      if (simTimer.current) window.clearInterval(simTimer.current);
    };
  }, []);

  // Slow tick so freshness expires even without new heartbeats.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 5000);
    return () => window.clearInterval(id);
  }, []);

  const heartbeat = useCallback<PresenceContextValue["heartbeat"]>((p) => {
    const presence: TouristPresence = { ...p, lastSeen: Date.now() };
    setMap((prev) => ({ ...prev, [presence.id]: presence }));
    const store = prune(loadStore());
    store[presence.id] = presence;
    writeStore(store);
    chanRef.current?.postMessage({ type: "beat", presence } satisfies Msg);
  }, []);

  const leave = useCallback<PresenceContextValue["leave"]>((id) => {
    setMap((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    const store = loadStore();
    delete store[id];
    writeStore(store);
    chanRef.current?.postMessage({ type: "leave", id } satisfies Msg);
  }, []);

  const clearSimulated = useCallback(() => {
    if (simTimer.current) {
      window.clearInterval(simTimer.current);
      simTimer.current = null;
    }
    setSimulatedCount(0);
    setMap((prev) => {
      const next: PresenceMap = {};
      for (const [id, p] of Object.entries(prev)) if (!p.simulated) next[id] = p;
      return next;
    });
    const store = loadStore();
    for (const id of Object.keys(store)) if (store[id].simulated) delete store[id];
    writeStore(store);
    for (let i = 0; i < SIM_NAMES.length; i++) chanRef.current?.postMessage({ type: "leave", id: `sim_${i}` } satisfies Msg);
  }, []);

  const spawnSimulated = useCallback<PresenceContextValue["spawnSimulated"]>(
    (center, count = 7) => {
      if (simTimer.current) window.clearInterval(simTimer.current);
      let agents = Array.from({ length: count }, (_, i) => makeSimAgent(center, i));
      setSimulatedCount(count);
      const push = () => {
        for (const a of agents) {
          setMap((prev) => ({ ...prev, [a.id]: a }));
          const store = prune(loadStore());
          store[a.id] = a;
          writeStore(store);
          chanRef.current?.postMessage({ type: "beat", presence: a } satisfies Msg);
        }
      };
      push();
      simTimer.current = window.setInterval(() => {
        agents = agents.map(driftAgent);
        push();
      }, 4000);
    },
    [],
  );

  const tourists = useMemo(() => {
    const cutoff = nowTick - FRESH_MS;
    return Object.values(map)
      .filter((p) => p.lastSeen >= cutoff)
      .sort((a, b) => b.lastSeen - a.lastSeen);
  }, [map, nowTick]);

  const value = useMemo<PresenceContextValue>(
    () => ({ tourists, heartbeat, leave, spawnSimulated, clearSimulated, simulatedCount }),
    [tourists, heartbeat, leave, spawnSimulated, clearSimulated, simulatedCount],
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used within PresenceProvider");
  return ctx;
}

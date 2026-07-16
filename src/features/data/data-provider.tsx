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
import type {
  AlertItem,
  Incident,
  IncidentStatus,
  LatLng,
  Officer,
  SosRequest,
} from "@/types";
import { OFFICERS, SEED_ALERTS } from "@/lib/demo-data";
import { uid } from "@/lib/utils";
import { useConfig } from "@/features/config/config-provider";
import { getSupabase } from "@/lib/supabase";

interface Snapshot {
  incidents: Incident[];
  sos: SosRequest[];
  alerts: AlertItem[];
}

interface DataContextValue extends Snapshot {
  officers: Officer[];
  ready: boolean;
  live: "local" | "supabase";
  createSos: (input: { touristName: string; touristId: string; location: LatLng; message?: string }) => SosRequest;
  acknowledgeSos: (id: string) => void;
  resolveSos: (id: string) => void;
  createIncident: (
    input: Omit<Incident, "id" | "status" | "createdAt" | "assignedOfficerId">,
  ) => Incident;
  assignIncident: (id: string, officerId: string) => void;
  setIncidentStatus: (id: string, status: IncidentStatus) => void;
  pushAlert: (alert: Omit<AlertItem, "id" | "createdAt">) => void;
  dismissAlert: (id: string) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const STORAGE_KEY = "toursafe.data.v1";
const CHANNEL = "toursafe-data";

function loadSnapshot(): Snapshot {
  if (typeof window === "undefined") {
    return { incidents: [], sos: [], alerts: SEED_ALERTS };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Snapshot;
  } catch {
    /* ignore */
  }
  return { incidents: [], sos: [], alerts: SEED_ALERTS };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { supabaseReady } = useConfig();
  const [snap, setSnap] = useState<Snapshot>({ incidents: [], sos: [], alerts: [] });
  const [ready, setReady] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const applyingRemote = useRef(false);

  // Hydrate from storage + open the cross-view broadcast channel.
  useEffect(() => {
    setSnap(loadSnapshot());
    setReady(true);
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const ch = new BroadcastChannel(CHANNEL);
      ch.onmessage = (ev: MessageEvent<Snapshot>) => {
        applyingRemote.current = true;
        setSnap(ev.data);
      };
      channelRef.current = ch;
      return () => ch.close();
    }
  }, []);

  // Persist + broadcast on every local change (but not when echoing a remote update).
  useEffect(() => {
    if (!ready) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch {
      /* ignore quota */
    }
    channelRef.current?.postMessage(snap);
  }, [snap, ready]);

  // Optional Supabase realtime — merges remote rows when configured.
  useEffect(() => {
    if (!ready || !supabaseReady) return;
    const sb = getSupabase();
    if (!sb) return;
    let active = true;

    const refetch = async () => {
      try {
        const [{ data: sosRows }, { data: incRows }] = await Promise.all([
          sb.from("sos_requests").select("*"),
          sb.from("incidents").select("*"),
        ]);
        if (!active) return;
        setSnap((prev) => mergeRemote(prev, sosRows, incRows));
      } catch {
        /* table may not exist yet — stay on local */
      }
    };

    refetch();
    const channel = sb
      .channel("toursafe-db")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_requests" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "incidents" }, refetch)
      .subscribe();

    return () => {
      active = false;
      try {
        sb.removeChannel(channel);
      } catch {
        /* ignore */
      }
    };
  }, [ready, supabaseReady]);

  const mirror = useCallback(
    (table: "sos_requests" | "incidents", row: Record<string, unknown>) => {
      const sb = getSupabase();
      if (!sb) return;
      sb.from(table)
        .upsert(row)
        .then(() => undefined, () => undefined);
    },
    [],
  );

  const createSos = useCallback<DataContextValue["createSos"]>(
    (input) => {
      const sos: SosRequest = {
        id: uid("sos"),
        touristName: input.touristName,
        touristId: input.touristId,
        location: input.location,
        status: "active",
        message: input.message,
        createdAt: new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
      };
      setSnap((prev) => ({ ...prev, sos: [sos, ...prev.sos] }));
      mirror("sos_requests", sosToRow(sos));
      return sos;
    },
    [mirror],
  );

  const acknowledgeSos = useCallback<DataContextValue["acknowledgeSos"]>(
    (id) => {
      setSnap((prev) => {
        const sos = prev.sos.map((s) =>
          s.id === id ? { ...s, status: "acknowledged" as const, acknowledgedAt: new Date().toISOString() } : s,
        );
        const updated = sos.find((s) => s.id === id);
        if (updated) mirror("sos_requests", sosToRow(updated));
        return { ...prev, sos };
      });
    },
    [mirror],
  );

  const resolveSos = useCallback<DataContextValue["resolveSos"]>(
    (id) => {
      setSnap((prev) => {
        const sos = prev.sos.map((s) =>
          s.id === id ? { ...s, status: "resolved" as const, resolvedAt: new Date().toISOString() } : s,
        );
        const updated = sos.find((s) => s.id === id);
        if (updated) mirror("sos_requests", sosToRow(updated));
        return { ...prev, sos };
      });
    },
    [mirror],
  );

  const createIncident = useCallback<DataContextValue["createIncident"]>(
    (input) => {
      const incident: Incident = {
        ...input,
        id: uid("inc"),
        status: "open",
        assignedOfficerId: null,
        createdAt: new Date().toISOString(),
      };
      setSnap((prev) => ({ ...prev, incidents: [incident, ...prev.incidents] }));
      mirror("incidents", incidentToRow(incident));
      return incident;
    },
    [mirror],
  );

  const assignIncident = useCallback<DataContextValue["assignIncident"]>(
    (id, officerId) => {
      setSnap((prev) => {
        const incidents = prev.incidents.map((i) =>
          i.id === id ? { ...i, assignedOfficerId: officerId, status: "assigned" as const } : i,
        );
        const updated = incidents.find((i) => i.id === id);
        if (updated) mirror("incidents", incidentToRow(updated));
        return { ...prev, incidents };
      });
    },
    [mirror],
  );

  const setIncidentStatus = useCallback<DataContextValue["setIncidentStatus"]>(
    (id, status) => {
      setSnap((prev) => {
        const incidents = prev.incidents.map((i) => (i.id === id ? { ...i, status } : i));
        const updated = incidents.find((i) => i.id === id);
        if (updated) mirror("incidents", incidentToRow(updated));
        return { ...prev, incidents };
      });
    },
    [mirror],
  );

  const pushAlert = useCallback<DataContextValue["pushAlert"]>((alert) => {
    setSnap((prev) => ({
      ...prev,
      alerts: [{ ...alert, id: uid("al"), createdAt: new Date().toISOString() }, ...prev.alerts],
    }));
  }, []);

  const dismissAlert = useCallback<DataContextValue["dismissAlert"]>((id) => {
    setSnap((prev) => ({ ...prev, alerts: prev.alerts.filter((a) => a.id !== id) }));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      ...snap,
      officers: OFFICERS,
      ready,
      live: supabaseReady ? "supabase" : "local",
      createSos,
      acknowledgeSos,
      resolveSos,
      createIncident,
      assignIncident,
      setIncidentStatus,
      pushAlert,
      dismissAlert,
    }),
    [
      snap,
      ready,
      supabaseReady,
      createSos,
      acknowledgeSos,
      resolveSos,
      createIncident,
      assignIncident,
      setIncidentStatus,
      pushAlert,
      dismissAlert,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}

/* ---------- Supabase row mappers ---------- */

function sosToRow(s: SosRequest): Record<string, unknown> {
  return {
    id: s.id,
    tourist_name: s.touristName,
    tourist_id: s.touristId,
    lat: s.location.lat,
    lng: s.location.lng,
    status: s.status,
    message: s.message ?? null,
    created_at: s.createdAt,
    acknowledged_at: s.acknowledgedAt ?? null,
    resolved_at: s.resolvedAt ?? null,
  };
}

function incidentToRow(i: Incident): Record<string, unknown> {
  return {
    id: i.id,
    category: i.category,
    priority: i.priority,
    status: i.status,
    title: i.title,
    description: i.description,
    lat: i.location.lat,
    lng: i.location.lng,
    address: i.address ?? null,
    reporter_name: i.reporterName,
    assigned_officer_id: i.assignedOfficerId ?? null,
    created_at: i.createdAt,
  };
}

interface SosRow {
  id: string; tourist_name: string; tourist_id: string; lat: number; lng: number;
  status: SosRequest["status"]; message: string | null; created_at: string;
  acknowledged_at: string | null; resolved_at: string | null;
}
interface IncRow {
  id: string; category: Incident["category"]; priority: Incident["priority"];
  status: IncidentStatus; title: string; description: string; lat: number; lng: number;
  address: string | null; reporter_name: string; assigned_officer_id: string | null; created_at: string;
}

function mergeRemote(
  prev: Snapshot,
  sosRows: SosRow[] | null,
  incRows: IncRow[] | null,
): Snapshot {
  const sos = sosRows
    ? dedupe(
        [
          ...sosRows.map<SosRequest>((r) => ({
            id: r.id,
            touristName: r.tourist_name,
            touristId: r.tourist_id,
            location: { lat: r.lat, lng: r.lng },
            status: r.status,
            message: r.message ?? undefined,
            createdAt: r.created_at,
            acknowledgedAt: r.acknowledged_at,
            resolvedAt: r.resolved_at,
          })),
          ...prev.sos,
        ],
      )
    : prev.sos;

  const incidents = incRows
    ? dedupe(
        [
          ...incRows.map<Incident>((r) => ({
            id: r.id,
            category: r.category,
            priority: r.priority,
            status: r.status,
            title: r.title,
            description: r.description,
            location: { lat: r.lat, lng: r.lng },
            address: r.address ?? undefined,
            reporterName: r.reporter_name,
            assignedOfficerId: r.assigned_officer_id,
            createdAt: r.created_at,
          })),
          ...prev.incidents,
        ],
      )
    : prev.incidents;

  return { ...prev, sos, incidents };
}

function dedupe<T extends { id: string; createdAt: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) if (!map.has(item.id)) map.set(item.id, item);
  return [...map.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

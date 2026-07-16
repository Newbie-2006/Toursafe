"use client";

import { Navigation, ClipboardList, ShieldAlert, Users } from "lucide-react";
import { PoliceTopBar } from "@/features/police/police-topbar";
import { SosQueue } from "@/features/police/sos-queue";
import { IncidentQueue } from "@/features/police/incident-queue";
import { PoliceAnalytics } from "@/features/police/police-analytics";
import { CrowdHeatmap } from "@/features/police/crowd-heatmap";
import { OfficersPanel } from "@/features/police/officers-panel";
import { TranslationCenter } from "@/features/police/translation-center";
import { IdVerification } from "@/features/police/id-verification";
import { SafetyMap } from "@/features/map/safety-map";
import { useData } from "@/features/data/data-provider";
import { usePresence } from "@/features/presence/presence-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { poisAround, zonesAround } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export default function PoliceCommandCenter() {
  const { t } = useI18n();
  const { sos, incidents, officers } = useData();
  const { tourists } = usePresence();
  const { position } = useGeolocation();

  const activeSos = sos.filter((s) => s.status === "active").length;
  const openIncidents = incidents.filter((i) => i.status !== "resolved").length;
  const available = officers.filter((o) => o.status === "available").length;

  const stats = [
    { icon: ShieldAlert, label: t("police.activeSos"), value: activeSos, tint: "text-danger", bg: "bg-danger/12" },
    { icon: ClipboardList, label: t("police.openIncidents"), value: openIncidents, tint: "text-warning", bg: "bg-warning/12" },
    { icon: Users, label: t("police.officersAvailable"), value: available, tint: "text-primary", bg: "bg-primary/12" },
    { icon: Navigation, label: t("police.activeTourists"), value: tourists.length, tint: "text-accent", bg: "bg-accent/12" },
  ];

  const activeSosList = sos.filter((s) => s.status !== "resolved");

  return (
    <div className="min-h-screen">
      <PoliceTopBar />
      <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t("police.overview")}</h1>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-3xl border border-border/70 bg-card p-5">
              <div className="flex items-center justify-between">
                <span className={cn("grid size-10 place-items-center rounded-2xl", s.bg)}>
                  <s.icon className={cn("size-5", s.tint)} />
                </span>
                <span className="text-3xl font-semibold tabular-nums">{s.value}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Map + queues */}
        <div className="grid gap-5 xl:grid-cols-3">
          <div className="space-y-3 xl:col-span-2">
            <h2 className="text-sm font-semibold">{t("police.map")}</h2>
            <SafetyMap
              center={position}
              zones={zonesAround(position)}
              pois={poisAround(position)}
              sos={activeSosList}
              tourists={tourists}
              showUser={false}
              height={420}
            />
            <CrowdHeatmap center={position} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <div className="h-[420px]">
              <SosQueue />
            </div>
            <div className="h-[420px]">
              <IncidentQueue />
            </div>
          </div>
        </div>

        {/* Analytics */}
        <PoliceAnalytics />

        {/* Ops tools */}
        <div className="grid gap-5 lg:grid-cols-3">
          <OfficersPanel />
          <TranslationCenter />
          <IdVerification />
        </div>
      </main>
    </div>
  );
}

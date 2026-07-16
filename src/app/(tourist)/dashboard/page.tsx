"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Building2,
  Clock,
  CloudSun,
  Compass,
  Droplets,
  Hospital,
  IdCard,
  Languages,
  MapPin,
  Route,
  ShieldCheck,
  Siren,
  Wind,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/ui/progress-ring";
import { SafetyMap } from "@/features/map/safety-map";
import { AiAssistant } from "@/features/ai/ai-assistant";
import { DigitalIdCard } from "@/features/identity/digital-id-card";
import { useIdentity } from "@/features/identity/use-identity";
import { SosDialog } from "@/features/sos/sos-dialog";
import { ReportIncidentDialog } from "@/features/incident/report-incident-dialog";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useData } from "@/features/data/data-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { TRAVEL_TIMELINE, WEATHER, poisAround, zonesAround } from "@/lib/demo-data";
import { nearestPoi, riskForLocation, safetyScore, riskColorVar, type RiskLevel } from "@/lib/safety";
import { formatDistance, formatRelativeTime, cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

const RISK_BG: Record<RiskLevel, string> = {
  low: "bg-success/12",
  moderate: "bg-warning/12",
  high: "bg-danger/12",
};
const RISK_TEXT: Record<RiskLevel, string> = {
  low: "text-success",
  moderate: "text-warning",
  high: "text-danger",
};

export default function DashboardPage() {
  const { t } = useI18n();
  const { position } = useGeolocation();
  const { alerts, sos } = useData();
  const { identity } = useIdentity();
  const [sosOpen, setSosOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);

  const activeSos = sos.filter((s) => s.status === "active").length;
  const zones = React.useMemo(() => zonesAround(position), [position]);
  const pois = React.useMemo(() => poisAround(position), [position]);
  const risk = riskForLocation(position, zones);
  const score = safetyScore(risk, activeSos);
  const police = nearestPoi(position, pois, "police");
  const hospital = nearestPoi(position, pois, "hospital");

  const riskLabel: Record<RiskLevel, TranslationKey> = {
    low: "dash.riskLow",
    moderate: "dash.riskModerate",
    high: "dash.riskHigh",
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        title={`${t("nav.dashboard")}`}
        subtitle={t("dash.exploreSafely")}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="card-hover flex items-center gap-4 p-5">
          <ProgressRing value={score} size={72} strokeWidth={7} colorVar={riskColorVar(risk)}>
            <span className="text-lg font-semibold">{score}</span>
          </ProgressRing>
          <div>
            <p className="text-sm text-muted-foreground">{t("dash.safetyScore")}</p>
            <p className="text-base font-semibold">{score}/100</p>
          </div>
        </Card>

        <Card className="card-hover flex flex-col justify-between gap-3 p-5">
          <div className="flex items-center justify-between">
            <span className={cn("grid size-9 place-items-center rounded-2xl", RISK_BG[risk])}>
              <ShieldCheck className={cn("size-5", RISK_TEXT[risk])} />
            </span>
            <RiskBadge risk={risk} label={t(riskLabel[risk])} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{t("dash.currentRisk")}</p>
            <p className="text-base font-semibold">{t(riskLabel[risk])}</p>
          </div>
        </Card>

        <MiniStat
          icon={<ShieldCheck className="size-5 text-primary" />}
          label={t("dash.nearestPolice")}
          value={police ? formatDistance(police.km) : "—"}
          sub={police?.poi.name}
          tint="primary"
        />
        <MiniStat
          icon={<Hospital className="size-5 text-danger" />}
          label={t("dash.nearestHospital")}
          value={hospital ? formatDistance(hospital.km) : "—"}
          sub={hospital?.poi.name}
          tint="danger"
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="eyebrow mb-3">{t("dash.quickActions")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <QuickAction
            onClick={() => setSosOpen(true)}
            icon={<Siren className="size-6" />}
            label={t("dash.sos")}
            danger
          />
          <QuickAction
            onClick={() => setReportOpen(true)}
            icon={<Compass className="size-6" />}
            label={t("dash.reportIncident")}
          />
          <QuickAction href="/map" icon={<MapPin className="size-6" />} label={t("dash.nearbyHelp")} />
          <QuickAction href="/map" icon={<Route className="size-6" />} label={t("dash.safeRoute")} />
          <QuickAction href="/assistant" icon={<Languages className="size-6" />} label={t("dash.translate")} />
          <QuickAction href="/digital-id" icon={<IdCard className="size-6" />} label={t("dash.digitalId")} />
        </div>
      </div>

      {/* Map + right column */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">{t("dash.liveMap")}</h2>
            <Link href="/map" className="text-sm font-medium text-primary hover:underline">
              {t("common.viewAll")}
            </Link>
          </div>
          <SafetyMap
            userPosition={position}
            zones={zones}
            pois={pois}
            sos={sos.filter((s) => s.status !== "resolved")}
            height={420}
          />
          <MapLegend />
        </div>

        <div className="space-y-6">
          <WeatherWidget />
          <RecentAlerts
            items={alerts.slice(0, 4).map((a) => ({
              id: a.id,
              title: a.title,
              body: a.body,
              time: formatRelativeTime(a.createdAt),
              level: a.level,
            }))}
          />
        </div>
      </div>

      {/* AI + Digital ID + Timeline */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">{t("dash.aiAssistant")}</h2>
          </div>
          <AiAssistant height={460} />
        </div>
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{t("dash.digitalIdentity")}</h2>
              <Link href="/digital-id" className="text-sm font-medium text-primary hover:underline">
                {t("common.viewAll")}
              </Link>
            </div>
            <Link href="/digital-id">
              <DigitalIdCard identity={identity} />
            </Link>
          </div>
          <TravelTimeline />
        </div>
      </div>

      <SosDialog open={sosOpen} onClose={() => setSosOpen(false)} />
      <ReportIncidentDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}

function SectionIntro({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1 text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}

function RiskBadge({ risk, label }: { risk: RiskLevel; label: string }) {
  const variant = risk === "low" ? "success" : risk === "moderate" ? "warning" : "danger";
  return <Badge variant={variant}>{label}</Badge>;
}

function MiniStat({
  icon,
  label,
  value,
  sub,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tint: "primary" | "danger";
}) {
  return (
    <Card className="card-hover flex flex-col justify-between gap-3 p-5">
      <span className={cn("grid size-9 place-items-center rounded-2xl", tint === "primary" ? "bg-primary/12" : "bg-danger/12")}>
        {icon}
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-base font-semibold">{value}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
  href,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
}) {
  const inner = (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2.5 rounded-3xl border p-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft-lg",
        danger
          ? "border-transparent bg-danger text-danger-foreground shadow-soft"
          : "border-border/70 bg-card text-foreground hover:border-primary/30",
      )}
    >
      <span className={cn(danger ? "" : "text-primary")}>{icon}</span>
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </div>
  );
  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  );
}

function MapLegend() {
  const { t } = useI18n();
  const items = [
    { color: "#48A868", label: t("map.safeZone") },
    { color: "#F2B84B", label: t("map.caution") },
    { color: "#E05656", label: t("map.dangerZone") },
    { color: "#2E6B5A", label: t("map.police") },
    { color: "#74A892", label: t("map.embassy") },
  ];
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-border/60 bg-card px-4 py-3">
      <span className="eyebrow">{t("map.legend")}</span>
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

function WeatherWidget() {
  const { t } = useI18n();
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between bg-gradient-to-br from-warning/15 to-accent/10 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{t("dash.weather")}</p>
          <p className="mt-1 text-3xl font-semibold">{WEATHER.tempC}°</p>
          <p className="text-sm text-muted-foreground">{WEATHER.condition}</p>
        </div>
        <CloudSun className="size-14 text-warning" />
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/60 text-center">
        <WeatherStat icon={<Droplets className="size-4" />} label={t("weather.humidity")} value={`${WEATHER.humidity}%`} />
        <WeatherStat icon={<Wind className="size-4" />} label={t("weather.wind")} value={`${WEATHER.windKph} km/h`} />
        <WeatherStat icon={<CloudSun className="size-4" />} label={t("weather.feelsLike")} value={`${WEATHER.feelsLikeC}°`} />
      </div>
    </Card>
  );
}

function WeatherStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

const ALERT_DOT: Record<string, string> = {
  info: "bg-primary",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
};

function RecentAlerts({
  items,
}: {
  items: { id: string; title: string; body: string; time: string; level: string }[];
}) {
  const { t } = useI18n();
  return (
    <Card className="p-5">
      <h3 className="text-base font-semibold">{t("dash.recentAlerts")}</h3>
      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">{t("dash.noAlerts")}</p>
        ) : (
          items.map((a) => (
            <div key={a.id} className="flex gap-3">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", ALERT_DOT[a.level])} />
              <div>
                <p className="text-sm font-medium leading-tight">{a.title}</p>
                <p className="text-xs text-muted-foreground">{a.body}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">{a.time}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function TravelTimeline() {
  const { t } = useI18n();
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="size-4 text-primary" />
        <h3 className="text-base font-semibold">{t("dash.travelTimeline")}</h3>
      </div>
      <ol className="relative space-y-4 before:absolute before:left-[5px] before:top-1 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
        {TRAVEL_TIMELINE.map((e) => (
          <li key={e.time} className="relative flex gap-3 pl-5">
            <span
              className={cn(
                "absolute left-0 top-1 size-3 rounded-full ring-2 ring-background",
                e.status === "done"
                  ? "bg-primary"
                  : e.status === "current"
                    ? "bg-warning"
                    : "bg-muted-foreground/30",
              )}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className={cn("text-sm font-medium", e.status === "upcoming" && "text-muted-foreground")}>
                  {e.title}
                </p>
                <span className="text-xs text-muted-foreground">{e.time}</span>
              </div>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="size-3" />
                {e.place}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

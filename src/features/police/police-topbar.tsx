"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Radio, Wifi, Zap } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/features/data/data-provider";
import { useAuth } from "@/features/auth/auth-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { TOURIST_PROFILE } from "@/lib/demo-data";
import { uid } from "@/lib/utils";
import type { IncidentCategory, Priority } from "@/types";

const SIM_INCIDENTS: { title: string; category: IncidentCategory; priority: Priority; description: string }[] = [
  { title: "Pickpocket at metro exit", category: "theft", priority: "high", description: "Tourist reports wallet stolen near the station gate." },
  { title: "Lost child near fountain", category: "other", priority: "critical", description: "A visitor is separated from their child at the plaza." },
  { title: "Aggressive touts", category: "harassment", priority: "medium", description: "Repeated harassment of tourists by unlicensed guides." },
];

export function PoliceTopBar() {
  const { t } = useI18n();
  const router = useRouter();
  const { createSos, createIncident, pushAlert } = useData();
  const { signOut } = useAuth();
  const { position } = useGeolocation();
  const [clock, setClock] = React.useState("");

  React.useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const simulate = () => {
    const jitter = () => (Math.random() - 0.5) * 0.03;
    createSos({
      touristName: ["Liam Carter", "Sofia Rossi", "Kenji Tanaka"][Math.floor(Math.random() * 3)],
      touristId: uid("TS").toUpperCase(),
      location: { lat: position.lat + jitter(), lng: position.lng + jitter() },
      message: "Need immediate assistance.",
    });
    const inc = SIM_INCIDENTS[Math.floor(Math.random() * SIM_INCIDENTS.length)];
    createIncident({
      ...inc,
      location: { lat: position.lat + jitter(), lng: position.lng + jitter() },
      reporterName: TOURIST_PROFILE.name,
      imageDataUrl: null,
    });
    pushAlert({ level: "danger", title: "New SOS received", body: "A live emergency was dispatched to the queue." });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden h-6 w-px bg-border sm:block" />
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight">{t("police.commandCenter")}</p>
            <p className="text-xs text-muted-foreground">{t("police.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="success" className="hidden md:inline-flex">
            <Wifi className="size-3.5" /> Live
          </Badge>
          <span className="hidden items-center gap-1.5 rounded-2xl border border-border/70 bg-card px-3 py-2 font-mono text-sm md:flex">
            <Radio className="size-3.5 text-danger" />
            {clock}
          </span>
          <Button size="sm" variant="outline" onClick={simulate}>
            <Zap className="size-4" />
            <span className="hidden sm:inline">Simulate</span>
          </Button>
          <LanguageSelector />
          <Button asChild size="sm" variant="ghost">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">{t("police.backToTourist")}</span>
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              signOut();
              router.replace("/login?role=police");
            }}
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">{t("auth.signOut")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

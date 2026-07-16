"use client";

import * as React from "react";
import { Clock, Route, Shield, ShieldCheck, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

type Mode = "fastest" | "safest" | "avoidCrowds" | "avoidCrime";

const MODES: { id: Mode; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { id: "fastest", labelKey: "route.fastest", icon: Clock },
  { id: "safest", labelKey: "route.safest", icon: ShieldCheck },
  { id: "avoidCrowds", labelKey: "route.avoidCrowds", icon: Users },
  { id: "avoidCrime", labelKey: "route.avoidCrime", icon: Shield },
];

interface RouteResult {
  mode: Mode;
  etaMin: number;
  distanceKm: number;
  safety: number; // 0-100
}

// Deterministic pseudo-planner: produces sensible, distinct trade-offs per mode.
function planRoute(destination: string, mode: Mode): RouteResult {
  const seed = [...destination].reduce((a, c) => a + c.charCodeAt(0), 0) || 42;
  const baseDist = 1.4 + (seed % 40) / 10; // 1.4 - 5.4 km
  const map: Record<Mode, { d: number; t: number; s: number }> = {
    fastest: { d: baseDist, t: baseDist * 12, s: 68 },
    safest: { d: baseDist * 1.18, t: baseDist * 15, s: 94 },
    avoidCrowds: { d: baseDist * 1.1, t: baseDist * 14, s: 86 },
    avoidCrime: { d: baseDist * 1.22, t: baseDist * 16, s: 91 },
  };
  const m = map[mode];
  return { mode, distanceKm: +m.d.toFixed(1), etaMin: Math.round(m.t), safety: m.s };
}

export function SafeRoutePanel({ className }: { className?: string }) {
  const { t } = useI18n();
  const [destination, setDestination] = React.useState("");
  const [mode, setMode] = React.useState<Mode>("safest");
  const [result, setResult] = React.useState<RouteResult | null>(null);

  const onFind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;
    setResult(planRoute(destination.trim(), mode));
  };

  return (
    <Card className={cn("p-5", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Route className="size-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">{t("route.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("route.subtitle")}</p>
        </div>
      </div>

      <form onSubmit={onFind} className="space-y-3">
        <Input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={t("route.destPlaceholder")}
        />
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                <m.icon className="size-4" />
                {t(m.labelKey)}
              </button>
            );
          })}
        </div>
        <Button type="submit" className="w-full" disabled={!destination.trim()}>
          <Sparkles className="size-4" />
          {t("route.find")}
        </Button>
      </form>

      {result && (
        <div className="mt-4 animate-fade-in rounded-2xl border border-border/70 bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{t(MODES.find((m) => m.id === result.mode)!.labelKey)}</p>
            <Badge variant={result.safety >= 90 ? "success" : result.safety >= 80 ? "warning" : "default"}>
              {t("route.safetyRating")} {result.safety}%
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">{t("route.eta")}</p>
              <p className="font-semibold">{result.etaMin} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("route.distance")}</p>
              <p className="font-semibold">{result.distanceKm} km</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

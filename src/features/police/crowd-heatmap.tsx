"use client";

import * as React from "react";
import { Flame } from "lucide-react";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

// Deterministic pseudo-density grid that gently animates to feel "live".
function baseGrid(): number[] {
  const cells = 48;
  return Array.from({ length: cells }, (_, i) => {
    const x = i % 8;
    const y = Math.floor(i / 8);
    const centerBias = 1 - (Math.abs(x - 4) + Math.abs(y - 3)) / 10;
    return Math.max(0.05, Math.min(1, centerBias * (0.6 + ((i * 37) % 40) / 100)));
  });
}

function intensityColor(v: number): string {
  if (v > 0.8) return "bg-danger";
  if (v > 0.6) return "bg-warning";
  if (v > 0.4) return "bg-accent";
  if (v > 0.2) return "bg-primary/60";
  return "bg-primary/20";
}

export function CrowdHeatmap() {
  const { t } = useI18n();
  const [grid, setGrid] = React.useState<number[]>(baseGrid);

  React.useEffect(() => {
    const id = setInterval(() => {
      setGrid((prev) => prev.map((v) => cn2(v + (Math.random() - 0.5) * 0.18)));
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-warning" />
          <h3 className="text-sm font-semibold">{t("police.crowdDensity")}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-primary/40" /> Low
          <span className="ml-2 size-2 rounded-full bg-warning" /> Med
          <span className="ml-2 size-2 rounded-full bg-danger" /> High
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {grid.map((v, i) => (
          <div
            key={i}
            className={cn("aspect-square rounded-md transition-colors duration-700", intensityColor(v))}
            style={{ opacity: 0.35 + v * 0.65 }}
          />
        ))}
      </div>
    </div>
  );
}

function cn2(v: number): number {
  return Math.max(0.05, Math.min(1, v));
}

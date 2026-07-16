"use client";

import * as React from "react";
import { Flame, Users } from "lucide-react";
import { usePresence } from "@/features/presence/presence-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { DEFAULT_CENTER } from "@/lib/demo-data";
import { clamp, cn } from "@/lib/utils";
import type { LatLng } from "@/types";

const COLS = 8;
const ROWS = 6;
const SPAN = 0.05; // ~5 km half-window around the command-center view

/** Map a coordinate into a grid cell, or null if it's outside the window. */
function cellIndex(loc: LatLng, center: LatLng): number | null {
  const west = center.lng - SPAN;
  const east = center.lng + SPAN;
  const north = center.lat + SPAN;
  const south = center.lat - SPAN;
  if (loc.lng < west || loc.lng > east || loc.lat < south || loc.lat > north) return null;
  const col = clamp(Math.floor(((loc.lng - west) / (east - west)) * COLS), 0, COLS - 1);
  const row = clamp(Math.floor(((north - loc.lat) / (north - south)) * ROWS), 0, ROWS - 1);
  return row * COLS + col;
}

function intensityClass(count: number): string {
  if (count <= 0) return "bg-muted";
  if (count === 1) return "bg-success"; // low
  if (count === 2) return "bg-warning"; // medium
  return "bg-danger"; // high
}

/**
 * Real crowd density: divides the city view into a grid and colours each cell by
 * how many active tourists are inside it. Updates automatically as tourists move
 * (driven by live presence heartbeats) — no random values.
 */
export function CrowdHeatmap({ center = DEFAULT_CENTER }: { center?: LatLng }) {
  const { t } = useI18n();
  const { tourists } = usePresence();

  const { grid, inView, hottest } = React.useMemo(() => {
    const cells = new Array<number>(COLS * ROWS).fill(0);
    let counted = 0;
    for (const tourist of tourists) {
      const idx = cellIndex(tourist.location, center);
      if (idx !== null) {
        cells[idx] += 1;
        counted += 1;
      }
    }
    return { grid: cells, inView: counted, hottest: Math.max(0, ...cells) };
  }, [tourists, center]);

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-warning" />
          <h3 className="text-sm font-semibold">{t("police.crowdDensity")}</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-2 rounded-full bg-success" /> Low
          <span className="ml-2 size-2 rounded-full bg-warning" /> Med
          <span className="ml-2 size-2 rounded-full bg-danger" /> High
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {grid.map((count, i) => (
          <div
            key={i}
            title={count > 0 ? `${count} tourist${count > 1 ? "s" : ""}` : "No tourists"}
            className={cn("aspect-square rounded-md transition-colors duration-500", intensityClass(count))}
            style={{ opacity: count <= 0 ? 0.3 : 0.55 + Math.min(count, 4) * 0.11 }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          {inView > 0
            ? `${inView} tourist${inView > 1 ? "s" : ""} in view · peak ${hottest}/cell`
            : "No active tourists in view yet"}
        </span>
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
          <span className="relative inline-flex size-2 rounded-full bg-success" />
        </span>
      </div>
    </div>
  );
}

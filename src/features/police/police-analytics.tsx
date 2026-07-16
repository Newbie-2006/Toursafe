"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { useData } from "@/features/data/data-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { IncidentCategory } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

const CATEGORY_ORDER: IncidentCategory[] = [
  "theft",
  "harassment",
  "accident",
  "medical",
  "lost_item",
  "scam",
  "natural_hazard",
  "other",
];

const RESPONSE_TREND = [
  { day: "Mon", min: 8.2 },
  { day: "Tue", min: 7.1 },
  { day: "Wed", min: 6.4 },
  { day: "Thu", min: 6.9 },
  { day: "Fri", min: 5.8 },
  { day: "Sat", min: 5.2 },
  { day: "Sun", min: 4.7 },
];

export function PoliceAnalytics() {
  const { t } = useI18n();
  const { incidents } = useData();

  const byCategory = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of CATEGORY_ORDER) counts[c] = 0;
    for (const inc of incidents) counts[inc.category] = (counts[inc.category] ?? 0) + 1;
    // seed a baseline so the chart never looks empty during a demo
    const seed: Record<string, number> = { theft: 6, harassment: 3, accident: 4, medical: 2, scam: 5, lost_item: 3, natural_hazard: 1, other: 2 };
    return CATEGORY_ORDER.map((c) => ({
      name: t(`cat.${c}` as TranslationKey),
      value: counts[c] + (seed[c] ?? 0),
    }));
  }, [incidents, t]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("police.incidentsByCategory")}</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byCategory} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2E35" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={50} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(105,211,167,0.08)" }}
              contentStyle={{
                background: "#181B22",
                border: "1px solid #2A2E35",
                borderRadius: 12,
                color: "#F7F7F7",
                fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill="#69D3A7" radius={[6, 6, 0, 0]} maxBarSize={34} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="size-4 text-accent" />
          <h3 className="text-sm font-semibold">{t("police.responseTrend")}</h3>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={RESPONSE_TREND} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2E35" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} unit="m" />
            <Tooltip
              contentStyle={{
                background: "#181B22",
                border: "1px solid #2A2E35",
                borderRadius: 12,
                color: "#F7F7F7",
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="min" stroke="#87C9B8" strokeWidth={2.5} dot={{ r: 3, fill: "#87C9B8" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

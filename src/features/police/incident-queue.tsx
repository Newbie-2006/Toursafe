"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ClipboardList, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useData } from "@/features/data/data-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { formatRelativeTime } from "@/lib/utils";
import type { Priority } from "@/types";
import type { TranslationKey } from "@/lib/i18n";

const PRIORITY_VARIANT: Record<Priority, "default" | "warning" | "danger" | "success"> = {
  low: "default",
  medium: "warning",
  high: "danger",
  critical: "danger",
};

export function IncidentQueue() {
  const { t } = useI18n();
  const { incidents, officers, assignIncident, setIncidentStatus } = useData();
  const open = incidents.filter((i) => i.status !== "resolved");

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">{t("police.incidentQueue")}</h3>
        </div>
        <Badge variant="primary">{open.length}</Badge>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {open.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <ClipboardList className="size-6 text-muted-foreground/60" />
            {t("police.noIncidents")}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {open.map((inc) => (
              <motion.div
                key={inc.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-2xl border border-border/60 bg-background/40 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{inc.title}</p>
                      <Badge variant={PRIORITY_VARIANT[inc.priority]}>{t(`prio.${inc.priority}` as TranslationKey)}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`cat.${inc.category}` as TranslationKey)} · {formatRelativeTime(inc.createdAt)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-foreground/80">{inc.description}</p>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3" />
                      {inc.location.lat.toFixed(4)}, {inc.location.lng.toFixed(4)}
                    </p>
                  </div>
                  {inc.imageDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inc.imageDataUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Select
                    value={inc.assignedOfficerId ?? ""}
                    onChange={(e) => assignIncident(inc.id, e.target.value)}
                    className="h-9 flex-1 text-xs"
                  >
                    <option value="" disabled>
                      {t("police.assignOfficer")}
                    </option>
                    {officers
                      .filter((o) => o.status !== "off_duty")
                      .map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} · {o.badge}
                        </option>
                      ))}
                  </Select>
                  <Button size="sm" variant="success" onClick={() => setIncidentStatus(inc.id, "resolved")}>
                    <Check className="size-4" />
                    {t("police.resolve")}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

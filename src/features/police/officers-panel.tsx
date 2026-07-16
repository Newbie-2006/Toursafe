"use client";

import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/features/data/data-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { Officer } from "@/types";

const STATUS: Record<Officer["status"], { label: string; variant: "success" | "warning" | "default" }> = {
  available: { label: "Available", variant: "success" },
  on_call: { label: "On call", variant: "warning" },
  off_duty: { label: "Off duty", variant: "default" },
};

export function OfficersPanel() {
  const { t } = useI18n();
  const { officers } = useData();

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">{t("police.resources")}</h3>
      </div>
      <div className="space-y-2">
        {officers.map((o) => (
          <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-border/60 p-2.5">
            <Avatar name={o.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{o.name}</p>
              <p className="text-xs text-muted-foreground">
                {o.badge} · {o.zone}
              </p>
            </div>
            <Badge variant={STATUS[o.status].variant}>{STATUS[o.status].label}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

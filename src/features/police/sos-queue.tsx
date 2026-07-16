"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, MapPin, Radio, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/features/data/data-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { formatRelativeTime } from "@/lib/utils";

export function SosQueue() {
  const { t } = useI18n();
  const { sos, acknowledgeSos, resolveSos } = useData();
  const visible = sos.filter((s) => s.status !== "resolved");

  return (
    <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-card">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger/70" />
            <span className="relative inline-flex size-2.5 rounded-full bg-danger" />
          </span>
          <h3 className="text-sm font-semibold">{t("police.liveSos")}</h3>
        </div>
        <Badge variant="danger">{visible.filter((s) => s.status === "active").length}</Badge>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Radio className="size-6 text-muted-foreground/60" />
            {t("police.noSos")}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {visible.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="rounded-2xl border border-danger/30 bg-danger/5 p-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid size-8 place-items-center rounded-xl bg-danger/15">
                      <ShieldAlert className="size-4 text-danger" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{s.touristName}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.touristId} · {formatRelativeTime(s.createdAt)}
                      </p>
                      {s.message && <p className="mt-1 text-xs text-foreground/80">“{s.message}”</p>}
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="size-3" />
                        {s.location.lat.toFixed(4)}, {s.location.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={s.status === "active" ? "danger" : "warning"}>
                    {s.status === "active" ? t("common.active") : t("common.acknowledged")}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  {s.status === "active" && (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => acknowledgeSos(s.id)}>
                      {t("police.acknowledge")}
                    </Button>
                  )}
                  <Button size="sm" variant="success" className="flex-1" onClick={() => resolveSos(s.id)}>
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

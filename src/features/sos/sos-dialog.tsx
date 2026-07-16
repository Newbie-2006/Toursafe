"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ShieldAlert, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useData } from "@/features/data/data-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { useToast } from "@/components/ui/toast";
import { TOURIST_PROFILE } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

const HOLD_MS = 3000;

type Phase = "idle" | "holding" | "sending" | "sent";

export function SosDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { createSos, pushAlert } = useData();
  const { position } = useGeolocation();
  const { toast } = useToast();

  const [phase, setPhase] = React.useState<Phase>("idle");
  const [progress, setProgress] = React.useState(0);
  const [message, setMessage] = React.useState("");
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number>(0);

  const reset = React.useCallback(() => {
    setPhase("idle");
    setProgress(0);
    setMessage("");
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  const fire = React.useCallback(() => {
    setPhase("sending");
    setProgress(100);
    createSos({
      touristName: TOURIST_PROFILE.name,
      touristId: TOURIST_PROFILE.touristId,
      location: position,
      message: message.trim() || undefined,
    });
    pushAlert({
      level: "danger",
      title: "SOS sent",
      body: "Your emergency alert was shared with the command center.",
    });
    setTimeout(() => {
      setPhase("sent");
      toast({ variant: "success", title: t("sos.sent"), description: t("sos.sentBody") });
    }, 1200);
  }, [createSos, message, position, pushAlert, t, toast]);

  const startHold = React.useCallback(() => {
    if (phase !== "idle") return;
    setPhase("holding");
    startRef.current = performance.now();
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - startRef.current) / HOLD_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        fire();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [fire, phase]);

  const cancelHold = React.useCallback(() => {
    if (phase !== "holding") return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPhase("idle");
    setProgress(0);
  }, [phase]);

  return (
    <Modal open={open} onClose={onClose} showClose={phase === "idle"} className="max-w-md">
      <div className="flex flex-col items-center text-center">
        <AnimatePresence mode="wait">
          {phase === "sent" ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <div className="grid size-20 place-items-center rounded-full bg-success/15">
                <CheckCircle2 className="size-10 text-success" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{t("sos.sent")}</h2>
                <p className="max-w-xs text-sm text-muted-foreground">{t("sos.sentBody")}</p>
              </div>
              <Button variant="outline" onClick={onClose} className="mt-2">
                {t("common.close")}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full flex-col items-center gap-5"
            >
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">{t("sos.title")}</h2>
                <p className="max-w-xs text-sm text-muted-foreground">{t("sos.subtitle")}</p>
              </div>

              <HoldButton
                phase={phase}
                progress={progress}
                onStart={startHold}
                onCancel={cancelHold}
                labelIdle={t("sos.holdToActivate")}
                labelHolding={t("sos.holding")}
                labelSending={t("sos.sending")}
              />

              {phase === "idle" && (
                <div className="w-full space-y-2 text-left">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("sos.describe")}
                    className="min-h-[72px]"
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}

function HoldButton({
  phase,
  progress,
  onStart,
  onCancel,
  labelIdle,
  labelHolding,
  labelSending,
}: {
  phase: Phase;
  progress: number;
  onStart: () => void;
  onCancel: () => void;
  labelIdle: string;
  labelHolding: string;
  labelSending: string;
}) {
  const size = 176;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const busy = phase === "holding" || phase === "sending";

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {phase === "idle" && (
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-danger/30" />
      )}
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-danger/20" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (progress / 100) * c}
          className="stroke-danger"
          style={{ transition: phase === "sending" ? "stroke-dashoffset 0.3s ease" : "none" }}
        />
      </svg>
      <button
        type="button"
        disabled={phase === "sending"}
        onMouseDown={onStart}
        onMouseUp={onCancel}
        onMouseLeave={onCancel}
        onTouchStart={(e) => {
          e.preventDefault();
          onStart();
        }}
        onTouchEnd={onCancel}
        className={cn(
          "absolute inset-3 flex flex-col items-center justify-center gap-2 rounded-full text-danger-foreground transition-transform",
          "bg-danger shadow-soft-lg",
          busy ? "scale-[0.98]" : "hover:scale-[1.02] active:scale-95",
        )}
      >
        <ShieldAlert className="size-8" />
        <span className="px-4 text-center text-sm font-semibold leading-tight">
          {phase === "sending" ? labelSending : phase === "holding" ? labelHolding : labelIdle}
        </span>
      </button>
    </div>
  );
}

/** Standalone circular SOS trigger for the dashboard quick actions. */
export function SosTrigger({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useI18n();
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl bg-danger p-6 text-danger-foreground shadow-soft transition-all duration-200 hover:shadow-soft-lg hover:-translate-y-0.5",
        className,
      )}
    >
      <span className="absolute -right-6 -top-6 size-20 rounded-full bg-white/10" />
      <ShieldAlert className="size-7" />
      <span className="text-sm font-semibold">{t("dash.sos")}</span>
      <span className="text-[11px] opacity-80">{t("sos.holdToActivate")}</span>
    </button>
  );
}

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn, uid } from "@/lib/utils";

type ToastVariant = "success" | "info" | "warning" | "danger";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
};

const ACCENT: Record<ToastVariant, string> = {
  success: "text-success",
  info: "text-primary",
  warning: "text-warning",
  danger: "text-danger",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = uid("toast");
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
            <AnimatePresence>
              {toasts.map((t) => {
                const Icon = ICONS[t.variant];
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, x: 40, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40, scale: 0.96 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-soft-lg"
                  >
                    <Icon className={cn("mt-0.5 size-5 shrink-0", ACCENT[t.variant])} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{t.title}</p>
                      {t.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{t.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(t.id)}
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Dismiss"
                    >
                      <X className="size-4" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

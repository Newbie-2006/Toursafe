"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale, locales } = useI18n();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = locales.find((l) => l.code === locale);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select language"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-10 items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Globe className="size-[18px] text-muted-foreground" />
        <span className="hidden sm:inline">{current?.short}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-border/70 bg-card p-1.5 shadow-soft-lg"
          >
            {locales.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.code === locale}
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors",
                    l.code === locale ? "bg-primary/10 text-primary" : "hover:bg-muted",
                  )}
                >
                  <span>{l.name}</span>
                  {l.code === locale && <Check className="size-4" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CloudSun, LogOut, MapPin, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { Avatar } from "@/components/ui/avatar";
import { TOURIST_NAV } from "./nav-items";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useData } from "@/features/data/data-provider";
import { useAuth } from "@/features/auth/auth-provider";
import { useGeolocation } from "@/features/location/use-geolocation";
import { SosDialog } from "@/features/sos/sos-dialog";
import { PresenceReporter } from "@/features/presence/presence-reporter";
import { TOURIST_PROFILE, WEATHER } from "@/lib/demo-data";
import { formatRelativeTime, cn } from "@/lib/utils";

function greetingKey(): "nav.greetingMorning" | "nav.greetingAfternoon" | "nav.greetingEvening" {
  const h = new Date().getHours();
  if (h < 12) return "nav.greetingMorning";
  if (h < 18) return "nav.greetingAfternoon";
  return "nav.greetingEvening";
}

export function TouristShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const { signOut } = useAuth();
  const [sosOpen, setSosOpen] = React.useState(false);

  const handleSignOut = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border/60 bg-card/50 px-4 py-6 lg:flex">
        <Link href="/dashboard" className="px-2">
          <Logo />
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {TOURIST_NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-[18px]" />
                {t(item.labelKey)}
                {active && (
                  <motion.span
                    layoutId="tourist-nav-active"
                    className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldAlert className="size-4 text-danger" />
            {t("sos.title")}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("sos.subtitle")}</p>
          <button
            onClick={() => setSosOpen(true)}
            className="mt-3 w-full rounded-xl bg-danger py-2 text-sm font-semibold text-danger-foreground transition-transform hover:scale-[1.01] active:scale-95"
          >
            {t("dash.sos")}
          </button>
        </div>
        <button
          onClick={handleSignOut}
          className="mt-2 flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-[18px] " />
          {t("auth.signOut")}
        </button>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/90 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TOURIST_NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Floating SOS (mobile) */}
      <button
        onClick={() => setSosOpen(true)}
        aria-label={t("sos.title")}
        className="fixed bottom-20 right-4 z-30 grid size-14 place-items-center rounded-full bg-danger text-danger-foreground shadow-soft-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <ShieldAlert className="size-6" />
      </button>

      <SosDialog open={sosOpen} onClose={() => setSosOpen(false)} />
      <PresenceReporter />
    </div>
  );
}

function TopBar() {
  const { t } = useI18n();
  const { alerts } = useData();
  const { session } = useAuth();
  const { status } = useGeolocation();
  const [bellOpen, setBellOpen] = React.useState(false);
  const bellRef = React.useRef<HTMLDivElement>(null);
  const displayName = session?.name ?? TOURIST_PROFILE.name;

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="lg:hidden">
            <Logo showWordmark={false} compact />
          </Link>
          <div>
            <p className="text-sm font-semibold leading-tight">
              {t(greetingKey())}, {displayName.split(" ")[0]}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {status === "ready" ? "Live location" : TOURIST_PROFILE.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-2xl border border-border/70 bg-card px-3 py-2 text-sm sm:flex">
            <CloudSun className="size-4 text-warning" />
            <span className="font-medium">{WEATHER.tempC}°</span>
            <span className="text-muted-foreground">{WEATHER.condition}</span>
          </div>

          <div ref={bellRef} className="relative">
            <button
              onClick={() => setBellOpen((o) => !o)}
              aria-label="Notifications"
              className="relative grid size-10 place-items-center rounded-2xl border border-border/70 bg-card text-foreground transition-colors hover:bg-muted"
            >
              <Bell className="size-[18px]" />
              {alerts.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-semibold text-danger-foreground">
                  {alerts.length > 9 ? "9+" : alerts.length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/70 bg-card p-2 shadow-soft-lg"
                >
                  <p className="px-2 py-1.5 text-sm font-semibold">{t("dash.recentAlerts")}</p>
                  <div className="max-h-80 space-y-1 overflow-y-auto">
                    {alerts.length === 0 ? (
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("dash.noAlerts")}</p>
                    ) : (
                      alerts.slice(0, 8).map((a) => (
                        <div key={a.id} className="rounded-xl px-2 py-2 hover:bg-muted">
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.body}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                            {formatRelativeTime(a.createdAt)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <LanguageSelector />
          <ThemeToggle />
          <Link href="/profile" aria-label={t("nav.profile")}>
            <Avatar name={displayName} size={40} className="ring-2 ring-border" />
          </Link>
        </div>
      </div>
    </header>
  );
}

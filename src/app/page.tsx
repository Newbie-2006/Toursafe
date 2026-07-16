"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Fingerprint,
  MapPinned,
  Siren,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/language-selector";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { TranslationKey } from "@/lib/i18n";

const FEATURES: { icon: React.ElementType; titleKey: TranslationKey; bodyKey: TranslationKey }[] = [
  { icon: Siren, titleKey: "landing.feature1", bodyKey: "landing.feature1Body" },
  { icon: Bot, titleKey: "landing.feature2", bodyKey: "landing.feature2Body" },
  { icon: MapPinned, titleKey: "landing.feature3", bodyKey: "landing.feature3Body" },
  { icon: Fingerprint, titleKey: "landing.feature4", bodyKey: "landing.feature4Body" },
];

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute inset-0 bg-grid opacity-[0.35]" />
      </div>

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/login">{t("landing.getStarted")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="flex flex-col items-center pt-16 text-center sm:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-soft"
          >
            <ShieldCheck className="size-4 text-primary" />
            {t("common.tagline")}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl"
          >
            {t("landing.hero")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 max-w-xl text-balance text-lg text-muted-foreground"
          >
            {t("landing.sub")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg">
              <Link href="/login">
                {t("landing.getStarted")}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?role=police">{t("landing.openCommand")}</Link>
            </Button>
          </motion.div>
        </section>

        <section className="mt-20 grid gap-4 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.titleKey}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-3xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-primary/10">
                <f.icon className="size-6 text-primary" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{t(f.titleKey)}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{t(f.bodyKey)}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo compact />
          <p>© {new Date().getFullYear()} TourSafe · Built for System Siege</p>
        </div>
      </footer>
    </div>
  );
}

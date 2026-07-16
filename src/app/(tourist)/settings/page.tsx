"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  Bell,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  Globe,
  MapPinned,
  Monitor,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useConfig } from "@/features/config/config-provider";
import { usePreferences, type Preferences } from "@/features/settings/use-preferences";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { t, locale, setLocale, locales } = useI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("settings.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {/* Integrations */}
      <section className="space-y-3">
        <h2 className="eyebrow">{t("settings.integrations")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <IntegrationLink
            href="/settings/ai"
            icon={<Sparkles className="size-5 text-primary" />}
            title={t("settings.aiConfig")}
            subtitle="Google Gemini · BYOK"
          />
          <IntegrationLink
            href="/settings/maps"
            icon={<MapPinned className="size-5 text-primary" />}
            title={t("settings.mapsConfig")}
            subtitle="Google Maps Platform"
          />
        </div>
      </section>

      {/* Appearance */}
      <SettingsSection title={t("settings.appearance")}>
        <ThemeRow />
        <Divider />
        <div className="flex items-center justify-between gap-4 py-1">
          <div className="flex items-center gap-3">
            <RowIcon>
              <Globe className="size-[18px]" />
            </RowIcon>
            <div>
              <p className="text-sm font-medium">{t("settings.language")}</p>
              <p className="text-xs text-muted-foreground">{locales.find((l) => l.code === locale)?.name}</p>
            </div>
          </div>
          <Select
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
            className="w-44"
          >
            {locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </Select>
        </div>
      </SettingsSection>

      <NotificationsSection />
      <PrivacySection />
      <SupabaseSection />
    </div>
  );
}

function ThemeRow() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const options = [
    { id: "light", label: t("settings.themeLight"), icon: Sun },
    { id: "dark", label: t("settings.themeDark"), icon: Moon },
    { id: "system", label: t("settings.themeSystem"), icon: Monitor },
  ];
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="flex items-center gap-3">
        <RowIcon>
          <Sun className="size-[18px]" />
        </RowIcon>
        <p className="text-sm font-medium">{t("settings.theme")}</p>
      </div>
      <div className="inline-flex rounded-2xl bg-muted p-1">
        {options.map((o) => {
          const active = mounted && theme === o.id;
          return (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <o.icon className="size-4" />
              <span className="hidden sm:inline">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsSection() {
  const { t } = useI18n();
  const { prefs, toggle } = usePreferences();
  const items: { key: keyof Preferences; label: string; sub: string }[] = [
    { key: "notifPush", label: t("settings.notifications"), sub: "SOS & incident alerts" },
    { key: "notifWeather", label: t("dash.weather"), sub: "Weather advisories" },
    { key: "notifCrowd", label: t("police.crowdDensity"), sub: "Crowd surge warnings" },
  ];
  return (
    <SettingsSection title={t("settings.notifications")} icon={<Bell className="size-4" />}>
      {items.map((it, i) => (
        <React.Fragment key={it.key}>
          {i > 0 && <Divider />}
          <ToggleRow label={it.label} sub={it.sub} checked={prefs[it.key]} onChange={(v) => toggle(it.key, v)} />
        </React.Fragment>
      ))}
    </SettingsSection>
  );
}

function PrivacySection() {
  const { t } = useI18n();
  const { prefs, toggle } = usePreferences();
  return (
    <SettingsSection title={t("settings.privacy")} icon={<ShieldCheck className="size-4" />}>
      <ToggleRow
        label={t("settings.locationSharing")}
        sub="Share live location during emergencies"
        checked={prefs.shareLocation}
        onChange={(v) => toggle("shareLocation", v)}
      />
      <Divider />
      <ToggleRow
        label="Anonymize reports"
        sub="Hide your name on incident reports"
        checked={prefs.anonymizeReports}
        onChange={(v) => toggle("anonymizeReports", v)}
      />
      <Divider />
      <ToggleRow
        label="Auto-share Digital ID"
        sub="Send ID to responders when SOS is triggered"
        checked={prefs.autoShareId}
        onChange={(v) => toggle("autoShareId", v)}
      />
    </SettingsSection>
  );
}

function SupabaseSection() {
  const { t } = useI18n();
  const { config, update, supabaseReady } = useConfig();
  const { toast } = useToast();
  const [url, setUrl] = React.useState("");
  const [anon, setAnon] = React.useState("");
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setUrl(config.supabase.url);
    setAnon(config.supabase.anonKey);
  }, [config.supabase.url, config.supabase.anonKey]);

  const onSave = () => {
    update({ supabase: { url: url.trim(), anonKey: anon.trim() } });
    toast({ variant: "success", title: t("common.saved"), description: t("settings.keyStored") });
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <RowIcon>
            <Database className="size-[18px]" />
          </RowIcon>
          <div>
            <p className="text-sm font-semibold">{t("settings.supabaseConfig")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.supabaseNote")}</p>
          </div>
        </div>
        <Badge variant={supabaseReady ? "success" : "default"}>
          {supabaseReady ? t("common.connected") : t("common.demoMode")}
        </Badge>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sbUrl">{t("settings.supabaseUrl")}</Label>
          <Input
            id="sbUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            autoComplete="off"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sbAnon">{t("settings.supabaseAnon")}</Label>
          <div className="relative">
            <Input
              id="sbAnon"
              type={show ? "text" : "password"}
              value={anon}
              onChange={(e) => setAnon(e.target.value)}
              placeholder="eyJhbGci…"
              autoComplete="off"
              className="pr-11 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={show ? t("settings.hide") : t("settings.show")}
            >
              {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
        </div>
        <Button onClick={onSave} disabled={!url.trim() || !anon.trim()}>
          {t("settings.saveKey")}
        </Button>
      </div>
    </Card>
  );
}

/* ---------- primitives ---------- */

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h2>
      <div className="space-y-1">{children}</div>
    </Card>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function RowIcon({ children }: { children: React.ReactNode }) {
  return <span className="grid size-9 place-items-center rounded-xl bg-muted text-muted-foreground">{children}</span>;
}

function Divider() {
  return <div className="h-px bg-border/60" />;
}

function IntegrationLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft-lg"
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-primary/10">{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

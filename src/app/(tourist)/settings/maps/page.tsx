"use client";

import * as React from "react";
import { CheckCircle2, Eye, EyeOff, Lock, MapPinned, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SettingsHeader } from "@/components/settings/settings-header";
import { SafetyMap } from "@/features/map/safety-map";
import { useConfig } from "@/features/config/config-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { maskKey } from "@/lib/config";

export default function MapsConfigPage() {
  const { t } = useI18n();
  const { config, update, mapsReady } = useConfig();
  const { toast } = useToast();

  const [apiKey, setApiKey] = React.useState("");
  const [placesKey, setPlacesKey] = React.useState("");
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    setApiKey(config.maps.apiKey);
    setPlacesKey(config.maps.placesApiKey);
  }, [config.maps.apiKey, config.maps.placesApiKey]);

  const onSave = () => {
    update({ maps: { apiKey: apiKey.trim(), placesApiKey: placesKey.trim() || apiKey.trim() } });
    toast({ variant: "success", title: t("common.saved"), description: t("settings.keyStored") });
  };

  const onRemove = () => {
    update({ maps: { apiKey: "", placesApiKey: "" } });
    setApiKey("");
    setPlacesKey("");
    toast({ variant: "info", title: t("settings.keyRemoved") });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsHeader title={t("settings.mapsConfig")} description={t("dash.liveMap")} />

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/10">
              <MapPinned className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Google Maps Platform</p>
              <p className="text-sm text-muted-foreground">Maps JavaScript API + Places API</p>
            </div>
          </div>
          <Badge variant={mapsReady ? "success" : "default"}>
            {mapsReady ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            {mapsReady ? t("common.connected") : t("common.disconnected")}
          </Badge>
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="mapsKey">{t("settings.mapsKey")}</Label>
            <div className="relative">
              <Input
                id="mapsKey"
                type={show ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy…"
                autoComplete="off"
                className="pr-11 font-mono"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? t("settings.hide") : t("settings.show")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
              </button>
            </div>
            {config.maps.apiKey && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" /> Stored: <span className="font-mono">{maskKey(config.maps.apiKey)}</span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="placesKey">
              {t("settings.placesKey")} <span className="text-muted-foreground">({t("common.optional")})</span>
            </Label>
            <Input
              id="placesKey"
              type={show ? "text" : "password"}
              value={placesKey}
              onChange={(e) => setPlacesKey(e.target.value)}
              placeholder="Defaults to the Maps key"
              autoComplete="off"
              className="font-mono"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={!apiKey.trim()}>
              {t("settings.saveKey")}
            </Button>
            {config.maps.apiKey && (
              <Button variant="ghost" onClick={onRemove}>
                {t("settings.removeKey")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        <p className="eyebrow">Live preview</p>
        <SafetyMap height={280} />
      </div>

      <Card className="p-5">
        <h3 className="text-sm font-semibold">How to get a Google Maps API key</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Open{" "}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Google Cloud Console → Maps
            </a>
          </li>
          <li>Create a project and enable “Maps JavaScript API” and “Places API”.</li>
          <li>Create an API key under Credentials and paste it above.</li>
          <li>Save — the map reloads automatically.</li>
        </ol>
      </Card>
    </div>
  );
}

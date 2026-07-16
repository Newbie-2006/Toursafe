"use client";

import * as React from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useConfig } from "@/features/config/config-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { useToast } from "@/components/ui/toast";
import { GEMINI_MODELS, maskKey } from "@/lib/config";
import { cn } from "@/lib/utils";

type Status = "idle" | "testing" | "connected" | "disconnected" | "invalid";

export default function AiConfigPage() {
  const { t } = useI18n();
  const { config, update } = useConfig();
  const { toast } = useToast();

  const [apiKey, setApiKey] = React.useState("");
  const [model, setModel] = React.useState(config.gemini.model);
  const [show, setShow] = React.useState(false);
  const [status, setStatus] = React.useState<Status>("idle");

  React.useEffect(() => {
    setApiKey(config.gemini.apiKey);
    setModel(config.gemini.model);
    setStatus(config.gemini.apiKey ? "idle" : "disconnected");
  }, [config.gemini.apiKey, config.gemini.model]);

  const onSave = () => {
    update({ gemini: { apiKey: apiKey.trim(), model } });
    toast({ variant: "success", title: t("common.saved"), description: t("settings.keyStored") });
  };

  const onRemove = () => {
    update({ gemini: { apiKey: "", model } });
    setApiKey("");
    setStatus("disconnected");
    toast({ variant: "info", title: t("settings.keyRemoved") });
  };

  const onTest = async () => {
    if (!apiKey.trim()) {
      setStatus("disconnected");
      return;
    }
    setStatus("testing");
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim(), model }),
      });
      const data = (await res.json()) as { ok: boolean; status: Status; error?: string };
      setStatus(data.ok ? "connected" : data.status === "invalid" ? "invalid" : "disconnected");
      toast({
        variant: data.ok ? "success" : "danger",
        title: data.ok ? t("common.connected") : t("common.disconnected"),
        description: data.error,
      });
    } catch {
      setStatus("disconnected");
      toast({ variant: "danger", title: t("common.disconnected") });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SettingsHeader title={t("settings.aiConfig")} description={t("ai.subtitle")} />

      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{t("settings.provider")}: Google Gemini</p>
              <p className="text-sm text-muted-foreground">Bring Your Own API Key (BYOK)</p>
            </div>
          </div>
          <StatusIndicator status={status} label={statusLabel(status, t)} />
        </div>

        <div className="mt-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="model">{t("settings.model")}</Label>
            <Select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="apiKey">{t("settings.apiKey")}</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={show ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setStatus("idle");
                }}
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
            {config.gemini.apiKey && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" />
                Stored key: <span className="font-mono">{maskKey(config.gemini.apiKey)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={onSave} disabled={!apiKey.trim()}>
              <KeyRound className="size-4" />
              {t("settings.saveKey")}
            </Button>
            <Button variant="outline" onClick={onTest} disabled={status === "testing" || !apiKey.trim()}>
              {status === "testing" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {status === "testing" ? t("settings.testing") : t("settings.testConnection")}
            </Button>
            {config.gemini.apiKey && (
              <Button variant="ghost" onClick={onRemove}>
                {t("settings.removeKey")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="flex items-start gap-3 border-primary/20 bg-primary/5 p-5">
        <Lock className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm text-muted-foreground">{t("settings.byokNote")}</p>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold">How to get a Gemini API key</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>
            Go to{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary hover:underline"
            >
              aistudio.google.com/app/apikey
            </a>
          </li>
          <li>Sign in and click “Create API key”.</li>
          <li>Copy the key (starts with <span className="font-mono">AIzaSy…</span>) and paste it above.</li>
          <li>Click Save, then Test Connection.</li>
        </ol>
      </Card>
    </div>
  );
}

function statusLabel(status: Status, t: ReturnType<typeof useI18n>["t"]): string {
  switch (status) {
    case "connected":
      return t("common.connected");
    case "invalid":
      return t("common.invalid");
    case "testing":
      return t("settings.testing");
    default:
      return t("common.disconnected");
  }
}

function StatusIndicator({ status, label }: { status: Status; label: string }) {
  const map = {
    connected: { variant: "success" as const, icon: CheckCircle2 },
    invalid: { variant: "danger" as const, icon: XCircle },
    testing: { variant: "warning" as const, icon: Loader2 },
    disconnected: { variant: "default" as const, icon: XCircle },
    idle: { variant: "default" as const, icon: KeyRound },
  };
  const conf = map[status];
  const Icon = conf.icon;
  return (
    <Badge variant={conf.variant} className="shrink-0">
      <Icon className={cn("size-3.5", status === "testing" && "animate-spin")} />
      {label}
    </Badge>
  );
}

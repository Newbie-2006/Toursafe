"use client";

import * as React from "react";
import Link from "next/link";
import { Languages, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useConfig } from "@/features/config/config-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { LOCALE_LANGUAGE_NAME, LOCALES, type Locale } from "@/lib/i18n";

export function TranslationCenter() {
  const { t } = useI18n();
  const { config, geminiReady } = useConfig();
  const [text, setText] = React.useState("");
  const [target, setTarget] = React.useState<Locale>("hi");
  const [output, setOutput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const translate = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setOutput("");
    setError(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: config.gemini.apiKey,
          model: config.gemini.model,
          languageName: LOCALE_LANGUAGE_NAME[target],
          messages: [
            {
              role: "user",
              content: `Translate the following text into ${LOCALE_LANGUAGE_NAME[target]}. Return only the translation with no extra commentary:\n\n"${text.trim()}"`,
            },
          ],
        }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || "Translation failed.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setOutput(acc);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Translation failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Languages className="size-4 text-accent" />
        <h3 className="text-sm font-semibold">{t("police.translationCenter")}</h3>
      </div>

      {!geminiReady ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-muted-foreground">{t("ai.notConfiguredBody")}</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/settings/ai">{t("ai.configure")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text to translate for a tourist…"
            className="min-h-[72px]"
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Target</Label>
              <Select value={target} onChange={(e) => setTarget(e.target.value as Locale)} className="h-9 text-sm">
                {LOCALES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button size="sm" onClick={translate} disabled={busy || !text.trim()} className="mt-5">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {t("dash.translate")}
            </Button>
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
          {output && (
            <div className="rounded-2xl border border-border/60 bg-background/40 p-3 text-sm">{output}</div>
          )}
        </div>
      )}
    </div>
  );
}

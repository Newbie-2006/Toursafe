"use client";

import { Bot } from "lucide-react";
import { AiAssistant } from "@/features/ai/ai-assistant";
import { useI18n } from "@/features/i18n/i18n-provider";

export default function AssistantPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary/10">
          <Bot className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("ai.title")}</h1>
          <p className="text-muted-foreground">{t("ai.subtitle")}</p>
        </div>
      </div>
      <AiAssistant height="min(72vh, 720px)" />
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles, Square, Trash2, User, KeyRound } from "lucide-react";
import { useGemini } from "./use-gemini";
import { useI18n } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

interface AiAssistantProps {
  className?: string;
  height?: number | string;
  compact?: boolean;
}

const SUGGESTION_KEYS: TranslationKey[] = [
  "ai.suggest1",
  "ai.suggest2",
  "ai.suggest3",
  "ai.suggest4",
];

export function AiAssistant({ className, height = 520, compact = false }: AiAssistantProps) {
  const { t } = useI18n();
  const { messages, send, stop, reset, isStreaming, error, geminiReady } = useGemini();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput("");
  };

  if (!geminiReady) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-5 rounded-3xl border border-border/70 bg-card p-8 text-center",
          className,
        )}
        style={{ height }}
      >
        <div className="grid size-16 place-items-center rounded-3xl bg-primary/10">
          <KeyRound className="size-8 text-primary" />
        </div>
        <div className="max-w-sm space-y-1.5">
          <h3 className="text-lg font-semibold">{t("ai.notConfigured")}</h3>
          <p className="text-sm text-muted-foreground">{t("ai.notConfiguredBody")}</p>
        </div>
        <Button asChild>
          <Link href="/settings/ai">
            <Sparkles className="size-4" />
            {t("ai.configure")}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col overflow-hidden rounded-3xl border border-border/70 bg-card", className)}
      style={{ height }}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-2xl bg-primary/10">
            <Bot className="size-[18px] text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{t("ai.title")}</p>
            <p className="text-xs text-muted-foreground">{t("ai.subtitle")}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon-sm" onClick={reset} aria-label={t("ai.clear")}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10">
              <Sparkles className="size-6 text-primary" />
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">{t("ai.welcome")}</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}
            >
              <div
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-xl",
                  m.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary/10 text-primary",
                )}
              >
                {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
              </div>
              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {m.content || (
                  <span className="inline-flex gap-1 py-1">
                    <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {error && (
          <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm text-danger">
            {error}
          </div>
        )}
      </div>

      {messages.length === 0 && !compact && (
        <div className="flex flex-wrap gap-2 px-5 pb-3">
          {SUGGESTION_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => send(t(key))}
              className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {t(key)}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border/60 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("ai.placeholder")}
          className="h-11 flex-1 rounded-2xl bg-muted px-4 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {isStreaming ? (
          <Button type="button" variant="subtle" size="icon" onClick={stop} aria-label="Stop">
            <Square className="size-4" />
          </Button>
        ) : (
          <Button type="submit" size="icon" disabled={!input.trim()} aria-label={t("ai.send")}>
            <Send className="size-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <motion.span
      className="inline-block size-1.5 rounded-full bg-muted-foreground"
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1, repeat: Infinity, delay }}
    />
  );
}

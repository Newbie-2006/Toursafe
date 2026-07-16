"use client";

import { useCallback, useRef, useState } from "react";
import { useConfig } from "@/features/config/config-provider";
import { useI18n } from "@/features/i18n/i18n-provider";
import { LOCALE_LANGUAGE_NAME } from "@/lib/i18n";
import type { ChatMessage } from "@/types";
import { uid } from "@/lib/utils";
import type { GeminiTurn } from "@/lib/gemini";

interface UseGeminiOptions {
  initialMessages?: ChatMessage[];
}

export function useGemini({ initialMessages = [] }: UseGeminiOptions = {}) {
  const { config, geminiReady } = useConfig();
  const { locale } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;
      setError(null);

      const userMsg: ChatMessage = {
        id: uid("m"),
        role: "user",
        content,
        createdAt: Date.now(),
      };
      const assistantId = uid("m");
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
      };

      const history: GeminiTurn[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            apiKey: config.gemini.apiKey,
            model: config.gemini.model,
            languageName: LOCALE_LANGUAGE_NAME[locale],
            messages: history,
          }),
        });

        if (!res.ok || !res.body) {
          let msg = "The assistant ran into a problem. Please try again.";
          try {
            const j = await res.json();
            if (j?.error) msg = j.error;
          } catch {
            /* ignore */
          }
          throw new Error(msg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
          );
        }

        if (!acc.trim()) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "I couldn't generate a response. Please try again." }
                : m,
            ),
          );
        }
      } catch (e) {
        const msg =
          e instanceof Error && e.name !== "AbortError"
            ? e.message
            : "The assistant ran into a problem. Please try again.";
        if (!(e instanceof Error) || e.name !== "AbortError") {
          setError(msg);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [config.gemini.apiKey, config.gemini.model, isStreaming, locale, messages],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, send, stop, reset, isStreaming, error, geminiReady };
}

import { NextRequest } from "next/server";
import {
  buildSystemPrompt,
  extractText,
  GEMINI_BASE,
  toGeminiContents,
  type GeminiRequestBody,
} from "@/lib/gemini";
import { DEFAULT_MODEL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  let body: GeminiRequestBody;
  try {
    body = (await req.json()) as GeminiRequestBody;
  } catch {
    return errorResponse("Invalid request body.");
  }

  const apiKey = (body.apiKey || process.env.GEMINI_API_KEY || "").trim();
  const model = (body.model || DEFAULT_MODEL).trim();
  const languageName = body.languageName || "English";
  const messages = Array.isArray(body.messages) ? body.messages : [];

  if (!apiKey) {
    return errorResponse(
      "No Gemini API key configured. Add your key in Settings → AI Configuration.",
      401,
    );
  }
  if (messages.length === 0) {
    return errorResponse("No messages provided.");
  }

  const requestBody = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(languageName) }] },
    contents: toGeminiContents(messages),
    generationConfig: { temperature: 0.7, maxOutputTokens: 1200, topP: 0.95 },
    safetySettings: [],
  };

  let upstream: Response;
  try {
    upstream = await fetch(
      `${GEMINI_BASE}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(requestBody),
      },
    );
  } catch {
    return errorResponse("Could not reach the Gemini service. Check your connection.", 502);
  }

  if (!upstream.ok || !upstream.body) {
    let detail = "";
    try {
      const errJson = await upstream.json();
      detail = extractError(errJson);
    } catch {
      /* ignore */
    }
    const status = upstream.status === 400 || upstream.status === 403 ? 401 : 502;
    return errorResponse(
      detail || `Gemini request failed (${upstream.status}).`,
      status,
    );
  }

  // Transform Google's SSE stream into a plain-text token stream for the client.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const text = extractText(json);
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              /* partial JSON — ignore, will resolve on next chunk */
            }
          }
        }
      } catch {
        controller.enqueue(encoder.encode(""));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}

function extractError(payload: unknown): string {
  try {
    const msg = (payload as { error?: { message?: string } })?.error?.message;
    if (!msg) return "";
    if (/API key not valid/i.test(msg)) return "Invalid API key.";
    return msg;
  } catch {
    return "";
  }
}

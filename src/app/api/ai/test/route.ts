import { NextRequest } from "next/server";
import { extractErrorMessage, extractText, friendlyGeminiError, GEMINI_BASE } from "@/lib/gemini";
import { DEFAULT_MODEL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Validates a Gemini API key + model with a tiny prompt.
 * Returns { ok, status, sample?, error? }.
 */
export async function POST(req: NextRequest) {
  let body: { apiKey?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, status: "invalid", error: "Invalid request." }, 400);
  }

  const apiKey = (body.apiKey || "").trim();
  const model = (body.model || DEFAULT_MODEL).trim();

  if (!apiKey) {
    return json({ ok: false, status: "disconnected", error: "No key provided." }, 200);
  }

  try {
    const res = await fetch(
      `${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "Reply with the single word: OK" }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0 },
        }),
      },
    );

    if (res.ok) {
      const payload = await res.json();
      return json({ ok: true, status: "connected", sample: extractText(payload) || "OK" }, 200);
    }

    let raw = "";
    try {
      raw = extractErrorMessage(await res.json());
    } catch {
      /* ignore */
    }
    const message = friendlyGeminiError(res.status, raw);
    const invalid =
      res.status === 401 ||
      res.status === 403 ||
      /API key not valid|API_KEY_INVALID|permission/i.test(raw);
    return json(
      { ok: false, status: invalid ? "invalid" : "disconnected", error: message },
      200,
    );
  } catch {
    return json(
      { ok: false, status: "disconnected", error: "Could not reach Gemini." },
      200,
    );
  }
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

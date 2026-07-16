import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIST_URL = "https://generativelanguage.googleapis.com/v1beta/models";

interface RawModel {
  name?: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

/**
 * Lists the caller's currently-supported Gemini text models (those that support
 * `generateContent`) so the Settings dropdown can populate dynamically instead
 * of relying on a hardcoded list that can go stale.
 */
export async function POST(req: NextRequest) {
  let body: { apiKey?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid request." }, 400);
  }

  const apiKey = (body.apiKey || process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return json({ ok: false, error: "No key provided." }, 200);

  let res: Response;
  try {
    res = await fetch(`${LIST_URL}?key=${encodeURIComponent(apiKey)}`, { method: "GET" });
  } catch {
    return json({ ok: false, error: "Could not reach Gemini." }, 200);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const e = (await res.json()) as { error?: { message?: string } };
      if (e?.error?.message) message = e.error.message;
    } catch {
      /* ignore */
    }
    return json({ ok: false, error: message }, 200);
  }

  try {
    const data = (await res.json()) as { models?: RawModel[] };
    const models = (data.models ?? [])
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({
        id: String(m.name ?? "").replace(/^models\//, ""),
        label: m.displayName || String(m.name ?? "").replace(/^models\//, ""),
      }))
      .filter((m) => /gemini/i.test(m.id) && !/embedding|aqa|imagen/i.test(m.id))
      // Newest/flagship first: 2.5 → 2.0 → 1.5, flash before pro within a tier.
      .sort((a, b) => rank(a.id) - rank(b.id));

    return json({ ok: true, models }, 200);
  } catch {
    return json({ ok: false, error: "Unexpected response from Gemini." }, 200);
  }
}

function rank(id: string): number {
  let score = 0;
  const version = id.match(/gemini-(\d+\.?\d*)/)?.[1];
  if (version) score -= parseFloat(version) * 10; // higher version → earlier
  if (/flash/i.test(id)) score -= 2;
  if (/-lite/i.test(id)) score += 1;
  if (/pro/i.test(id)) score -= 1;
  if (/exp|preview/i.test(id)) score += 5; // de-prioritise experimental
  return score;
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

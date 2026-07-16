/**
 * Shared Gemini helpers used by the API routes.
 *
 * The actual network call happens server-side (in /api/ai/*) so the key is
 * forwarded straight to Google and never embedded in a client bundle. The key
 * itself is supplied by the browser (BYOK) with each request.
 */

export interface GeminiTurn {
  role: "user" | "assistant";
  content: string;
}

export const GEMINI_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export function buildSystemPrompt(languageName: string): string {
  return [
    "You are TourSafe Assistant, a calm, trustworthy travel-safety companion for tourists.",
    "Your job: help travelers stay safe. You handle travel guidance, translation,",
    "emergency instructions, basic medical guidance (first-aid level, never a diagnosis),",
    "finding nearby help (police, hospitals, embassies), lost passport steps, embassy guidance,",
    "crowd and weather safety, and general safety recommendations.",
    "",
    "Rules:",
    `- ALWAYS reply in ${languageName}. If the user writes in another language, still answer in ${languageName} unless they explicitly ask for a translation.`,
    "- Be concise and clear. Prefer short paragraphs or tight bullet lists. Lead with the most important action.",
    "- In emergencies, give calm step-by-step instructions first. Remind them to call local emergency services (112 works in India, the EU and many countries; 911 in the US) if life is at risk.",
    "- Never invent specific phone numbers, addresses, or facts you are unsure about. Say what to look for instead.",
    "- For medical questions, give safe first-aid guidance and always advise professional care for anything serious.",
    "- Be warm and reassuring, never alarming.",
  ].join("\n");
}

export function toGeminiContents(messages: GeminiTurn[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

export interface GeminiRequestBody {
  apiKey?: string;
  model?: string;
  messages: GeminiTurn[];
  languageName?: string;
}

/** Extract readable text from a full (non-streamed) Gemini response payload. */
export function extractText(payload: unknown): string {
  try {
    const candidates = (payload as { candidates?: unknown[] })?.candidates;
    const first = candidates?.[0] as
      | { content?: { parts?: { text?: string }[] } }
      | undefined;
    return (first?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("")
      .trim();
  } catch {
    return "";
  }
}

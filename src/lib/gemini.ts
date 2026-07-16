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

/** Pull the raw error message out of a Gemini error payload. */
export function extractErrorMessage(payload: unknown): string {
  try {
    return (payload as { error?: { message?: string } })?.error?.message ?? "";
  } catch {
    return "";
  }
}

/**
 * Map an upstream Gemini HTTP status + message to a clear, user-facing string
 * that covers the failure modes the UI must handle gracefully: invalid/expired
 * key, no access, rate limit, a removed/unsupported model, and provider errors.
 */
export function friendlyGeminiError(status: number, rawMessage = ""): string {
  const msg = rawMessage.trim();
  if (/API key not valid|API_KEY_INVALID/i.test(msg)) {
    return "Invalid API key. Check your Gemini key in Settings → AI Configuration.";
  }
  if (status === 401 || status === 403 || /permission|PERMISSION_DENIED/i.test(msg)) {
    return "Your API key was rejected (invalid, expired, or missing access). Update it in Settings.";
  }
  if (status === 429 || /quota|rate limit|RESOURCE_EXHAUSTED/i.test(msg)) {
    return "Gemini rate limit reached. Please wait a moment and try again.";
  }
  if (status === 404 || /is not found|not supported|not found for API/i.test(msg)) {
    return "That model is no longer available for your key. Pick a different model in Settings.";
  }
  if (status >= 500) {
    return "Gemini is having trouble right now. Please try again shortly.";
  }
  return msg || `Gemini request failed (${status}).`;
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

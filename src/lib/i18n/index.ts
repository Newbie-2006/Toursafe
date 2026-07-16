import { en, type TranslationKey } from "./en";
import { hi } from "./hi";
import { ta } from "./ta";
import { te } from "./te";
import { kn } from "./kn";

export type Locale = "en" | "hi" | "ta" | "te" | "kn";

export const LOCALES: { code: Locale; name: string; short: string }[] = [
  { code: "en", name: "English", short: "EN" },
  { code: "hi", name: "Hindi (हिन्दी)", short: "हि" },
  { code: "ta", name: "Tamil (தமிழ்)", short: "த" },
  { code: "te", name: "Telugu (తెలుగు)", short: "తె" },
  { code: "kn", name: "Kannada (ಕನ್ನಡ)", short: "ಕ" },
];

// Full name used for the Gemini system prompt so replies match the UI language.
export const LOCALE_LANGUAGE_NAME: Record<Locale, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  kn: "Kannada",
};

const DICTS: Record<Locale, Partial<Record<TranslationKey, string>>> = {
  en,
  hi,
  ta,
  te,
  kn,
};

export function translate(locale: Locale, key: TranslationKey): string {
  return DICTS[locale][key] ?? en[key] ?? key;
}

export type { TranslationKey };

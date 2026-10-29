/**
 * Languages the lessons are available in.
 *
 * Codes follow BCP 47 (the standard browsers and the HTML `lang` attribute use):
 * "en-US" is US English, "es-US" is US Spanish. To add a language, translate the lesson
 * text files and add an entry here – see docs/translating.md. The language picker in
 * Settings appears automatically once there is more than one entry.
 */
export interface Locale {
  /** BCP 47 code, also the folder name under each lesson's content folder. */
  code: string;
  /** The language's name in that language, as shown in the picker. */
  name: string;
}

export const DEFAULT_LOCALE = 'en-US';

/**
 * The language of the interface: buttons, messages and the checker's explanations. Only
 * English so far (docs/translating.md). It is the page's `lang`; lesson text in another
 * language is marked with its own `lang`, so screen readers switch voice just for it.
 */
export const INTERFACE_LOCALE = 'en-US';

export const LOCALES: Locale[] = [
  { code: 'en-US', name: 'English (US)' },
  // { code: 'es-US', name: 'Español (EE. UU.)' },  ← add once the lessons are translated
];

/**
 * The best supported locale for a requested one: an exact match ("es-US"), then the same
 * language ("es" or "es-MX" → "es-US"), then the default.
 */
export function resolveLocale(
  requested: string | null | undefined,
  available: readonly Locale[] = LOCALES,
): string {
  if (!requested) return DEFAULT_LOCALE;
  const exact = available.find((l) => l.code.toLowerCase() === requested.toLowerCase());
  if (exact) return exact.code;
  const language = requested.split(/[-_]/)[0].toLowerCase();
  const sameLanguage = available.find((l) => l.code.split('-')[0].toLowerCase() === language);
  return sameLanguage?.code ?? DEFAULT_LOCALE;
}

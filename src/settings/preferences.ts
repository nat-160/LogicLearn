/**
 * Display, reading and narration preferences, saved in this browser.
 *
 * Until a student changes a setting, it follows the device: "increase contrast" turns on
 * high contrast and a dark system theme turns on dark mode. `null` means "follow the
 * device". Once the student picks a value it is remembered and wins.
 *
 * Saved data is untrusted (it can be edited or corrupted), so it is checked field by
 * field when loaded. Like everything else in LogicLearn, it never leaves the device.
 */
import { create } from 'zustand';
import { readLocal, storageKey, writeLocal } from '../storage/storage';

export interface Preferences {
  /** High-contrast theme; null = follow the device ("prefers-contrast: more"). */
  contrast: 'standard' | 'high' | null;
  /** Dark mode; null = follow the device ("prefers-color-scheme"). */
  colorScheme: 'light' | 'dark' | null;
  /** Dyslexia-friendly font and spacing. */
  dyslexiaFont: boolean;
  /** Read each lesson step aloud when it opens. */
  autoRead: boolean;
  /** Speech speed, 0.5 (slow) to 2 (fast). */
  speechRate: number;
  /** Chosen voice (SpeechSynthesisVoice.voiceURI); null = pick an on-device voice. */
  voiceURI: string | null;
  /** Lesson language (BCP 47); null = the browser's language, if available. */
  locale: string | null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  contrast: null,
  colorScheme: null,
  dyslexiaFont: false,
  autoRead: false,
  speechRate: 1,
  voiceURI: null,
  locale: null,
};

export const PREFERENCES_KEY = storageKey('prefs:v1');

/** Keep only valid values from saved data; anything else falls back to the default. */
export function sanitizePreferences(raw: unknown): Preferences {
  const p = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const oneOf = <T>(value: unknown, options: readonly T[], fallback: T): T =>
    options.includes(value as T) ? (value as T) : fallback;
  const rate = typeof p.speechRate === 'number' && Number.isFinite(p.speechRate) ? p.speechRate : 1;
  const shortText = (v: unknown) => (typeof v === 'string' && v.length <= 200 ? v : null);
  return {
    contrast: oneOf(p.contrast, ['standard', 'high', null] as const, null),
    colorScheme: oneOf(p.colorScheme, ['light', 'dark', null] as const, null),
    dyslexiaFont: p.dyslexiaFont === true,
    autoRead: p.autoRead === true,
    speechRate: Math.min(2, Math.max(0.5, rate)),
    voiceURI: shortText(p.voiceURI),
    locale: shortText(p.locale),
  };
}

function load(): Preferences {
  try {
    return sanitizePreferences(JSON.parse(readLocal(PREFERENCES_KEY) ?? '{}'));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

interface PreferencesState extends Preferences {
  /** Change some preferences; they are saved immediately. */
  update(change: Partial<Preferences>): void;
  /** Forget every saved choice and follow the device again. */
  reset(): void;
}

export const usePreferences = create<PreferencesState>()((set, get) => {
  // sanitizePreferences keeps only the preference fields (not the functions).
  const save = () => writeLocal(PREFERENCES_KEY, JSON.stringify(sanitizePreferences(get())));

  // Keep every open tab in step.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === PREFERENCES_KEY) set(load());
    });
  }

  return {
    ...load(),
    update(change) {
      set(sanitizePreferences({ ...get(), ...change }));
      save();
    },
    reset() {
      set({ ...DEFAULT_PREFERENCES });
      save();
    },
  };
});

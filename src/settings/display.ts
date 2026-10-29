/**
 * Turning preferences into what the page actually shows.
 *
 * The result is written as attributes on <html> – data-theme, data-contrast, data-font
 * and lang – and the stylesheet does the rest (see the theme blocks in themes.css). It runs
 * once before the first render and again whenever a preference or a device setting
 * changes. (A small script in index.html sets the theme even earlier, before the app has
 * downloaded, so the page never flashes the wrong theme.)
 */
import { useSyncExternalStore } from 'react';
import { INTERFACE_LOCALE, resolveLocale } from '../i18n/locales';
import { usePreferences, type Preferences } from './preferences';

export interface DeviceSettings {
  prefersHighContrast: boolean;
  prefersDark: boolean;
  /** The browser's preferred language, e.g. "en-US". */
  language: string;
}

export interface Display {
  theme: 'light' | 'dark';
  contrast: 'standard' | 'high';
  font: 'default' | 'dyslexic';
  locale: string;
}

export function effectiveDisplay(prefs: Preferences, device: DeviceSettings): Display {
  return {
    theme: prefs.colorScheme ?? (device.prefersDark ? 'dark' : 'light'),
    contrast: prefs.contrast ?? (device.prefersHighContrast ? 'high' : 'standard'),
    font: prefs.dyslexiaFont ? 'dyslexic' : 'default',
    locale: resolveLocale(prefs.locale ?? device.language),
  };
}

const CONTRAST_QUERY = '(prefers-contrast: more)';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function query(q: string): MediaQueryList | null {
  return typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(q) : null;
}

let deviceCache: DeviceSettings | null = null;

export function readDeviceSettings(): DeviceSettings {
  const next: DeviceSettings = {
    prefersHighContrast: query(CONTRAST_QUERY)?.matches ?? false,
    prefersDark: query(DARK_QUERY)?.matches ?? false,
    language: typeof navigator !== 'undefined' ? navigator.language : 'en-US',
  };
  // Return the same object while nothing changed (required by useSyncExternalStore).
  if (
    deviceCache &&
    deviceCache.prefersHighContrast === next.prefersHighContrast &&
    deviceCache.prefersDark === next.prefersDark &&
    deviceCache.language === next.language
  ) {
    return deviceCache;
  }
  deviceCache = next;
  return next;
}

function subscribeToDevice(onChange: () => void): () => void {
  const lists = [query(CONTRAST_QUERY), query(DARK_QUERY)].filter(Boolean) as MediaQueryList[];
  lists.forEach((l) => l.addEventListener('change', onChange));
  window.addEventListener('languagechange', onChange);
  return () => {
    lists.forEach((l) => l.removeEventListener('change', onChange));
    window.removeEventListener('languagechange', onChange);
  };
}

export function useDeviceSettings(): DeviceSettings {
  return useSyncExternalStore(subscribeToDevice, readDeviceSettings, readDeviceSettings);
}

/** What the page shows right now; re-renders when preferences or the device change. */
export function useDisplay(): Display {
  const prefs = usePreferences();
  return effectiveDisplay(prefs, useDeviceSettings());
}

/** The lesson language in use. */
export function useLocale(): string {
  return useDisplay().locale;
}

let fontRequested = false;

/** Download the dyslexia-friendly font the first time it is needed (it's not in the bundle). */
function loadDyslexiaFont(): void {
  if (fontRequested) return;
  fontRequested = true;
  void Promise.all([
    import('@fontsource/opendyslexic/latin-400.css'),
    import('@fontsource/opendyslexic/latin-700.css'),
  ]).catch(() => {
    fontRequested = false; // offline: try again next time it's switched on
  });
}

export function applyDisplay(display: Display, root: HTMLElement = document.documentElement): void {
  root.dataset.theme = display.theme;
  root.dataset.contrast = display.contrast;
  root.dataset.font = display.font;
  root.lang = INTERFACE_LOCALE; // lesson text carries its own lang (see LessonPage)
  if (display.font === 'dyslexic') loadDyslexiaFont();
}

/** Apply now, then keep the page in step with preference and device changes. */
export function startApplyingPreferences(): () => void {
  const apply = () =>
    applyDisplay(effectiveDisplay(usePreferences.getState(), readDeviceSettings()));
  apply();
  const stopPrefs = usePreferences.subscribe(apply);
  const stopDevice = subscribeToDevice(apply);
  return () => {
    stopPrefs();
    stopDevice();
  };
}

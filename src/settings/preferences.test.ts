// @vitest-environment jsdom
import indexHtml from '../../index.html?raw';
import { effectiveDisplay, applyDisplay } from './display';
import {
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
  sanitizePreferences,
  usePreferences,
} from './preferences';

const device = { prefersHighContrast: false, prefersDark: false, language: 'en-US' };

describe('preferences', () => {
  beforeEach(() => {
    localStorage.clear();
    usePreferences.getState().reset();
  });

  it('are saved when changed', () => {
    usePreferences.getState().update({ contrast: 'high', dyslexiaFont: true });
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY)!);
    expect(saved).toMatchObject({ contrast: 'high', dyslexiaFont: true });
    expect(saved).not.toHaveProperty('update');
  });

  it('ignore broken or hostile saved data', () => {
    expect(
      sanitizePreferences({ contrast: 'purple', speechRate: 99, dyslexiaFont: 'yes', voiceURI: 7 }),
    ).toEqual({
      ...DEFAULT_PREFERENCES,
      speechRate: 2,
    });
    expect(sanitizePreferences(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it('reset forgets every choice', () => {
    usePreferences.getState().update({ colorScheme: 'dark', autoRead: true });
    usePreferences.getState().reset();
    expect(sanitizePreferences(usePreferences.getState())).toEqual(DEFAULT_PREFERENCES);
  });
});

describe('effectiveDisplay', () => {
  it('follows the device until the student chooses', () => {
    const fromDevice = effectiveDisplay(DEFAULT_PREFERENCES, {
      ...device,
      prefersHighContrast: true,
      prefersDark: true,
    });
    expect(fromDevice).toMatchObject({ theme: 'dark', contrast: 'high' });

    const chosen = effectiveDisplay(
      { ...DEFAULT_PREFERENCES, colorScheme: 'light', contrast: 'standard' },
      {
        ...device,
        prefersHighContrast: true,
        prefersDark: true,
      },
    );
    expect(chosen).toMatchObject({ theme: 'light', contrast: 'standard' });
  });

  it('turns the font setting and language into page attributes', () => {
    const display = effectiveDisplay(
      { ...DEFAULT_PREFERENCES, dyslexiaFont: true },
      { ...device, language: 'fr-FR' },
    );
    const root = document.createElement('html');
    applyDisplay(display, root);
    expect(root.dataset).toMatchObject({ theme: 'light', contrast: 'standard', font: 'dyslexic' });
    expect(root.lang).toBe('en-US'); // French lessons don't exist yet
  });
});

describe('the early theme script in index.html', () => {
  it('reads the same storage key as the app', () => {
    // Vite replaces %VITE_STORAGE_PREFIX% with the prefix from .env when it builds.
    expect(indexHtml).toContain("'%VITE_STORAGE_PREFIX%prefs:v1'");
    expect(PREFERENCES_KEY).toBe(`${import.meta.env.VITE_STORAGE_PREFIX}prefs:v1`);
  });
});

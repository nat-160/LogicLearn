/**
 * The Accessibility settings: display (high contrast, dark mode, dyslexia-friendly font),
 * narration (read steps aloud, speed, voice) and – once there is more than one – language.
 *
 * It is a native <dialog>, which traps focus while open and closes with Esc. Every change
 * applies immediately and is saved in this browser (preferences.ts).
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LOCALES } from '../i18n/locales';
import { useSpeaker } from '../narration/useSpeaker';
import { getVoices, isSpeechSupported, onVoicesChanged } from '../narration/speech';
import { useDisplay } from './display';
import { usePreferences } from './preferences';

/** An on/off switch. Its state is announced ("on"/"off") and shown by position and text. */
function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <span className="setting-label">
        <span id={`${id}-label`}>{label}</span>
        {hint && (
          <span className="setting-hint" id={`${id}-hint`}>
            {hint}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        className="toggle"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        data-testid={`toggle-${id}`}
      >
        {checked ? 'On' : 'Off'}
      </button>
    </div>
  );
}

function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(getVoices);
  useEffect(() => onVoicesChanged(() => setVoices(getVoices())), []);
  return voices;
}

export function SettingsButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className="header-button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        data-testid="settings-button"
      >
        <span aria-hidden>⚙</span> Accessibility
      </button>
      <dialog
        ref={dialog}
        className="settings-dialog"
        aria-labelledby="settings-title"
        data-testid="settings-dialog"
      >
        <SettingsBody onClose={() => dialog.current?.close()} />
      </dialog>
    </>
  );
}

function SettingsBody({ onClose }: { onClose: () => void }) {
  const prefs = usePreferences();
  const display = useDisplay();
  const voices = useVoices();
  const { speak } = useSpeaker();
  const language = display.locale.split('-')[0];
  // Voices for the lesson language first; on-device voices marked as such.
  const voiceOptions = voices
    .filter((v) => v.lang.toLowerCase().startsWith(language))
    .sort((a, b) => Number(b.localService) - Number(a.localService));

  return (
    <div className="settings-body">
      <h2 id="settings-title">Accessibility</h2>
      <p className="setting-hint">
        Changes apply right away and are saved on this device. Until you change something,
        LogicLearn follows your device&apos;s settings.
      </p>

      <h3>Display</h3>
      <Toggle
        id="contrast"
        label="High contrast"
        hint="Stronger colors and thicker lines."
        checked={display.contrast === 'high'}
        onChange={(on) => prefs.update({ contrast: on ? 'high' : 'standard' })}
      />
      <Toggle
        id="dark"
        label="Dark mode"
        hint="Light text on a dark background."
        checked={display.theme === 'dark'}
        onChange={(on) => prefs.update({ colorScheme: on ? 'dark' : 'light' })}
      />
      <Toggle
        id="dyslexia"
        label="Dyslexia-friendly font"
        hint="OpenDyslexic, with wider spacing between letters, words and lines."
        checked={prefs.dyslexiaFont}
        onChange={(on) => prefs.update({ dyslexiaFont: on })}
      />

      <h3>Narration</h3>
      {isSpeechSupported() ? (
        <>
          <Toggle
            id="auto-read"
            label="Read each lesson step aloud"
            hint='Starts reading when a step opens. Every step also has a "Read aloud" button.'
            checked={prefs.autoRead}
            onChange={(on) => prefs.update({ autoRead: on })}
          />
          <div className="setting-row">
            <label htmlFor="speech-rate" className="setting-label">
              Speaking speed
              <span className="setting-hint">{prefs.speechRate.toFixed(1)}×</span>
            </label>
            <input
              id="speech-rate"
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={prefs.speechRate}
              onChange={(e) => prefs.update({ speechRate: Number(e.target.value) })}
            />
          </div>
          <div className="setting-row">
            <label htmlFor="voice" className="setting-label">
              Voice
            </label>
            <select
              id="voice"
              value={prefs.voiceURI ?? ''}
              onChange={(e) => prefs.update({ voiceURI: e.target.value || null })}
            >
              <option value="">Automatic (on this device if possible)</option>
              {voiceOptions.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} {v.localService ? '(on this device)' : '(online)'}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => speak('settings-test', 'This is how lessons will sound.')}
          >
            <span aria-hidden>🔊</span> Test the voice
          </button>
        </>
      ) : (
        <p className="setting-hint">
          This browser can&apos;t read aloud. You can use a reading tool instead, such as
          Select-to-speak on a Chromebook or Read&amp;Write for Google Chrome.
        </p>
      )}

      {LOCALES.length > 1 && (
        <>
          <h3>Language</h3>
          <div className="setting-row">
            <label htmlFor="locale" className="setting-label">
              Lesson language
            </label>
            <select
              id="locale"
              value={display.locale}
              onChange={(e) => prefs.update({ locale: e.target.value })}
            >
              {LOCALES.map((l) => (
                <option key={l.code} value={l.code} lang={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <div className="settings-actions">
        <button type="button" onClick={() => prefs.reset()} data-testid="settings-reset">
          Use my device&apos;s settings
        </button>
        <button type="button" className="primary" onClick={onClose} data-testid="settings-close">
          Done
        </button>
      </div>
    </div>
  );
}

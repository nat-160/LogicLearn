/**
 * Built-in narration, using the browser's own speech engine (the Web Speech API).
 *
 * Speech runs entirely in the browser, so it needs no server and works on GitHub Pages.
 * On-device voices are preferred: some Chrome voices are generated on Google's servers,
 * which would send the lesson text (never student data) off the device, so LogicLearn
 * never picks one of those itself – only the student can, in Settings.
 *
 * Long text is spoken in pieces of about ten seconds, because some browsers stop a single
 * long utterance after about 15 seconds.
 */
import { create } from 'zustand';

export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

export function getVoices(): SpeechSynthesisVoice[] {
  return isSpeechSupported() ? window.speechSynthesis.getVoices() : [];
}

/** Voices often load after the page does; call back when the list changes. */
export function onVoicesChanged(callback: () => void): () => void {
  if (!isSpeechSupported()) return () => undefined;
  window.speechSynthesis.addEventListener('voiceschanged', callback);
  return () => window.speechSynthesis.removeEventListener('voiceschanged', callback);
}

interface VoiceLike {
  voiceURI: string;
  lang: string;
  localService: boolean;
  default?: boolean;
}

/**
 * The voice to use: the student's choice, if it still exists and speaks the language;
 * otherwise an on-device voice for the language (exact match, then same language).
 * Returns undefined to let the browser use its own default voice for the language.
 */
export function pickVoice<V extends VoiceLike>(
  voices: readonly V[],
  lang: string,
  preferredURI: string | null,
): V | undefined {
  const language = lang.split('-')[0].toLowerCase();
  const exact = (v: V) => v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase();
  const sameLanguage = (v: V) => v.lang.toLowerCase().startsWith(language);
  const chosen = preferredURI ? voices.find((v) => v.voiceURI === preferredURI) : undefined;
  if (chosen && sameLanguage(chosen)) return chosen;
  return (
    voices.find((v) => v.localService && exact(v)) ??
    voices.find((v) => v.localService && sameLanguage(v))
  );
}

/** About ten seconds of speech at this speed (people say about 15 characters a second). */
export function chunkLength(rate: number): number {
  return Math.min(250, Math.max(60, Math.round(150 * rate)));
}

/** Split text into pieces of at most `max` characters, breaking between sentences. */
export function splitIntoChunks(text: string, max = 220): string[] {
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?:;])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (!sentence) continue;
    if (current && (current + ' ' + sentence).length > max) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  // A single very long "sentence" is cut at spaces.
  return chunks.flatMap((chunk) => {
    if (chunk.length <= max) return [chunk];
    const parts: string[] = [];
    let rest = chunk;
    while (rest.length > max) {
      const cut = rest.lastIndexOf(' ', max);
      const at = cut > 0 ? cut : max;
      parts.push(rest.slice(0, at));
      rest = rest.slice(at).trim();
    }
    if (rest) parts.push(rest);
    return parts;
  });
}

export interface SpeakOptions {
  lang: string;
  rate: number;
  voiceURI: string | null;
}

interface NarrationState {
  /** What is being read right now (e.g. "step"), or null. */
  speaking: string | null;
  /** Read `text` aloud, stopping anything already being read. */
  speak(id: string, text: string, options: SpeakOptions): void;
  stop(): void;
}

export const useNarration = create<NarrationState>()((set, get) => {
  let session = 0;
  // Keep the utterances being spoken referenced: Chrome can garbage-collect one mid-speech
  // and then never report that it ended, which would leave "Stop reading" showing.
  let queued: SpeechSynthesisUtterance[] = [];
  return {
    speaking: null,
    speak(id, text, { lang, rate, voiceURI }) {
      if (!isSpeechSupported() || !text.trim()) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const mySession = ++session;
      const voice = pickVoice(getVoices(), lang, voiceURI);
      const chunks = splitIntoChunks(text, chunkLength(rate));
      queued = [];
      chunks.forEach((chunk, i) => {
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = voice?.lang ?? lang;
        utterance.rate = rate;
        if (voice) utterance.voice = voice;
        if (i === chunks.length - 1) {
          const done = () => {
            if (session !== mySession) return;
            queued = [];
            set({ speaking: null });
          };
          utterance.onend = done;
          utterance.onerror = done;
        }
        queued.push(utterance);
        synth.speak(utterance);
      });
      set({ speaking: id });
    },
    stop() {
      session++;
      queued = [];
      if (isSpeechSupported()) window.speechSynthesis.cancel();
      if (get().speaking) set({ speaking: null });
    },
  };
});

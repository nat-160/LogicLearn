/** Speaking with the student's voice settings (speed, voice, lesson language). */
import { useEffect } from 'react';
import { useLocale } from '../settings/display';
import { usePreferences } from '../settings/preferences';
import { isSpeechSupported, useNarration } from './speech';

export function useSpeaker() {
  const rate = usePreferences((s) => s.speechRate);
  const voiceURI = usePreferences((s) => s.voiceURI);
  const locale = useLocale();
  const speaking = useNarration((s) => s.speaking);
  return {
    supported: isSpeechSupported(),
    speaking,
    speak: (id: string, text: string, lang = locale) =>
      useNarration.getState().speak(id, text, { lang, rate, voiceURI }),
    stop: () => useNarration.getState().stop(),
  };
}

/** Stop reading when the component that started it goes away (e.g. leaving a step). */
export function useStopSpeakingOnUnmount(): void {
  useEffect(() => () => useNarration.getState().stop(), []);
}

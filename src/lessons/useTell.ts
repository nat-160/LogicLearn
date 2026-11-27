/** Telling the student something: on screen (by the caller), to screen readers, and out loud. */
import { announce } from '../a11y/announcer';
import { useSpeaker } from '../narration/useSpeaker';
import { usePreferences } from '../settings/preferences';

/**
 * Returns `tell(id, text, lang)`: announces `text` to screen readers and, when the student
 * chose "Read each lesson step aloud", also speaks it in `lang`.
 */
export function useTell(): (id: string, text: string, lang: string) => void {
  const autoRead = usePreferences((s) => s.autoRead);
  const { speak } = useSpeaker();
  return (id, text, lang) => {
    announce(text);
    if (autoRead) speak(id, text, lang);
  };
}

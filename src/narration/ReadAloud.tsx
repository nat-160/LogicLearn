/**
 * The "Read aloud" button, and a hook for speaking with the student's voice settings.
 * Hidden entirely when the browser has no speech support; the page still works with
 * outside read-aloud tools (see docs/accessibility.md).
 */
import { useSpeaker } from './useSpeaker';

export function ReadAloudButton({
  id,
  getText,
  label = 'Read aloud',
  lang,
}: {
  id: string;
  getText: () => string;
  label?: string;
  lang?: string;
}) {
  const { supported, speaking, speak, stop } = useSpeaker();
  if (!supported) return null;
  const active = speaking === id;
  return (
    <button
      type="button"
      className={`read-aloud ${active ? 'is-reading' : ''}`}
      onClick={() => (active ? stop() : speak(id, getText(), lang))}
      data-testid={`read-aloud-${id}`}
    >
      <span aria-hidden>{active ? '⏹' : '🔊'}</span> {active ? 'Stop reading' : label}
    </button>
  );
}

/**
 * Screen reader announcements.
 *
 * Screen readers only announce changes inside a "live region" that already existed before
 * the change; a region that appears together with its message is often read silently.
 * So the app keeps two hidden live regions on the page at all times (see LiveAnnouncer in
 * App.tsx), and any component can post a message to them with `announce()`.
 *
 *   announce('Correct! Every row matches.')            // polite: after the current speech
 *   announce('This circuit never settles.', 'assertive') // interrupts
 */
import { create } from 'zustand';

interface AnnouncerState {
  polite: string;
  assertive: string;
}

export const useAnnouncer = create<AnnouncerState>()(() => ({ polite: '', assertive: '' }));

let timer: ReturnType<typeof setTimeout> | undefined;

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (!message.trim()) return;
  // Clear first, then set, so the same message twice in a row is read twice.
  useAnnouncer.setState({ [priority]: '' });
  clearTimeout(timer);
  timer = setTimeout(() => useAnnouncer.setState({ [priority]: message }), 50);
}

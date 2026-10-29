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

type Priority = keyof AnnouncerState;

/** Messages waiting to be written, and the timer that will write them, per region. */
const pending: Record<Priority, string[]> = { polite: [], assertive: [] };
const timers: Partial<Record<Priority, ReturnType<typeof setTimeout>>> = {};

export function announce(message: string, priority: Priority = 'polite'): void {
  if (!message.trim()) return;
  // Messages posted at the same moment (one switch flip can turn on a light *and* start an
  // oscillation) are read together, instead of the last one replacing the others.
  if (!pending[priority].includes(message)) pending[priority].push(message);
  if (timers[priority] !== undefined) return;
  // Clear first, then set, so the same message twice in a row is read twice.
  useAnnouncer.setState({ [priority]: '' });
  timers[priority] = setTimeout(() => {
    timers[priority] = undefined;
    useAnnouncer.setState({ [priority]: pending[priority].join(' ') });
    pending[priority] = [];
  }, 50);
}

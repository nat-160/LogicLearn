import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { announce, useAnnouncer } from './announcer';

describe('announce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    useAnnouncer.setState({ polite: '', assertive: '' });
  });

  it('writes the message after clearing the region, so a repeat is read again', () => {
    useAnnouncer.setState({ polite: 'Light Y is now on.' });
    announce('Light Y is now on.');
    expect(useAnnouncer.getState().polite).toBe('');
    vi.advanceTimersByTime(50);
    expect(useAnnouncer.getState().polite).toBe('Light Y is now on.');
  });

  it('keeps messages posted together, in both regions', () => {
    announce('This circuit never settles.', 'assertive');
    announce('Light Z is now on.');
    announce('Light Y is now off.');
    vi.advanceTimersByTime(50);
    expect(useAnnouncer.getState().assertive).toBe('This circuit never settles.');
    expect(useAnnouncer.getState().polite).toBe('Light Z is now on. Light Y is now off.');
  });

  it('reads the same message once when it is posted twice at the same moment', () => {
    announce('Added AND gate 1.');
    announce('Added AND gate 1.');
    vi.advanceTimersByTime(50);
    expect(useAnnouncer.getState().polite).toBe('Added AND gate 1.');
  });

  it('ignores empty messages', () => {
    announce('   ');
    vi.advanceTimersByTime(50);
    expect(useAnnouncer.getState().polite).toBe('');
  });
});

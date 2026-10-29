export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Run the waiting call now, if there is one (e.g. when the page is closing). */
  flush(): void;
}

/**
 * Call `fn` only after `ms` milliseconds without another call (e.g. autosave).
 * `flush()` saves immediately, but ONLY if a change is waiting – so a tab that was just
 * left open never overwrites newer work saved by another tab.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number): Debounced<A> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: A | null = null;
  const run = () => {
    clearTimeout(timer);
    if (pending) {
      const args = pending;
      pending = null;
      fn(...args);
    }
  };
  const debounced = (...args: A) => {
    pending = args;
    clearTimeout(timer);
    timer = setTimeout(run, ms);
  };
  debounced.flush = run;
  return debounced;
}

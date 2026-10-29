import { debounce } from './debounce';

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('runs once after calls stop', () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d(1);
    d(2);
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(2);
  });

  it('flush() saves a waiting change now, and does nothing if none is waiting', () => {
    const fn = vi.fn();
    const d = debounce(fn, 300);
    d.flush();
    expect(fn).not.toHaveBeenCalled(); // nothing pending: never overwrite other tabs' work
    d('x');
    d.flush();
    expect(fn).toHaveBeenCalledWith('x');
    vi.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

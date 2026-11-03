import { mergeProgress, mergeStep, parseProgress, type StepProgress } from './progress';

const step = (over: Partial<StepProgress> = {}): StepProgress => ({
  done: false,
  attempts: 0,
  hintsUsed: 0,
  triedRows: [],
  firstSeen: '',
  lastSeen: '',
  ...over,
});

describe('parseProgress', () => {
  it('keeps well-formed progress as it is (the shape the end-to-end tests save)', () => {
    const saved = {
      'not-and/what-is-a-gate': step({ done: true }),
      'not-and/build-not': step({
        attempts: 2,
        hintsUsed: 1,
        triedRows: [0, 1],
        firstSeen: '2026-11-04T10:00:00.000Z',
        lastSeen: '2026-11-04T10:05:00.000Z',
      }),
    };
    expect(parseProgress(JSON.parse(JSON.stringify(saved)))).toEqual(saved);
  });

  it('drops malformed steps and keeps the rest', () => {
    const parsed = parseProgress({
      'not-and/good': step({ done: true }),
      '../escape': step(),
      'not-and/not-an-object': 'done',
      'not-and/done-is-text': { ...step(), done: 'yes' },
      'not-and/negative': { ...step(), attempts: -1 },
      'not-and/huge-row': { ...step(), triedRows: [5000] },
      'not-and/long-date': { ...step(), lastSeen: 'x'.repeat(500) },
    });
    expect(Object.keys(parsed)).toEqual(['not-and/good']);
  });

  it('fills in missing fields, ignores unknown ones, and tidies tried rows', () => {
    const parsed = parseProgress({ 'a/b': { done: true, triedRows: [3, 1, 3], extra: 'x' } });
    expect(parsed['a/b']).toEqual(step({ done: true, triedRows: [1, 3] }));
  });

  it('accepts only an object of steps, and caps how many', () => {
    expect(parseProgress(null)).toEqual({});
    expect(parseProgress([step()])).toEqual({});
    const many = Object.fromEntries(Array.from({ length: 1500 }, (_, i) => [`l/s${i}`, step()]));
    expect(Object.keys(parseProgress(many))).toHaveLength(1000);
  });
});

describe('mergeStep', () => {
  it('never undoes progress', () => {
    const a = step({
      done: true,
      attempts: 3,
      hintsUsed: 1,
      triedRows: [0, 2],
      firstSeen: '2026-11-02T00:00:00Z',
      lastSeen: '2026-11-02T01:00:00Z',
    });
    const b = step({
      done: false,
      attempts: 5,
      hintsUsed: 0,
      triedRows: [1, 2],
      firstSeen: '2026-11-03T00:00:00Z',
      lastSeen: '2026-11-03T01:00:00Z',
    });
    expect(mergeStep(a, b)).toEqual({
      done: true,
      attempts: 5,
      hintsUsed: 1,
      triedRows: [0, 1, 2],
      firstSeen: '2026-11-02T00:00:00Z',
      lastSeen: '2026-11-03T01:00:00Z',
    });
    expect(mergeStep(b, a)).toEqual(mergeStep(a, b));
  });

  it('treats an empty timestamp as unknown', () => {
    const merged = mergeStep(step({ firstSeen: '' }), step({ firstSeen: '2026-11-03T00:00:00Z' }));
    expect(merged.firstSeen).toBe('2026-11-03T00:00:00Z');
  });
});

describe('mergeProgress', () => {
  it('keeps steps from both sides and merges the ones they share', () => {
    const merged = mergeProgress(
      { 'l/a': step({ done: true }), 'l/b': step({ attempts: 1 }) },
      { 'l/b': step({ attempts: 2 }), 'l/c': step() },
    );
    expect(Object.keys(merged).sort()).toEqual(['l/a', 'l/b', 'l/c']);
    expect(merged['l/b'].attempts).toBe(2);
  });
});

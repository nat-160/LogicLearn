import { buildCircuit } from '../sim';
import {
  buildProgressFile,
  describeImport,
  parseProgressFile,
  planImport,
  progressFileName,
  type SavedWork,
} from './progressFile';
import type { StepProgress } from './progress';

const step = (over: Partial<StepProgress> = {}): StepProgress => ({
  done: false,
  attempts: 0,
  hintsUsed: 0,
  triedRows: [],
  firstSeen: '',
  lastSeen: '',
  ...over,
});

const circuit = buildCircuit({
  name: 'Build NOT',
  parts: [
    { id: 'A', type: 'SWITCH', locked: true },
    { id: 'n', type: 'NOT' },
    { id: 'Y', type: 'LIGHT', locked: true },
  ],
  wires: [
    ['A', 'n'],
    ['n', 'Y'],
  ],
});
const work: SavedWork = { starter: 'A:SWITCH:|Y:LIGHT:', doc: circuit };

describe('progress files', () => {
  it('round-trip: what is saved can be loaded again', () => {
    const steps = { 'not-and/build-not': step({ done: true, attempts: 2, triedRows: [0, 1] }) };
    const file = buildProgressFile(steps, { 'not-and/build-not': work }, 'live');
    const parsed = parseProgressFile(JSON.stringify(file));
    expect(parsed).toEqual({ ok: true, steps, work: { 'not-and/build-not': work } });
  });

  it('refuses files that are not progress files, or come from a newer version', () => {
    expect(parseProgressFile('not json')).toMatchObject({ ok: false });
    expect(parseProgressFile(JSON.stringify(circuit))).toMatchObject({ ok: false });
    const newer = { ...buildProgressFile({}, {}, 'live'), version: 2 };
    expect(parseProgressFile(JSON.stringify(newer))).toMatchObject({
      ok: false,
      error: expect.stringMatching(/newer version/),
    });
  });

  it("keeps a project's rule with its circuit, and drops a damaged rule's work", () => {
    const project: SavedWork = { ...work, rule: [[0], [1], [null], [1]] };
    const file = buildProgressFile({}, { 'unit-1-project/build--voting': project }, 'live');
    const parsed = parseProgressFile(JSON.stringify(file));
    expect(parsed.ok && parsed.work).toEqual({ 'unit-1-project/build--voting': project });
    const raw = JSON.parse(JSON.stringify(file));
    raw.work['unit-1-project/build--voting'].rule = [[2]];
    const damaged = parseProgressFile(JSON.stringify(raw));
    expect(damaged.ok && damaged.work).toEqual({});
  });

  it('skips damaged steps and circuits but keeps the rest', () => {
    const file = {
      ...buildProgressFile({ 'not-and/a': step({ done: true }) }, { 'not-and/a': work }, 'dev'),
    };
    const raw = JSON.parse(JSON.stringify(file));
    raw.steps['not-and/b'] = { done: 'maybe' };
    raw.work['not-and/b'] = { starter: 'x', doc: { components: 'nope' } };
    raw.work['../../evil'] = work;
    const parsed = parseProgressFile(JSON.stringify(raw));
    expect(parsed.ok && Object.keys(parsed.steps)).toEqual(['not-and/a']);
    expect(parsed.ok && Object.keys(parsed.work)).toEqual(['not-and/a']);
  });

  it('names the file by date, and marks files from the test version', () => {
    const day = new Date('2026-11-04T12:00:00Z');
    expect(progressFileName('live', day)).toBe('logiclearn-progress-2026-11-04.json');
    expect(progressFileName('dev', day)).toBe('logiclearn-progress-test-version-2026-11-04.json');
  });
});

describe('loading a progress file', () => {
  const local = {
    'not-and/what-is-a-gate': step({ done: true }),
    'not-and/build-not': step({ attempts: 1 }),
  };
  const incoming = {
    steps: {
      'not-and/build-not': step({ done: true, attempts: 3 }),
      'not-and/meet-and': step({ done: true }),
    },
    work: { 'not-and/build-not': work, 'not-and/build-and': work },
  };

  it('never undoes progress, and never overwrites a circuit this browser already has', () => {
    const plan = planImport(local, incoming, (key) => key === 'not-and/build-not');
    expect(plan.steps['not-and/what-is-a-gate'].done).toBe(true);
    expect(plan.steps['not-and/build-not']).toMatchObject({ done: true, attempts: 3 });
    expect(Object.keys(plan.restore)).toEqual(['not-and/build-and']);
    expect(plan.report).toEqual({ added: 1, updated: 1, restored: 1, kept: 1 });
  });

  it('says what happened in a sentence', () => {
    expect(describeImport({ added: 1, updated: 1, restored: 1, kept: 1 })).toBe(
      'Progress loaded: 1 step added, 1 updated, 1 saved circuit restored, 1 saved circuit not replaced (this browser already had work there).',
    );
  });
});

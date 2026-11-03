import { rowsFrom, type CheckRow } from './checker';
import { buildCircuit } from './circuit';
import { grade, gradeRule, type Criterion, type GradeSpec } from './grader';
import type { Bit } from './values';

const b = (v: boolean | number): Bit => (v ? 1 : 0);
const row = (bits: string, out: number): CheckRow => ({
  inputs: [...bits].map((c) => b(c === '1')),
  outputs: [b(out)],
});

// The door alarm: D (door open), R (armed), P (panic) → L. These rows are given.
const given = [
  row('000', 0),
  row('100', 0),
  row('010', 0),
  row('110', 1),
  row('011', 1),
  row('111', 1),
];
const criteria: Criterion[] = [
  { kind: 'rule-keeps-rows', rows: given },
  { kind: 'rule-uses-every-input' },
  { kind: 'matches-rule' },
  { kind: 'outputs-use-every-input' },
  { kind: 'min-gates', count: 2 },
];
// The student's rule: panic always works. L = P OR (D AND R).
const rule = rowsFrom(3, (d, r, p) => b(p || (d && r)));
const spec: GradeSpec = { inputs: ['D', 'P', 'R'], outputs: ['L'], rule, criteria };
// (Inputs are listed in label order: D, P, R. The rule above is in D, R, P order, so
// rebuild it for D, P, R.)
spec.rule = rowsFrom(3, (d, p, r) => b(p || (d && r)));
spec.criteria = [
  {
    kind: 'rule-keeps-rows',
    rows: given.map((g) => ({
      inputs: [g.inputs[0], g.inputs[2], g.inputs[1]],
      outputs: g.outputs,
    })),
  },
  ...criteria.slice(1),
];

const alarm = buildCircuit({
  parts: [
    { id: 'D', type: 'SWITCH' },
    { id: 'P', type: 'PUSH_BUTTON' },
    { id: 'R', type: 'SWITCH' },
    { id: 'and-1', type: 'AND' },
    { id: 'or-1', type: 'OR' },
    { id: 'L', type: 'LIGHT', props: { color: 'red' } },
  ],
  wires: [
    ['D', 'and-1.in0'],
    ['R', 'and-1.in1'],
    ['and-1', 'or-1.in0'],
    ['P', 'or-1.in1'],
    ['or-1', 'L'],
  ],
});

describe('grade', () => {
  it('passes a circuit that follows the rule and meets every criterion', () => {
    const result = grade(alarm, spec);
    expect(result.criteria.map((c) => [c.criterion.kind, c.pass])).toEqual([
      ['rule-keeps-rows', true],
      ['rule-uses-every-input', true],
      ['matches-rule', true],
      ['outputs-use-every-input', true],
      ['min-gates', true],
    ]);
    expect(result.pass).toBe(true);
  });

  it('says which criterion fails, with details', () => {
    // Forgot the panic button: L = D AND R.
    const broken = buildCircuit({
      parts: [
        { id: 'D', type: 'SWITCH' },
        { id: 'P', type: 'PUSH_BUTTON' },
        { id: 'R', type: 'SWITCH' },
        { id: 'and-1', type: 'AND' },
        { id: 'L', type: 'LIGHT' },
      ],
      wires: [
        ['D', 'and-1.in0'],
        ['R', 'and-1.in1'],
        ['and-1', 'L'],
      ],
    });
    const result = grade(broken, spec);
    const byKind = Object.fromEntries(result.criteria.map((c) => [c.criterion.kind, c]));
    // Wrong whenever P is pressed and not (D and R): rows 010, 011, 110 (in D, P, R order).
    expect(byKind['matches-rule']).toMatchObject({ pass: false, details: { wrong: 3, rows: 8 } });
    expect(byKind['outputs-use-every-input']).toMatchObject({
      pass: false,
      details: { output: 'L', input: 'P' },
    });
    expect(result.pass).toBe(false);
  });

  it('counts gates without inputs and outputs, and counts any part for uses-part', () => {
    const result = grade(alarm, {
      ...spec,
      criteria: [
        { kind: 'max-gates', count: 1 },
        { kind: 'uses-part', type: 'PUSH_BUTTON' },
        { kind: 'uses-part', type: 'SEVEN_SEG' },
      ],
    });
    expect(result.criteria.map((c) => [c.pass, c.details?.have])).toEqual([
      [false, 2],
      [true, 1],
      [false, 0],
    ]);
  });
});

describe('gradeRule', () => {
  it('checks the rule before anything is built', () => {
    expect(gradeRule(spec).every((c) => c.pass)).toBe(true);
    // A rule that ignores R and changes a given row.
    const lazy = { ...spec, rule: rowsFrom(3, (d, p) => b(d || p)) };
    expect(gradeRule(lazy)).toMatchObject([
      { pass: false, details: { row: '100' } },
      { pass: false, details: { input: 'R' } },
    ]);
  });
});

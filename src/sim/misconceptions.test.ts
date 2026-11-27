import { check, rowsFrom } from './checker';
import { buildCircuit } from './circuit';
import {
  inputDependencies,
  MISCONCEPTION_IDS,
  rowsFromRules,
  type RulePart,
} from './misconceptions';
import type { Bit } from './values';

const b = (v: boolean | number): Bit => (v ? 1 : 0);

/** Switches (inputs), one gate per output, and lights: out[k] = type[k](in0, in1). */
function gates(inputs: string[], outputs: [string, string, [string, string]][]) {
  return buildCircuit({
    parts: [
      ...inputs.map((id) => ({ id, type: 'SWITCH' })),
      ...outputs.flatMap(([out, type]) => [
        { id: `g-${out}`, type },
        { id: out, type: 'LIGHT' },
      ]),
    ],
    wires: outputs.flatMap(([out, , [a, c]]) => [
      [a, `g-${out}.in0`] as [string, string],
      [c, `g-${out}.in1`] as [string, string],
      [`g-${out}`, out] as [string, string],
    ]),
  });
}

describe('misconceptions v2', () => {
  it('finds a swap in one output of several (a half adder with OR for the sum)', () => {
    const doc = gates(
      ['A', 'B'],
      [
        ['C', 'AND', ['A', 'B']],
        ['S', 'OR', ['A', 'B']],
      ],
    );
    const spec = {
      inputs: ['A', 'B'],
      outputs: ['C', 'S'],
      expected: rowsFrom(2, (a, c) => [b(a && c), b(a !== c)]),
    };
    const m = check(doc, spec).misconception;
    expect(m).toMatchObject({ id: 'xor-as-or', params: { output: 'S' } });
    expect(m?.summary).toMatch(/^Output S: /);
  });

  it('finds which rule of a word problem was swapped', () => {
    // Rules: "if A then B" and "not both B and C". The student read rule 1 as AND.
    const rules: RulePart[] = [
      { fn: 'IMPLY', inputs: ['A', 'B'] },
      { fn: 'NAND', inputs: ['B', 'C'] },
    ];
    const spec = {
      inputs: ['A', 'B', 'C'],
      outputs: ['Y'],
      expected: rowsFromRules(['A', 'B', 'C'], rules),
      rules,
    };
    // Built: (A AND B) AND NOT (B AND C)
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'B', type: 'SWITCH' },
        { id: 'C', type: 'SWITCH' },
        { id: 'r1', type: 'AND' },
        { id: 'r2', type: 'NAND' },
        { id: 'all', type: 'AND' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'r1.in0'],
        ['B', 'r1.in1'],
        ['B', 'r2.in0'],
        ['C', 'r2.in1'],
        ['r1', 'all.in0'],
        ['r2', 'all.in1'],
        ['all', 'Y'],
      ],
    });
    expect(check(doc, spec).misconception).toMatchObject({
      id: 'if-then-as-and',
      params: { rule: 1 },
    });
  });

  it('finds an output that is upside down in every row', () => {
    const doc = gates(['A', 'B'], [['Y', 'NAND', ['A', 'B']]]);
    const spec = { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, c) => b(a && c)) };
    expect(check(doc, spec).misconception).toMatchObject({
      id: 'inverted-output',
      params: { output: 'Y' },
      summary: 'Output Y is the opposite of what the rule wants, in every row.',
    });
  });

  it('finds an output that ignores an input it needs ("by itself")', () => {
    // Wanted: A AND NOT B AND C. Built: A AND C (B left out).
    const doc = gates(['A', 'B', 'C'], [['Y', 'AND', ['A', 'C']]]);
    const spec = {
      inputs: ['A', 'B', 'C'],
      outputs: ['Y'],
      expected: rowsFrom(3, (a, c, d) => b(a && !c && d)),
    };
    expect(check(doc, spec).misconception).toMatchObject({
      id: 'ignores-input',
      params: { output: 'Y', input: 'B' },
    });
  });

  it('lists every id, without duplicates', () => {
    expect(new Set(MISCONCEPTION_IDS).size).toBe(MISCONCEPTION_IDS.length);
    expect(MISCONCEPTION_IDS).toContain('ignores-input');
  });
});

describe('inputDependencies', () => {
  it('judges by behaviour: A AND NOT A depends on nothing', () => {
    const rows = rowsFrom(2, (a, c) => [b(a && !a), b(c)]).map((r) => ({
      inputs: r.inputs,
      outputs: r.outputs,
    }));
    expect(inputDependencies(rows)).toEqual([
      [false, false],
      [false, true],
    ]);
  });
});

describe('rowsFromRules', () => {
  it('gives 1 exactly when every rule holds', () => {
    const rows = rowsFromRules(['A', 'B'], [{ fn: 'IMPLY', inputs: ['A', 'B'] }]);
    expect(rows.map((r) => r.outputs[0])).toEqual([1, 1, 0, 1]);
  });
});

import { addComponent, buildCircuit, setLabel } from './circuit';
import { check, rowsFrom, type CheckSpec } from './checker';
import { diagnoseMisconception, identifyTwoInputFunction } from './misconceptions';
import { halfAdder, oneGate } from './testCircuits';
import { computeTruthTable, findIO } from './truthTable';
import type { Bit } from './values';

const spec = (fn: (a: Bit, b: Bit) => Bit, extra: Partial<CheckSpec> = {}): CheckSpec => ({
  inputs: ['A', 'B'],
  outputs: ['Y'],
  expected: rowsFrom(2, (a, b) => fn(a, b)),
  ...extra,
});

const XOR = spec((a, b) => (a ^ b) as Bit);
const NAND = spec((a, b) => (a & b ? 0 : 1) as Bit);
const IMPLY = spec((a, b) => (!a || b ? 1 : 0) as Bit);

describe('truth tables', () => {
  it('orders inputs and outputs by label', () => {
    const io = findIO(halfAdder());
    expect(io.inputs.map((p) => p.label)).toEqual(['A', 'B']);
    expect(io.outputs.map((p) => p.label)).toEqual(['C', 'S']);
  });

  it('computes every row of a half adder, all zeros first', () => {
    const result = computeTruthTable(halfAdder());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.table.rows.map((r) => [r.inputs, r.outputs])).toEqual([
      [
        [0, 0],
        [0, 0],
      ], // C, S
      [
        [0, 1],
        [0, 1],
      ],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [1, 1],
        [1, 0],
      ],
    ]);
  });

  it('refuses tables that would be too big', () => {
    let doc = buildCircuit({ parts: [] });
    for (let i = 0; i < 4; i++) doc = addComponent(doc, 'SWITCH', { x: 0, y: i * 40 }).doc;
    expect(computeTruthTable(doc, 3)).toEqual({
      ok: false,
      reason: 'too-many-inputs',
      inputCount: 4,
    });
  });
});

describe('check()', () => {
  it('passes a correct XOR', () => {
    const result = check(oneGate('XOR'), XOR);
    expect(result.pass).toBe(true);
    expect(result.rows).toHaveLength(4);
    expect(result.mismatches).toHaveLength(0);
  });

  it('fails OR-for-XOR on exactly the 1,1 row and names the mistake', () => {
    const result = check(oneGate('OR'), XOR);
    expect(result.pass).toBe(false);
    expect(result.mismatches.map((m) => m.inputs)).toEqual([[1, 1]]);
    expect(result.misconception?.id).toBe('xor-as-or');
  });

  it('fails XOR-for-NAND ("not both") on exactly the 0,0 row', () => {
    const result = check(oneGate('XOR'), NAND);
    expect(result.mismatches.map((m) => m.inputs)).toEqual([[0, 0]]);
    expect(result.misconception?.id).toBe('not-both-as-xor');
  });

  it('fails AND-for-implication on exactly the 0,0 and 0,1 rows', () => {
    const result = check(oneGate('AND'), IMPLY);
    expect(result.mismatches.map((m) => m.inputs)).toEqual([
      [0, 0],
      [0, 1],
    ]);
    expect(result.misconception?.id).toBe('if-then-as-and');
  });

  it('recognizes AND-for-XNOR ("if and only if")', () => {
    const result = check(
      oneGate('AND'),
      spec((a, b) => (a === b ? 1 : 0) as Bit),
    );
    expect(result.misconception?.id).toBe('iff-as-and');
  });

  it('reports a missing output instead of running the table', () => {
    const result = check(oneGate('XOR'), { ...XOR, outputs: ['Out'] });
    expect(result.pass).toBe(false);
    expect(result.rows).toHaveLength(0);
    expect(result.diagnostics.map((d) => d.code)).toContain('MISSING_IO');
  });

  it('reports two inputs with the same label', () => {
    const doc = setLabel(oneGate('XOR'), 'B', 'A');
    const result = check(doc, XOR);
    expect(result.pass).toBe(false);
    expect(result.diagnostics.find((d) => d.code === 'DUPLICATE_LABEL')?.componentIds).toEqual([
      'A',
      'B',
    ]);
  });

  it('enforces "only NAND" without counting switches and lights', () => {
    const onlyNand = { constraints: { allowedTypes: ['NAND'] } };
    const withAnd = check(
      oneGate('AND'),
      spec((a, b) => (a & b) as Bit, onlyNand),
    );
    expect(withAnd.diagnostics.find((d) => d.code === 'DISALLOWED_TYPE')?.componentIds).toEqual([
      'g',
    ]);
    expect(withAnd.pass).toBe(false);

    const withNand = check(
      oneGate('NAND'),
      spec((a, b) => (a & b ? 0 : 1) as Bit, onlyNand),
    );
    expect(withNand.pass).toBe(true);
  });

  it('enforces a gate budget and required gate types', () => {
    const result = check(oneGate('XOR'), {
      ...XOR,
      constraints: { maxGates: 0, requiredTypes: ['AND'] },
    });
    const codes = result.diagnostics.map((d) => d.code);
    expect(codes).toContain('TOO_MANY_GATES');
    expect(codes).toContain('MISSING_REQUIRED_TYPE');
  });

  it('fails when an output is unknown because something is unconnected', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'B', type: 'SWITCH' },
        { id: 'g', type: 'XOR' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'g.in0'],
        ['g', 'Y'],
      ],
    });
    const result = check(doc, XOR);
    const codes = result.diagnostics.map((d) => d.code);
    expect(codes).toContain('UNCONNECTED_INPUT');
    expect(codes).toContain('OUTPUT_UNKNOWN');
    expect(result.pass).toBe(false);
  });

  it('refuses circuits with loops, with a friendly message', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'B', type: 'SWITCH' },
        { id: 'g', type: 'NAND' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'g.in0'],
        ['g', 'g.in1'],
        ['g', 'Y'],
      ],
    });
    const result = check(doc, NAND);
    expect(result.pass).toBe(false);
    expect(result.diagnostics.find((d) => d.code === 'HAS_CYCLE')?.message).toMatch(/later lesson/);
  });

  it('warns about extra inputs and keeps them off during the check', () => {
    const doc = addComponent(oneGate('XOR'), 'SWITCH', { x: 0, y: 200 }).doc; // gets label "C"
    const result = check(doc, XOR);
    expect(result.pass).toBe(true);
    expect(result.diagnostics.map((d) => d.code)).toEqual(['EXTRA_IO']);
  });

  it('checks circuits with several outputs', () => {
    const halfAdderSpec: CheckSpec = {
      inputs: ['A', 'B'],
      outputs: ['S', 'C'],
      expected: rowsFrom(2, (a, b) => [(a ^ b) as Bit, (a & b) as Bit]),
    };
    expect(check(halfAdder(), halfAdderSpec).pass).toBe(true);
  });

  it('throws on a malformed spec (an authoring bug, not a student mistake)', () => {
    expect(() =>
      check(oneGate('XOR'), { ...XOR, expected: [{ inputs: [0], outputs: [0] }] }),
    ).toThrow();
  });
});

describe('misconception signatures', () => {
  it('identifies the standard two-input functions', () => {
    expect(identifyTwoInputFunction([0, 1, 1, 0])).toBe('XOR');
    expect(identifyTwoInputFunction([1, 1, 0, 1])).toBe('IMPLY');
    expect(identifyTwoInputFunction([0, 1, 'X', 0])).toBeUndefined();
  });

  it('flags a mistake only on the all-zeros row, for any circuit', () => {
    const rows = [
      { inputs: [0, 0, 0] as Bit[], expected: [1] as Bit[], actual: [0] as Bit[] },
      { inputs: [0, 0, 1] as Bit[], expected: [0] as Bit[], actual: [0] as Bit[] },
    ];
    expect(diagnoseMisconception({ inputCount: 3, outputCount: 1, rows })?.id).toBe(
      'missed-all-zeros',
    );
  });

  it('returns nothing when every row is right', () => {
    const rows = [{ inputs: [0, 0] as Bit[], expected: [1] as Bit[], actual: [1] as Bit[] }];
    expect(diagnoseMisconception({ inputCount: 2, outputCount: 1, rows })).toBeUndefined();
  });
});

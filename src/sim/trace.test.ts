import { check } from './checker';
import { buildCircuit } from './circuit';
import { pickExampleRow, traceRow } from './trace';

/** Y = (NOT A) AND B, with the gates added in the "wrong" order. */
const notAnd = buildCircuit({
  parts: [
    { id: 'A', type: 'SWITCH' },
    { id: 'B', type: 'SWITCH' },
    { id: 'g', type: 'AND' },
    { id: 'n', type: 'NOT' },
    { id: 'Y', type: 'LIGHT' },
  ],
  wires: [
    ['A', 'n'],
    ['n', 'g.in0'],
    ['B', 'g.in1'],
    ['g', 'Y'],
  ],
});

describe('traceRow', () => {
  it('lists every gate after the gates that feed it, with its values', () => {
    const trace = traceRow(notAnd, { A: 0, B: 1 });
    expect(trace.inputs).toEqual([
      { id: 'A', label: 'A', bit: 0 },
      { id: 'B', label: 'B', bit: 1 },
    ]);
    expect(trace.steps).toEqual([
      { id: 'n', type: 'NOT', inputs: [0], outputs: [1] },
      { id: 'g', type: 'AND', inputs: [1, 1], outputs: [1] },
    ]);
    expect(trace.outputs).toEqual([{ id: 'Y', label: 'Y', value: 1 }]);
    expect(trace.settled).toBe(true);
  });

  it('treats inputs it is not given as 0, and shows unconnected pins as X', () => {
    const loose = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'g', type: 'OR' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'g.in0'],
        ['g', 'Y'],
      ],
    });
    const trace = traceRow(loose, {});
    expect(trace.steps).toEqual([{ id: 'g', type: 'OR', inputs: [0, 'X'], outputs: ['X'] }]);
    expect(trace.outputs[0].value).toBe('X');
  });

  it('puts gates on a loop last', () => {
    const loop = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'g', type: 'NAND' },
        { id: 'n', type: 'NOT' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'g.in0'],
        ['g', 'g.in1'],
        ['A', 'n'],
        ['n', 'Y'],
      ],
    });
    const trace = traceRow(loop, { A: 1 });
    expect(trace.steps.map((s) => s.id)).toEqual(['n', 'g']);
    // A gate fed back into itself starts unknown and stays unknown (see simulator.ts).
    expect(trace.steps[1].outputs).toEqual(['X']);
  });

  it('gives a display one output per segment', () => {
    const display = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'D', type: 'SEVEN_SEG' },
      ],
      wires: [['A', 'D.g']],
    });
    const outputs = traceRow(display, { A: 1 }).outputs;
    expect(outputs.map((o) => o.label)).toEqual(['D.a', 'D.b', 'D.c', 'D.d', 'D.e', 'D.f', 'D.g']);
    expect(outputs.at(-1)?.value).toBe(1);
  });
});

describe('the example wrong row', () => {
  it('prefers a row with clear values over one showing X', () => {
    const rows = [{ actual: ['X' as const] }, { actual: [1 as const] }];
    expect(pickExampleRow(rows)).toBe(rows[1]);
    expect(pickExampleRow([rows[0]])).toBe(rows[0]);
    expect(pickExampleRow([])).toBeUndefined();
  });

  it('comes with every failed check, with the labels to put it into words', () => {
    const spec = {
      inputs: ['A', 'B'],
      outputs: ['Y'],
      expected: [
        { inputs: [0, 0], outputs: [0] },
        { inputs: [0, 1], outputs: [0] },
        { inputs: [1, 0], outputs: [0] },
        { inputs: [1, 1], outputs: [1] },
      ] as const,
    };
    // (NOT A) AND B is right only on rows 00, 10 and wrong on 01, 11.
    const result = check(notAnd, {
      ...spec,
      expected: spec.expected.map((r) => ({ inputs: [...r.inputs], outputs: [...r.outputs] })),
    });
    expect(result.labels).toEqual({ inputs: ['A', 'B'], outputs: ['Y'] });
    expect(result.example).toMatchObject({ inputs: [0, 1], expected: [0], actual: [1] });
  });
});

import { buildCircuit, rowsFrom, Simulator, type Bit } from '../sim';
import { rowsToTry } from './triedRows';

const b = (v: boolean | number): Bit => (v ? 1 : 0);
const spec = { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, c) => b(a && c)) };
const and = buildCircuit({
  parts: [
    { id: 'A', type: 'SWITCH' },
    { id: 'B', type: 'SWITCH' },
    { id: 'g', type: 'AND' },
    { id: 'Y', type: 'LIGHT' },
  ],
  wires: [
    ['A', 'g.in0'],
    ['B', 'g.in1'],
    ['g', 'Y'],
  ],
});
const values = new Simulator(and).snapshot();

describe('rowsToTry', () => {
  it('lists the rows not tried yet, in counting order', () => {
    expect(rowsToTry(and, values, new Set([0, 3]), spec, false)).toEqual([
      [0, 1],
      [1, 0],
    ]);
    expect(rowsToTry(and, values, new Set([0, 1, 2, 3]), spec, false)).toEqual([]);
  });

  it('stays quiet when it would not help', () => {
    const tried = new Set([0]);
    // predict-first: values are hidden
    expect(rowsToTry(and, values, tried, spec, true)).toEqual([]);
    // the circuit's light isn't connected yet (X)
    const unwired = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'B', type: 'SWITCH' },
        { id: 'Y', type: 'LIGHT' },
      ],
    });
    expect(rowsToTry(unwired, new Simulator(unwired).snapshot(), tried, spec, false)).toEqual([]);
    // more than 8 rows
    const big = { inputs: ['A', 'B', 'C', 'D'], outputs: ['Y'], expected: rowsFrom(4, () => 0) };
    expect(rowsToTry(and, values, tried, big, false)).toEqual([]);
  });
});

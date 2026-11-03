import { GATE_TYPES } from './components';
import { TWO_INPUT_FUNCTIONS } from './misconceptions';
import { comparePredictions, gateTruthTable, type TruthTable } from './truthTable';

describe('gateTruthTable', () => {
  it("matches each 2-input gate's known function, in counting order", () => {
    for (const type of GATE_TYPES.filter((t) => t !== 'NOT')) {
      const table = gateTruthTable(type);
      expect(table.inputs, type).toBe(2);
      expect(
        table.rows.map((r) => r.output),
        type,
      ).toEqual(TWO_INPUT_FUNCTIONS[type]);
    }
  });

  it('gives NOT one input', () => {
    expect(gateTruthTable('NOT')).toEqual({
      inputs: 1,
      rows: [
        { inputs: [0], output: 1 },
        { inputs: [1], output: 0 },
      ],
    });
  });
});

describe('comparePredictions', () => {
  // Y = NOT A AND B, as a hand-made table (rows in counting order).
  const table = {
    inputs: [],
    outputs: [],
    rows: [
      { inputs: [0, 0], outputs: [0], settled: true },
      { inputs: [0, 1], outputs: [1], settled: true },
      { inputs: [1, 0], outputs: [0], settled: true },
      { inputs: [1, 1], outputs: [0], settled: true },
    ],
  } as unknown as TruthTable;

  it('marks each prediction right or wrong, and counts fully right rows', () => {
    const result = comparePredictions(table, [[0], [1], [1], [0]]);
    expect(result.right).toEqual([[true], [true], [false], [true]]);
    expect(result).toMatchObject({ rowsRight: 3, rows: 4, complete: true });
  });

  it('counts a missing prediction as wrong and the table as incomplete', () => {
    const result = comparePredictions(table, [[0], [null], [0], [0]]);
    expect(result.right[1]).toEqual([false]);
    expect(result.complete).toBe(false);
  });

  it('never counts an unknown (X) output as predicted right', () => {
    const withX = {
      ...table,
      rows: [{ inputs: [0], outputs: ['X'], settled: true }],
    } as TruthTable;
    expect(comparePredictions(withX, [[0]]).right).toEqual([[false]]);
  });
});

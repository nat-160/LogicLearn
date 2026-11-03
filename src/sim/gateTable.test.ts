import { GATE_TYPES } from './components';
import { TWO_INPUT_FUNCTIONS } from './misconceptions';
import { gateTruthTable } from './truthTable';

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

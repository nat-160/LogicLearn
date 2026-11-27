import { buildCircuit, check, rowsFrom, type Bit } from '../sim';
import { exampleText, rowText, summarizeCheck } from './checkSummary';

const b = (v: boolean | number): Bit => (v ? 1 : 0);
/** One 2-input gate between switches A, B and light Y. */
const oneGate = (type: string) =>
  buildCircuit({
    parts: [
      { id: 'A', type: 'SWITCH' },
      { id: 'B', type: 'SWITCH' },
      { id: 'g', type },
      { id: 'Y', type: 'LIGHT' },
    ],
    wires: [
      ['A', 'g.in0'],
      ['B', 'g.in1'],
      ['g', 'Y'],
    ],
  });
const AND = { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (x, y) => b(x && y)) };

describe('the example wrong row in words', () => {
  it('names the inputs, what the circuit gives and what the task wants', () => {
    const result = check(oneGate('OR'), AND);
    expect(exampleText(result)).toBe(
      'For example, with A = 0, B = 1, your circuit gives Y = 1, but the task wants Y = 0.',
    );
    expect(summarizeCheck(result)).toContain('2 of 4 rows are wrong. For example, with A = 0');
  });

  it('says "unknown" for X, and nothing when the check passes', () => {
    expect(rowText(['A', 'B'], [1, 'X'])).toBe('A = 1, B = ? (unknown)');
    expect(exampleText(check(oneGate('AND'), AND))).toBeUndefined();
  });
});

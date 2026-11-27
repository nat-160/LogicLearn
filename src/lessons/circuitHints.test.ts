import { buildCircuit, rowsFrom, type Bit } from '../sim';
import { lookHint, rowHint } from './circuitHints';

const b = (v: boolean | number): Bit => (v ? 1 : 0);
const AND = { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (x, y) => b(x && y)) };
const io = [
  { id: 'A', type: 'SWITCH' },
  { id: 'B', type: 'SWITCH' },
  { id: 'Y', type: 'LIGHT' },
];
const oneGate = (type: string) =>
  buildCircuit({
    parts: [...io, { id: 'or-1', type }],
    wires: [
      ['A', 'or-1.in0'],
      ['B', 'or-1.in1'],
      ['or-1', 'Y'],
    ],
  });

describe('hints worked out from the circuit', () => {
  it('say so when the circuit is already right', () => {
    expect(lookHint(oneGate('AND'), AND).text).toMatch(/already gives the right output/);
    expect(rowHint(oneGate('AND'), AND).text).toMatch(/already gives the right output/);
  });

  it('point at a part that is not connected, without a row to try', () => {
    const loose = buildCircuit({
      parts: [...io, { id: 'and-1', type: 'AND' }],
      wires: [
        ['A', 'and-1.in0'],
        ['and-1', 'Y'],
      ],
    });
    const hint = lookHint(loose, AND);
    expect(hint.text).toMatch(/^Look here first: /);
    expect(hint.partIds).toEqual(['and-1']);
    expect(rowHint(loose, AND).row).toBeUndefined();
  });

  it('name the gate that drives a wrong output', () => {
    expect(lookHint(oneGate('OR'), AND)).toEqual({
      text: 'Look at OR gate 1: it drives Y, and Y is wrong in 2 of 4 rows.',
      partIds: ['or-1'],
    });
  });

  it('notice an output wired straight to a switch', () => {
    const straight = buildCircuit({ parts: io, wires: [['A', 'Y']] });
    expect(lookHint(straight, AND).text).toMatch(
      /^Y is wired straight to Switch A, so it copies it/,
    );
  });

  it('walk through one wrong row, gate by gate, and leave the fix to the student', () => {
    const hint = rowHint(oneGate('OR'), AND);
    expect(hint.text).toBe(
      'Try A = 0, B = 1. OR gate 1 gets 0 and 1 and gives 1. So Y is 1, but the task wants 0. Which gate should change?',
    );
    expect(hint.row).toEqual({ labels: ['A', 'B'], bits: [0, 1] });
    expect(hint.partIds).toEqual(['or-1']);
  });

  it('find outputs the way the truth table does (a label with a space still matches)', () => {
    const spaced = buildCircuit({
      parts: [
        ...io.slice(0, 2),
        { id: 'Y', type: 'LIGHT', label: 'Y ' },
        { id: 'or-1', type: 'OR' },
      ],
      wires: [
        ['A', 'or-1.in0'],
        ['B', 'or-1.in1'],
        ['or-1', 'Y'],
      ],
    });
    expect(lookHint(spaced, AND).text).toBe(
      'Look at OR gate 1: it drives Y, and Y is wrong in 2 of 4 rows.',
    );
  });

  it('never ask "which gate" when the output is wired straight to a switch', () => {
    const straight = buildCircuit({ parts: io, wires: [['A', 'Y']] });
    const hint = rowHint(straight, AND);
    expect(hint.text).toMatch(/^Y is wired straight to Switch A/);
    expect(hint.row).toBeDefined();
  });
});

/**
 * Lesson 8: useful circuits – adding binary numbers.
 *
 * A half adder (sum = XOR, carry = AND), a full adder (with a carry in), then a 2-bit
 * adder made of the two. Sum lights are green and carry lights red, so the outputs are
 * easy to tell apart (their labels and names say it too).
 */
import { buildCircuit, rowsFrom } from '../../../sim';
import type { LessonDef } from '../../types';
import { b, io } from '../helpers';

const HALF = { colors: { C: 'red', S: 'green' } };
const FULL = { colors: { Cout: 'red', S: 'green' }, outputX: 28 };
const TWO_BIT = { colors: { S0: 'green', S1: 'green', S2: 'red' }, outputX: 32 };

/** A + B as a 3-bit number S2 S1 S0, from 2-bit numbers A1 A0 and B1 B0. */
const twoBitSum = (a0: number, a1: number, b0: number, b1: number) => {
  const sum = a0 + 2 * a1 + (b0 + 2 * b1);
  return [b(sum & 1), b(sum & 2), b(sum & 4)];
};

export const addersLesson: LessonDef = {
  id: 'adders',
  number: 8,
  unit: 2,
  standards: ['IB A1.2.3', 'IB A1.2.5'],
  steps: [
    { id: 'adding-bits', kind: 'explain' },
    {
      id: 'half-adder',
      kind: 'guided',
      starter: buildCircuit({ name: 'Half adder', parts: io(['A', 'B'], ['C', 'S'], HALF) }),
      solution: buildCircuit({
        name: 'Half adder',
        parts: [
          ...io(['A', 'B'], ['C', 'S'], HALF),
          { id: 'and-1', type: 'AND', at: [10, -1] },
          { id: 'xor-1', type: 'XOR', at: [10, 4] },
        ],
        wires: [
          ['A', 'and-1.in0'],
          ['B', 'and-1.in1'],
          ['A', 'xor-1.in0'],
          ['B', 'xor-1.in1'],
          ['and-1', 'C'],
          ['xor-1', 'S'],
        ],
      }),
      spec: {
        inputs: ['A', 'B'],
        outputs: ['C', 'S'],
        expected: rowsFrom(2, (x, y) => [b(x && y), b(x !== y)]),
      },
      palette: ['AND', 'OR', 'NOT', 'XOR'],
    },
    {
      id: 'full-adder',
      kind: 'guided',
      starter: buildCircuit({
        name: 'Full adder',
        parts: io(['A', 'B', 'Cin'], ['Cout', 'S'], FULL),
      }),
      // S = A XOR B XOR Cin; Cout = (A AND B) OR ((A XOR B) AND Cin).
      solution: buildCircuit({
        name: 'Full adder',
        parts: [
          ...io(['A', 'B', 'Cin'], ['Cout', 'S'], FULL),
          { id: 'xor-1', type: 'XOR', at: [7, 0] },
          { id: 'xor-2', type: 'XOR', at: [21, 4] },
          { id: 'and-1', type: 'AND', at: [7, -5] },
          { id: 'and-2', type: 'AND', at: [14, 3] },
          { id: 'or-1', type: 'OR', at: [21, -2] },
        ],
        wires: [
          ['A', 'xor-1.in0'],
          ['B', 'xor-1.in1'],
          ['xor-1', 'xor-2.in0'],
          ['Cin', 'xor-2.in1'],
          ['xor-2', 'S'],
          ['A', 'and-1.in0'],
          ['B', 'and-1.in1'],
          ['xor-1', 'and-2.in0'],
          ['Cin', 'and-2.in1'],
          ['and-1', 'or-1.in0'],
          ['and-2', 'or-1.in1'],
          ['or-1', 'Cout'],
        ],
      }),
      spec: {
        inputs: ['A', 'B', 'Cin'],
        outputs: ['Cout', 'S'],
        expected: rowsFrom(3, (x, y, c) => [b(x + y + c >= 2), b((x + y + c) % 2)]),
      },
      palette: ['AND', 'OR', 'NOT', 'XOR'],
    },
    {
      id: 'two-bit-adder',
      kind: 'challenge',
      starter: buildCircuit({
        name: '2-bit adder',
        parts: io(['A0', 'A1', 'B0', 'B1'], ['S0', 'S1', 'S2'], TWO_BIT),
      }),
      // Bit 0: a half adder. Bit 1: a full adder, with bit 0's carry as its carry in.
      solution: buildCircuit({
        name: '2-bit adder',
        parts: [
          ...io(['A0', 'A1', 'B0', 'B1'], ['S0', 'S1', 'S2'], TWO_BIT),
          { id: 'xor-1', type: 'XOR', at: [8, -2] },
          { id: 'and-1', type: 'AND', at: [8, 3] },
          { id: 'xor-2', type: 'XOR', at: [8, 9] },
          { id: 'and-2', type: 'AND', at: [8, 14] },
          { id: 'xor-3', type: 'XOR', at: [18, 4] },
          { id: 'and-3', type: 'AND', at: [18, 9] },
          { id: 'or-1', type: 'OR', at: [25, 11] },
        ],
        wires: [
          ['A0', 'xor-1.in0'],
          ['B0', 'xor-1.in1'],
          ['xor-1', 'S0'],
          ['A0', 'and-1.in0'],
          ['B0', 'and-1.in1'],
          ['A1', 'xor-2.in0'],
          ['B1', 'xor-2.in1'],
          ['A1', 'and-2.in0'],
          ['B1', 'and-2.in1'],
          ['xor-2', 'xor-3.in0'],
          ['and-1', 'xor-3.in1'],
          ['xor-3', 'S1'],
          ['xor-2', 'and-3.in0'],
          ['and-1', 'and-3.in1'],
          ['and-2', 'or-1.in0'],
          ['and-3', 'or-1.in1'],
          ['or-1', 'S2'],
        ],
      }),
      spec: {
        inputs: ['A0', 'A1', 'B0', 'B1'],
        outputs: ['S0', 'S1', 'S2'],
        expected: rowsFrom(4, twoBitSum),
      },
      palette: ['AND', 'OR', 'NOT', 'XOR'],
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
};

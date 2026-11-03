/**
 * Lesson 7: from truth table to circuit.
 *
 * The method: one AND per row where the output is 1 (with a NOT on each input that is 0
 * in that row – "by itself" needs NOTs, ICER '08), then OR the rows together. Each build
 * step shows its target table (`showTarget`), even in the challenge where the circuit's
 * own values stay hidden.
 */
import { buildCircuit, rowNumber, rowsFrom, type Bit } from '../../../sim';
import type { LessonDef } from '../../types';
import { b, io } from '../helpers';

/** Y is 1 exactly on the listed rows (written as input bits, e.g. '011'). */
const onRows =
  (...rows: string[]) =>
  (...bits: Bit[]) =>
    b(rows.some((r) => rowNumber([...r].map((c) => (c === '1' ? 1 : 0))) === rowNumber(bits)));

const ABC = ['A', 'B', 'C'];

export const tableToCircuitLesson: LessonDef = {
  id: 'table-to-circuit',
  number: 7,
  unit: 2,
  standards: ['IB A1.2.4', 'IB A1.2.5'],
  steps: [
    {
      id: 'one-row-at-a-time',
      kind: 'explain',
      // The row A = 1, B = 0 "by itself": A AND (NOT B).
      example: buildCircuit({
        name: 'One row',
        parts: [
          { id: 'A', type: 'SWITCH', at: [0, 0], locked: true },
          { id: 'B', type: 'SWITCH', at: [0, 4], locked: true },
          { id: 'n', type: 'NOT', at: [6, 3], locked: true },
          { id: 'g', type: 'AND', at: [12, 0], locked: true },
          { id: 'Y', type: 'LIGHT', at: [19, 1], locked: true },
        ],
        wires: [
          ['A', 'g.in0'],
          ['B', 'n'],
          ['n', 'g.in1'],
          ['g', 'Y'],
        ],
      }),
    },
    {
      id: 'by-itself',
      kind: 'guided',
      starter: buildCircuit({ name: 'One row', parts: io(ABC, ['Y'], { outputX: 26 }) }),
      // Only row 010: (NOT A) AND B AND (NOT C).
      solution: buildCircuit({
        name: 'One row',
        parts: [
          ...io(ABC, ['Y'], { outputX: 26 }),
          { id: 'not-1', type: 'NOT', at: [6, -1] },
          { id: 'not-2', type: 'NOT', at: [6, 7] },
          { id: 'and-1', type: 'AND', at: [12, 0] },
          { id: 'and-2', type: 'AND', at: [19, 2] },
        ],
        wires: [
          ['A', 'not-1'],
          ['not-1', 'and-1.in0'],
          ['B', 'and-1.in1'],
          ['C', 'not-2'],
          ['and-1', 'and-2.in0'],
          ['not-2', 'and-2.in1'],
          ['and-2', 'Y'],
        ],
      }),
      spec: { inputs: ABC, outputs: ['Y'], expected: rowsFrom(3, onRows('010')) },
      palette: ['AND', 'OR', 'NOT'],
      showTarget: true,
    },
    {
      id: 'two-rows',
      kind: 'guided',
      starter: buildCircuit({ name: 'Two rows', parts: io(['A', 'B'], ['Y'], { outputX: 26 }) }),
      // Rows 00 and 11: ((NOT A) AND (NOT B)) OR (A AND B).
      solution: buildCircuit({
        name: 'Two rows',
        parts: [
          ...io(['A', 'B'], ['Y'], { outputX: 26 }),
          { id: 'not-1', type: 'NOT', at: [5, -3] },
          { id: 'not-2', type: 'NOT', at: [5, 7] },
          { id: 'and-1', type: 'AND', at: [12, -2] },
          { id: 'and-2', type: 'AND', at: [12, 4] },
          { id: 'or-1', type: 'OR', at: [19, 1] },
        ],
        wires: [
          ['A', 'not-1'],
          ['B', 'not-2'],
          ['not-1', 'and-1.in0'],
          ['not-2', 'and-1.in1'],
          ['A', 'and-2.in0'],
          ['B', 'and-2.in1'],
          ['and-1', 'or-1.in0'],
          ['and-2', 'or-1.in1'],
          ['or-1', 'Y'],
        ],
      }),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, onRows('00', '11')) },
      palette: ['AND', 'OR', 'NOT'],
      showTarget: true,
    },
    {
      id: 'any-table',
      kind: 'challenge',
      starter: buildCircuit({ name: 'Any table', parts: io(ABC, ['Y'], { outputX: 30 }) }),
      // Rows 001, 011 and 110. Rows 001 and 011 together are "(NOT A) AND C", so:
      // ((NOT A) AND C) OR (A AND B AND (NOT C)).
      solution: buildCircuit({
        name: 'Any table',
        parts: [
          ...io(ABC, ['Y'], { outputX: 30 }),
          { id: 'not-1', type: 'NOT', at: [6, -3] },
          { id: 'not-2', type: 'NOT', at: [6, 11] },
          { id: 'and-1', type: 'AND', at: [13, -2] },
          { id: 'and-2', type: 'AND', at: [8, 3] },
          { id: 'and-3', type: 'AND', at: [15, 6] },
          { id: 'or-1', type: 'OR', at: [23, 1] },
        ],
        wires: [
          ['A', 'not-1'],
          ['not-1', 'and-1.in0'],
          ['C', 'and-1.in1'],
          ['A', 'and-2.in0'],
          ['B', 'and-2.in1'],
          ['C', 'not-2'],
          ['and-2', 'and-3.in0'],
          ['not-2', 'and-3.in1'],
          ['and-1', 'or-1.in0'],
          ['and-3', 'or-1.in1'],
          ['or-1', 'Y'],
        ],
      }),
      spec: { inputs: ABC, outputs: ['Y'], expected: rowsFrom(3, onRows('001', '011', '110')) },
      palette: ['AND', 'OR', 'NOT'],
      showTarget: true,
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
  practice: [
    {
      // "A by itself" needs B off, too: A AND (NOT B).
      id: 'alone',
      kind: 'guided',
      starter: buildCircuit({ name: 'A by itself', parts: io(['A', 'B'], ['Y']) }),
      solution: buildCircuit({
        name: 'A by itself',
        parts: [
          ...io(['A', 'B'], ['Y']),
          { id: 'not-1', type: 'NOT', at: [6, 3] },
          { id: 'and-1', type: 'AND', at: [12, 0] },
        ],
        wires: [
          ['A', 'and-1.in0'],
          ['B', 'not-1'],
          ['not-1', 'and-1.in1'],
          ['and-1', 'Y'],
        ],
      }),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, bb) => b(a && !bb)) },
      palette: ['AND', 'OR', 'NOT'],
      for: ['ignores-input'],
      from: ['by-itself', 'two-rows', 'any-table'],
    },
  ],
};

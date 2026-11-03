/**
 * Lesson 3: OR and XOR.
 *
 * The steps, circuits and checks; the words are in en-US/<step-id>.md. The challenge
 * catches the classic mix-up (ICER '08): OR built where "exactly one" (XOR) was asked for,
 * which is wrong only on the row where both inputs are 1.
 */
import { buildCircuit, rowsFrom } from '../../../sim';
import type { LessonDef } from '../../types';
import { b, io } from '../helpers';

const twoToOne = (name: string) => buildCircuit({ name, parts: io(['A', 'B'], ['Y']) });

/** A 2-input gate example with locked switches A, B and light Y. */
const gateExample = (name: string, type: string) =>
  buildCircuit({
    name,
    parts: [
      { id: 'A', type: 'SWITCH', at: [0, 0], locked: true },
      { id: 'B', type: 'SWITCH', at: [0, 4], locked: true },
      { id: 'g', type, at: [7, 0], locked: true },
      { id: 'Y', type: 'LIGHT', at: [14, 1], locked: true },
    ],
    wires: [
      ['A', 'g.in0'],
      ['B', 'g.in1'],
      ['g', 'Y'],
    ],
  });

/** A solution: a 2-input gate between A, B and Y. */
const oneGate = (name: string, type: string, id: string) =>
  buildCircuit({
    name,
    parts: [...io(['A', 'B'], ['Y']), { id, type, at: [10, 0] }],
    wires: [
      ['A', `${id}.in0`],
      ['B', `${id}.in1`],
      [id, 'Y'],
    ],
  });

const xor = rowsFrom(2, (a, bb) => b(a !== bb));

export const orXorLesson: LessonDef = {
  id: 'or-xor',
  number: 3,
  unit: 1,
  introduces: ['OR', 'XOR'],
  standards: ['IB A1.2.4', 'IB A1.2.5'],
  steps: [
    { id: 'meet-or', kind: 'explain', example: gateExample('OR example', 'OR') },
    {
      id: 'build-or',
      kind: 'guided',
      starter: twoToOne('Build OR'),
      solution: oneGate('Build OR', 'OR', 'or-1'),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, bb) => b(a || bb)) },
      palette: ['AND', 'OR', 'NOT'],
    },
    { id: 'exclusive-or', kind: 'explain', example: gateExample('XOR example', 'XOR') },
    {
      id: 'build-xor',
      kind: 'guided',
      starter: twoToOne('Build XOR'),
      solution: oneGate('Build XOR', 'XOR', 'xor-1'),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: xor },
      palette: ['AND', 'OR', 'NOT', 'XOR'],
    },
    {
      id: 'table-to-circuit',
      kind: 'guided',
      starter: buildCircuit({ name: '(A AND B) OR C', parts: io(['A', 'B', 'C'], ['Y']) }),
      solution: buildCircuit({
        name: '(A AND B) OR C',
        parts: [
          ...io(['A', 'B', 'C'], ['Y']),
          { id: 'and-1', type: 'AND', at: [6, 0] },
          { id: 'or-1', type: 'OR', at: [13, 1] },
        ],
        wires: [
          ['A', 'and-1.in0'],
          ['B', 'and-1.in1'],
          ['and-1', 'or-1.in0'],
          ['C', 'or-1.in1'],
          ['or-1', 'Y'],
        ],
      }),
      spec: {
        inputs: ['A', 'B', 'C'],
        outputs: ['Y'],
        expected: rowsFrom(3, (a, bb, c) => b((a && bb) || c)),
      },
      palette: ['AND', 'OR', 'NOT'],
    },
    {
      id: 'exactly-one',
      kind: 'challenge',
      starter: twoToOne('Exactly one'),
      // (A OR B) AND NOT (A AND B), without an XOR gate.
      solution: buildCircuit({
        name: 'Exactly one',
        parts: [
          ...io(['A', 'B'], ['Y']),
          { id: 'or-1', type: 'OR', at: [5, 0] },
          { id: 'and-1', type: 'AND', at: [5, 5] },
          { id: 'not-1', type: 'NOT', at: [10, 6] },
          { id: 'and-2', type: 'AND', at: [15, 0] },
        ],
        wires: [
          ['A', 'or-1.in0'],
          ['B', 'or-1.in1'],
          ['A', 'and-1.in0'],
          ['B', 'and-1.in1'],
          ['and-1', 'not-1'],
          ['or-1', 'and-2.in0'],
          ['not-1', 'and-2.in1'],
          ['and-2', 'Y'],
        ],
      }),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: xor },
      palette: ['AND', 'OR', 'NOT'],
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
};

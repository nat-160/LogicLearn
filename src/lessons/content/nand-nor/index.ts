/**
 * Lesson 5: NAND and NOR.
 *
 * NAND is "not both" and NOR is "neither". The guided build catches the classic mix-up
 * (ICER '08): "not both" built as XOR ("exactly one"), which differs only when both inputs
 * are 0. Then the "only NAND" steps show that NAND alone can make any other gate.
 */
import { buildCircuit, rowsFrom } from '../../../sim';
import type { LessonDef } from '../../types';
import { b, gateExample, io, twoGates } from '../helpers';

const ONLY_NAND = { allowedTypes: ['NAND'] };

export const nandNorLesson: LessonDef = {
  id: 'nand-nor',
  number: 5,
  unit: 2,
  introduces: ['NAND', 'NOR'],
  standards: ['IB A1.2.3', 'IB A1.2.4'],
  steps: [
    { id: 'not-both', kind: 'explain', example: gateExample('NAND example', 'NAND') },
    {
      id: 'build-not-both',
      kind: 'guided',
      starter: buildCircuit({ name: 'Not both', parts: io(['A', 'B'], ['Y']) }),
      // NAND = NOT (A AND B): built from the gates students already know.
      solution: buildCircuit({
        name: 'Not both',
        parts: [
          ...io(['A', 'B'], ['Y']),
          { id: 'and-1', type: 'AND', at: [7, 0] },
          { id: 'not-1', type: 'NOT', at: [13, 1] },
        ],
        wires: [
          ['A', 'and-1.in0'],
          ['B', 'and-1.in1'],
          ['and-1', 'not-1'],
          ['not-1', 'Y'],
        ],
      }),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (x, y) => b(!(x && y))) },
      palette: ['AND', 'OR', 'NOT', 'XOR'],
    },
    {
      id: 'nand-not',
      kind: 'guided',
      starter: buildCircuit({ name: 'NOT from NAND', parts: io(['A'], ['Y']) }),
      // Both NAND inputs on A: NOT (A AND A) = NOT A.
      solution: buildCircuit({
        name: 'NOT from NAND',
        parts: [...io(['A'], ['Y']), { id: 'nand-1', type: 'NAND', at: [10, 0] }],
        wires: [
          ['A', 'nand-1.in0'],
          ['A', 'nand-1.in1'],
          ['nand-1', 'Y'],
        ],
      }),
      spec: {
        inputs: ['A'],
        outputs: ['Y'],
        expected: rowsFrom(1, (a) => b(!a)),
        constraints: ONLY_NAND,
      },
      palette: ['NAND'],
    },
    {
      id: 'nand-and-or',
      kind: 'guided',
      starter: buildCircuit({
        name: 'AND and OR from NAND',
        parts: io(['A', 'B'], ['X', 'Y'], { outputX: 26 }),
      }),
      // X = A AND B = NOT (A NAND B); Y = A OR B = (NOT A) NAND (NOT B).
      solution: buildCircuit({
        name: 'AND and OR from NAND',
        parts: [
          ...io(['A', 'B'], ['X', 'Y'], { outputX: 26 }),
          { id: 'nand-1', type: 'NAND', at: [8, -2] },
          { id: 'nand-2', type: 'NAND', at: [16, -1] },
          { id: 'nand-3', type: 'NAND', at: [8, 4] },
          { id: 'nand-4', type: 'NAND', at: [8, 8] },
          { id: 'nand-5', type: 'NAND', at: [16, 5] },
        ],
        wires: [
          ['A', 'nand-1.in0'],
          ['B', 'nand-1.in1'],
          ['nand-1', 'nand-2.in0'],
          ['nand-1', 'nand-2.in1'],
          ['nand-2', 'X'],
          ['A', 'nand-3.in0'],
          ['A', 'nand-3.in1'],
          ['B', 'nand-4.in0'],
          ['B', 'nand-4.in1'],
          ['nand-3', 'nand-5.in0'],
          ['nand-4', 'nand-5.in1'],
          ['nand-5', 'Y'],
        ],
      }),
      spec: {
        inputs: ['A', 'B'],
        outputs: ['X', 'Y'],
        expected: rowsFrom(2, (x, y) => [b(x && y), b(x || y)]),
        constraints: ONLY_NAND,
      },
      palette: ['NAND'],
    },
    {
      id: 'neither',
      kind: 'challenge',
      starter: buildCircuit({ name: 'Neither', parts: io(['A', 'B'], ['Y'], { outputX: 26 }) }),
      // NOR = NOT (A OR B): OR from NANDs as before, then one more NAND as a NOT.
      solution: buildCircuit({
        name: 'Neither',
        parts: [
          ...io(['A', 'B'], ['Y'], { outputX: 26 }),
          { id: 'nand-1', type: 'NAND', at: [6, -1] },
          { id: 'nand-2', type: 'NAND', at: [6, 5] },
          { id: 'nand-3', type: 'NAND', at: [12, 1] },
          { id: 'nand-4', type: 'NAND', at: [19, 1] },
        ],
        wires: [
          ['A', 'nand-1.in0'],
          ['A', 'nand-1.in1'],
          ['B', 'nand-2.in0'],
          ['B', 'nand-2.in1'],
          ['nand-1', 'nand-3.in0'],
          ['nand-2', 'nand-3.in1'],
          ['nand-3', 'nand-4.in0'],
          ['nand-3', 'nand-4.in1'],
          ['nand-4', 'Y'],
        ],
      }),
      spec: {
        inputs: ['A', 'B'],
        outputs: ['Y'],
        expected: rowsFrom(2, (x, y) => b(!(x || y))),
        constraints: ONLY_NAND,
      },
      palette: ['NAND'],
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
  practice: [
    {
      // NAND ("not both") and XOR ("exactly one") differ only when both inputs are 0.
      id: 'neither-on',
      kind: 'predict',
      level: 'guided',
      circuits: [twoGates('NAND and XOR', 'NAND', 'XOR')],
      for: ['not-both-as-xor'],
      from: ['build-not-both'],
    },
  ],
};

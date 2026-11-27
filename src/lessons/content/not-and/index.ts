/**
 * Lesson 2: NOT and AND (the Phase 1 demo lesson).
 *
 * This file holds what is the same in every language: the steps, circuits, checks and
 * parts lists. The words – titles, step text and hints – are in the language folders next
 * to it (en-US/<step-id>.md). lessons.test.ts proves every reference solution passes its
 * check and every starter circuit does not.
 */
import { buildCircuit, rowsFrom } from '../../../sim';
import type { LessonDef } from '../../types';
import { b, io } from '../helpers';

export const notAndLesson: LessonDef = {
  id: 'not-and',
  number: 2,
  unit: 1,
  introduces: ['NOT', 'AND'],
  standards: ['IB A1.2.3', 'IB A1.2.4'],
  steps: [
    {
      id: 'what-is-a-gate',
      kind: 'explain',
      example: buildCircuit({
        name: 'NOT example',
        parts: [
          { id: 'A', type: 'SWITCH', at: [0, 0], locked: true },
          { id: 'n', type: 'NOT', at: [6, 0], locked: true },
          { id: 'Y', type: 'LIGHT', at: [12, 0], locked: true },
        ],
        wires: [
          ['A', 'n'],
          ['n', 'Y'],
        ],
      }),
    },
    {
      id: 'build-not',
      kind: 'guided',
      starter: buildCircuit({ name: 'Build NOT', parts: io(['A'], ['Y']) }),
      solution: buildCircuit({
        name: 'Build NOT',
        parts: [...io(['A'], ['Y']), { id: 'n', type: 'NOT', at: [10, 0] }],
        wires: [
          ['A', 'n'],
          ['n', 'Y'],
        ],
      }),
      spec: { inputs: ['A'], outputs: ['Y'], expected: rowsFrom(1, (a) => b(!a)) },
      palette: ['NOT'],
    },
    {
      id: 'meet-and',
      kind: 'explain',
      example: buildCircuit({
        name: 'AND example',
        parts: [
          { id: 'A', type: 'SWITCH', at: [0, 0], locked: true },
          { id: 'B', type: 'SWITCH', at: [0, 4], locked: true },
          { id: 'g', type: 'AND', at: [7, 0], locked: true },
          { id: 'Y', type: 'LIGHT', at: [14, 1], locked: true },
        ],
        wires: [
          ['A', 'g.in0'],
          ['B', 'g.in1'],
          ['g', 'Y'],
        ],
      }),
    },
    {
      id: 'build-and',
      kind: 'guided',
      starter: buildCircuit({ name: 'Build AND', parts: io(['A', 'B'], ['Y']) }),
      solution: buildCircuit({
        name: 'Build AND',
        parts: [...io(['A', 'B'], ['Y']), { id: 'g', type: 'AND', at: [10, 0] }],
        wires: [
          ['A', 'g.in0'],
          ['B', 'g.in1'],
          ['g', 'Y'],
        ],
      }),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (x, y) => b(x && y)) },
      palette: ['AND', 'OR', 'NOT'],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      starter: buildCircuit({ name: 'Challenge', parts: io(['A', 'B'], ['Y']) }),
      solution: buildCircuit({
        name: 'Challenge',
        parts: [
          ...io(['A', 'B'], ['Y']),
          { id: 'n', type: 'NOT', at: [6, 4] },
          { id: 'g', type: 'AND', at: [12, 0] },
        ],
        wires: [
          ['A', 'g.in0'],
          ['B', 'n'],
          ['n', 'g.in1'],
          ['g', 'Y'],
        ],
      }),
      spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (x, y) => b(x && !y)) },
      palette: ['AND', 'OR', 'NOT'],
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
};

/**
 * Lesson 1: Signals – on/off, 0/1.
 *
 * The steps, circuits and checks; the words are in en-US/<step-id>.md.
 */
import { buildCircuit, rowsFrom } from '../../../sim';
import type { LessonDef } from '../../types';
import { b, io } from '../helpers';

export const signalsLesson: LessonDef = {
  id: 'signals',
  number: 1,
  unit: 1,
  standards: ['IB A1.2.3'],
  steps: [
    {
      id: 'on-and-off',
      kind: 'explain',
      example: buildCircuit({
        name: 'A switch and a light',
        parts: io(['A'], ['Y']),
        wires: [['A', 'Y']],
      }),
    },
    {
      id: 'unknown-x',
      kind: 'explain',
      example: buildCircuit({
        name: 'A light with no wire',
        parts: io(['A'], ['Y', 'Z']),
        wires: [['A', 'Y']],
      }),
    },
    {
      id: 'label-and-wire',
      kind: 'guided',
      // The lights aren't locked, so they can be relabelled.
      starter: buildCircuit({
        name: 'Label and wire',
        parts: [
          ...io(['A', 'B'], []),
          { id: 'light-1', type: 'LIGHT', label: 'L1', at: [20, 0] },
          { id: 'light-2', type: 'LIGHT', label: 'L2', at: [20, 4] },
        ],
      }),
      solution: buildCircuit({
        name: 'Label and wire',
        parts: [
          ...io(['A', 'B'], []),
          { id: 'light-1', type: 'LIGHT', label: 'Y', at: [20, 0] },
          { id: 'light-2', type: 'LIGHT', label: 'Z', at: [20, 4] },
        ],
        wires: [
          ['A', 'light-1'],
          ['B', 'light-2'],
        ],
      }),
      spec: {
        inputs: ['A', 'B'],
        outputs: ['Y', 'Z'],
        expected: rowsFrom(2, (a, bb) => [b(a), b(bb)]),
      },
      palette: [],
    },
    {
      id: 'fan-out',
      kind: 'challenge',
      starter: buildCircuit({ name: 'One switch, two lights', parts: io(['A'], ['Y', 'Z']) }),
      solution: buildCircuit({
        name: 'One switch, two lights',
        parts: io(['A'], ['Y', 'Z']),
        wires: [
          ['A', 'Y'],
          ['A', 'Z'],
        ],
      }),
      spec: { inputs: ['A'], outputs: ['Y', 'Z'], expected: rowsFrom(1, (a) => [b(a), b(a)]) },
      palette: [],
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
};

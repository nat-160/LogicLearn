/**
 * Lesson 0: Editor tour (optional – always open, never required).
 *
 * The steps, circuits and checks; the words are in en-US/<step-id>.md.
 */
import { buildCircuit, rowsFrom } from '../../../sim';
import type { LessonDef } from '../../types';
import { b, io } from '../helpers';

const ySameAsA = { inputs: ['A'], outputs: ['Y'], expected: rowsFrom(1, (a) => b(a)) };

export const editorTourLesson: LessonDef = {
  id: 'editor-tour',
  number: 0,
  unit: 1,
  optional: true,
  standards: [],
  steps: [
    {
      id: 'the-editor',
      kind: 'explain',
      example: buildCircuit({
        name: 'Tour example',
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
      id: 'add-and-connect',
      kind: 'guided',
      starter: buildCircuit({ name: 'Add and connect', parts: [] }),
      solution: buildCircuit({
        name: 'Add and connect',
        parts: [
          { id: 'switch-1', type: 'SWITCH', label: 'A', at: [0, 0] },
          { id: 'light-1', type: 'LIGHT', label: 'Y', at: [10, 0] },
        ],
        wires: [['switch-1', 'light-1']],
      }),
      spec: ySameAsA,
      palette: ['SWITCH', 'LIGHT'],
    },
    {
      id: 'fix-it',
      kind: 'guided',
      starter: buildCircuit({
        name: 'Fix it',
        parts: [...io(['A'], ['Y']), { id: 'not-1', type: 'NOT', at: [10, 0] }],
        wires: [
          ['A', 'not-1'],
          ['not-1', 'Y'],
        ],
      }),
      solution: buildCircuit({
        name: 'Fix it',
        parts: io(['A'], ['Y']),
        wires: [['A', 'Y']],
      }),
      spec: { ...ySameAsA, constraints: { maxGates: 0 } },
      palette: [],
    },
  ],
};

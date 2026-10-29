/**
 * Lesson 2: NOT and AND (the Phase 1 demo lesson).
 *
 * The text for each step is in the .md files in this folder. This file holds what the
 * computer needs: the circuits, the checks and the hints. lessons.test.ts proves every
 * reference solution passes its check and every starter circuit does not.
 */
import { buildCircuit, rowsFrom, type Bit } from '../../../sim';
import type { Lesson } from '../../types';
import whatIsAGate from './1-what-is-a-gate.md?raw';
import buildNot from './2-build-not.md?raw';
import meetAnd from './3-meet-and.md?raw';
import buildAnd from './4-build-and.md?raw';
import challenge from './5-challenge.md?raw';

const b = (v: boolean | number): Bit => (v ? 1 : 0);

/**
 * Locked switches (left) and lights (right) that every build step starts with, placed so
 * their pins line up with a 2-input gate's pins (inputs 40px apart, output in between).
 */
const io = (inputs: string[], outputs: string[]) => [
  ...inputs.map((id, i) => ({
    id,
    type: 'SWITCH',
    at: [0, i * 4] as [number, number],
    locked: true,
  })),
  ...outputs.map((id, i) => ({
    id,
    type: 'LIGHT',
    at: [20, (inputs.length === 1 ? 0 : 1) + i * 4] as [number, number],
    locked: true,
  })),
];

export const notAndLesson: Lesson = {
  id: 'not-and',
  number: 2,
  title: 'NOT and AND',
  summary: 'Meet your first two gates, and learn to test every row of a truth table.',
  standards: ['IB A1.2.3', 'IB A1.2.4'],
  steps: [
    {
      id: 'what-is-a-gate',
      kind: 'explain',
      title: 'What is a logic gate?',
      prose: whatIsAGate,
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
      title: 'Build it: NOT',
      prose: buildNot,
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
      hints: [
        'Tap NOT in the parts list to add a NOT gate.',
        "Connect A's output (the dot on its right) to the NOT gate's input (the dot on its left).",
        "Then connect the NOT gate's output to light Y.",
      ],
    },
    {
      id: 'meet-and',
      kind: 'explain',
      title: 'AND: all inputs must be on',
      prose: meetAnd,
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
      title: 'Build it: AND',
      prose: buildAnd,
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
      hints: [
        'Which gate is on only when ALL of its inputs are on?',
        'Add an AND gate, then wire A and B to its two inputs and its output to Y.',
      ],
    },
    {
      id: 'challenge',
      kind: 'challenge',
      title: 'Challenge: on, but not that one',
      prose: challenge,
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
      hints: [
        '"B is off" is the same as "NOT B is on".',
        'Y should be on when A is on AND (NOT B) is on.',
      ],
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
};

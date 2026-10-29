/**
 * Practice targets for the sandbox's "Check" panel: a few classic tasks, including the
 * ones students most often get wrong (Herman et al., ICER '08). Lessons define their own
 * targets; these let anyone try the checker without starting a lesson.
 */
import { rowsFrom, type Bit, type CheckSpec } from '../sim';

export interface Target {
  id: string;
  name: string;
  /** The task in words, as a student would read it. */
  task: string;
  spec: CheckSpec;
}

const b = (v: boolean | number): Bit => (v ? 1 : 0);

export const TARGETS: Target[] = [
  {
    id: 'xor',
    name: 'One or the other, not both',
    task: 'Light Y when exactly one of the switches A and B is on.',
    spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, c) => b(a !== c)) },
  },
  {
    id: 'not-both',
    name: 'Not both',
    task: 'Light Y unless switches A and B are BOTH on.',
    spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, c) => b(!(a && c))) },
  },
  {
    id: 'iff',
    name: 'If and only if',
    task: 'Light Y exactly when switches A and B match.',
    spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, c) => b(a === c)) },
  },
  {
    id: 'if-then',
    name: 'If A then B',
    task: 'Light Y unless the rule "if A is on, then B is on" is broken.',
    spec: { inputs: ['A', 'B'], outputs: ['Y'], expected: rowsFrom(2, (a, c) => b(!a || c)) },
  },
  {
    id: 'majority',
    name: 'Majority vote',
    task: 'Light Y when at least two of the switches A, B and C are on.',
    spec: {
      inputs: ['A', 'B', 'C'],
      outputs: ['Y'],
      expected: rowsFrom(3, (a, c, d) => b(a + c + d >= 2)),
    },
  },
  {
    id: 'half-adder',
    name: 'Half adder',
    task: 'Add the bits A and B: S is the sum bit and C is the carry bit.',
    spec: {
      inputs: ['A', 'B'],
      outputs: ['C', 'S'],
      expected: rowsFrom(2, (a, c) => [b(a && c), b(a !== c)]),
    },
  },
];

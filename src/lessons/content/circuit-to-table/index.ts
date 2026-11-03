/**
 * Lesson 4: From circuit to truth table.
 *
 * Mostly predict steps: the student writes a circuit's whole truth table before the
 * circuit shows its values. The words are in en-US/<step-id>.md.
 */
import { buildCircuit, type CircuitDoc } from '../../../sim';
import type { LessonDef } from '../../types';

type Part = { id: string; type: string; at: [number, number] };

/** A circuit where every part is locked: something to explore or predict, not edit. */
const fixed = (name: string, parts: Part[], wires: [string, string][]): CircuitDoc =>
  buildCircuit({ name, parts: parts.map((p) => ({ ...p, locked: true })), wires });

const switches = (labels: string[]): Part[] =>
  labels.map((id, i) => ({ id, type: 'SWITCH', at: [0, i * 4] }));

/** (A AND B) OR C – the example, and the shape of the challenge circuits. */
const andOr = fixed(
  '(A AND B) OR C',
  [
    ...switches(['A', 'B', 'C']),
    { id: 'and-1', type: 'AND', at: [6, 0] },
    { id: 'or-1', type: 'OR', at: [13, 1] },
    { id: 'Y', type: 'LIGHT', at: [20, 2] },
  ],
  [
    ['A', 'and-1.in0'],
    ['B', 'and-1.in1'],
    ['and-1', 'or-1.in0'],
    ['C', 'or-1.in1'],
    ['or-1', 'Y'],
  ],
);

export const circuitToTableLesson: LessonDef = {
  id: 'circuit-to-table',
  number: 4,
  unit: 1,
  standards: ['IB A1.2.4'],
  steps: [
    { id: 'count-the-rows', kind: 'explain', example: andOr },
    {
      id: 'predict-two',
      kind: 'predict',
      level: 'guided',
      // Y = (NOT A) AND B
      circuits: [
        fixed(
          '(NOT A) AND B',
          [
            ...switches(['A', 'B']),
            { id: 'not-1', type: 'NOT', at: [5, 0] },
            { id: 'and-1', type: 'AND', at: [10, 0] },
            { id: 'Y', type: 'LIGHT', at: [17, 1] },
          ],
          [
            ['A', 'not-1'],
            ['not-1', 'and-1.in0'],
            ['B', 'and-1.in1'],
            ['and-1', 'Y'],
          ],
        ),
      ],
    },
    {
      id: 'find-the-row',
      kind: 'predict',
      level: 'guided',
      // Y = A AND (NOT B) AND C: on in exactly one row.
      circuits: [
        fixed(
          'A AND NOT B AND C',
          [
            ...switches(['A', 'B', 'C']),
            { id: 'not-1', type: 'NOT', at: [5, 4] },
            { id: 'and-1', type: 'AND', at: [10, 0] },
            { id: 'and-2', type: 'AND', at: [16, 1] },
            { id: 'Y', type: 'LIGHT', at: [22, 2] },
          ],
          [
            ['A', 'and-1.in0'],
            ['B', 'not-1'],
            ['not-1', 'and-1.in1'],
            ['and-1', 'and-2.in0'],
            ['C', 'and-2.in1'],
            ['and-2', 'Y'],
          ],
        ),
      ],
    },
    {
      id: 'challenge',
      kind: 'predict',
      level: 'challenge',
      circuits: [
        // (A OR B) AND NOT C
        fixed(
          '(A OR B) AND NOT C',
          [
            ...switches(['A', 'B', 'C']),
            { id: 'or-1', type: 'OR', at: [6, 0] },
            { id: 'not-1', type: 'NOT', at: [6, 7] },
            { id: 'and-1', type: 'AND', at: [13, 1] },
            { id: 'Y', type: 'LIGHT', at: [20, 2] },
          ],
          [
            ['A', 'or-1.in0'],
            ['B', 'or-1.in1'],
            ['C', 'not-1'],
            ['or-1', 'and-1.in0'],
            ['not-1', 'and-1.in1'],
            ['and-1', 'Y'],
          ],
        ),
        // (A AND B) OR NOT C
        fixed(
          '(A AND B) OR NOT C',
          [
            ...switches(['A', 'B', 'C']),
            { id: 'and-1', type: 'AND', at: [6, 0] },
            { id: 'not-1', type: 'NOT', at: [6, 7] },
            { id: 'or-1', type: 'OR', at: [13, 1] },
            { id: 'Y', type: 'LIGHT', at: [20, 2] },
          ],
          [
            ['A', 'and-1.in0'],
            ['B', 'and-1.in1'],
            ['C', 'not-1'],
            ['and-1', 'or-1.in0'],
            ['not-1', 'or-1.in1'],
            ['or-1', 'Y'],
          ],
        ),
        // NOT (A OR B) OR (B AND C)
        fixed(
          'NOT (A OR B) OR (B AND C)',
          [
            ...switches(['A', 'B', 'C']),
            { id: 'nor-1', type: 'NOR', at: [6, 0] },
            { id: 'and-1', type: 'AND', at: [6, 5] },
            { id: 'or-1', type: 'OR', at: [13, 1] },
            { id: 'Y', type: 'LIGHT', at: [20, 2] },
          ],
          [
            ['A', 'nor-1.in0'],
            ['B', 'nor-1.in1'],
            ['B', 'and-1.in0'],
            ['C', 'and-1.in1'],
            ['nor-1', 'or-1.in0'],
            ['and-1', 'or-1.in1'],
            ['or-1', 'Y'],
          ],
        ),
      ],
    },
  ],
};

/**
 * The Unit 2 project: drive a seven-segment display, so two switches show a number 0–3.
 *
 * Here the rule is fixed: each digit lights its usual segments (DIGIT_SEGMENTS in
 * src/sim/components.ts). The student works out one column per segment – each is a small
 * truth table of its own – and builds it. The example needs 6 gates.
 */
import {
  allInputRows,
  buildCircuit,
  DIGIT_SEGMENTS,
  rowNumber,
  SEGMENTS,
  type CheckRow,
} from '../../../sim';
import type { LessonDef } from '../../types';

/** Rows A, B = 00 … 11 show the digits 0 … 3 (A is the "twos" bit). */
const DIGITS: CheckRow[] = allInputRows(2).map((inputs) => ({
  inputs,
  outputs: SEGMENTS.map((s) => (DIGIT_SEGMENTS[rowNumber(inputs)].includes(s) ? 1 : 0)),
}));

const parts = [
  { id: 'A', type: 'SWITCH', at: [0, 0] as [number, number], locked: true },
  { id: 'B', type: 'SWITCH', at: [0, 8] as [number, number], locked: true },
  { id: 'D', type: 'SEVEN_SEG', at: [26, -3] as [number, number], locked: true },
];

const PALETTE = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR'];

export const unit2ProjectLesson: LessonDef = {
  id: 'unit-2-project',
  number: 8.5, // after Lesson 8 in the list; shown as "Unit 2 project"
  unit: 2,
  kind: 'project',
  standards: ['CSTA 3B-CS-02'],
  steps: [
    { id: 'brief', kind: 'explain' },
    {
      id: 'build',
      kind: 'project',
      briefs: [
        {
          id: 'digits',
          starter: buildCircuit({ name: 'Number display', parts }),
          palette: PALETTE,
          inputs: ['A', 'B'],
          outputs: SEGMENTS.map((s) => `D.${s}`),
          rule: { kind: 'fixed', rows: DIGITS },
          criteria: [{ kind: 'matches-rule' }],
          example: {
            rule: DIGITS,
            // a = d = A OR (NOT B); b = A OR (NOT A) (always on); c = (NOT A) OR B;
            // e = NOT B; f = A NOR B; g = A.
            solution: buildCircuit({
              name: 'Number display',
              parts: [
                ...parts,
                { id: 'not-1', type: 'NOT', at: [6, 11] },
                { id: 'not-2', type: 'NOT', at: [6, -3] },
                { id: 'or-1', type: 'OR', at: [14, -4] },
                { id: 'or-2', type: 'OR', at: [14, 1] },
                { id: 'or-3', type: 'OR', at: [14, 6] },
                { id: 'nor-1', type: 'NOR', at: [14, 13] },
              ],
              wires: [
                ['B', 'not-1'],
                ['A', 'not-2'],
                ['A', 'or-1.in0'],
                ['not-1', 'or-1.in1'],
                ['or-1', 'D.a'],
                ['or-1', 'D.d'],
                ['A', 'or-2.in0'],
                ['not-2', 'or-2.in1'],
                ['or-2', 'D.b'],
                ['not-2', 'or-3.in0'],
                ['B', 'or-3.in1'],
                ['or-3', 'D.c'],
                ['not-1', 'D.e'],
                ['A', 'nor-1.in0'],
                ['B', 'nor-1.in1'],
                ['nor-1', 'D.f'],
                ['A', 'D.g'],
              ],
            }),
          },
        },
      ],
    },
  ],
};

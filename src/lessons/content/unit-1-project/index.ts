/**
 * The Unit 1 project: design a circuit for a real job, choosing one of two briefs.
 *
 * Each brief fixes some rows of the truth table and leaves the rest to the student, who
 * writes their own rule and then builds it. The grader (src/sim/grader.ts) checks the
 * circuit against the student's rule and the brief's checklist. `example` is one finished
 * rule and circuit, used by the content tests (and later the teacher's answer key).
 */
import { buildCircuit, type Bit, type CheckRow, type Criterion } from '../../../sim';
import type { LessonDef } from '../../types';

/** Truth-table rows from "inputs → output" strings, e.g. row('011', 1). */
const row = (inputs: string, output: Bit): CheckRow => ({
  inputs: [...inputs].map((c) => (c === '1' ? 1 : 0)),
  outputs: [output],
});

/** The same checklist for both briefs. */
const CRITERIA: Criterion[] = [
  { kind: 'rule-keeps-rows', rows: [] }, // rows filled in per brief below
  { kind: 'rule-uses-every-input' },
  { kind: 'matches-rule' },
  { kind: 'outputs-use-every-input' },
  { kind: 'min-gates', count: 2 },
];
const criteria = (given: CheckRow[]): Criterion[] =>
  CRITERIA.map((c) => (c.kind === 'rule-keeps-rows' ? { ...c, rows: given } : c));

// --- Door alarm ------------------------------------------------------------------------
// D = door open, P = panic button (held down), R = alarm set ("ready"); L = alarm light.
// Rows are in label order: D, P, R. The open question for the student: does the panic
// button work when the alarm is not set (rows 010 and 110)?
const DOOR_GIVEN = [
  row('000', 0),
  row('001', 0), // alarm set, door shut: quiet
  row('100', 0), // door open, alarm not set: quiet
  row('101', 1), // alarm set and the door opens: alarm
  row('011', 1), // panic while the alarm is set: alarm
  row('111', 1),
];

const doorParts = [
  { id: 'D', type: 'SWITCH', at: [0, 0] as [number, number], locked: true },
  { id: 'P', type: 'PUSH_BUTTON', at: [0, 5] as [number, number], locked: true },
  { id: 'R', type: 'SWITCH', at: [0, 10] as [number, number], locked: true },
  {
    id: 'L',
    type: 'LIGHT',
    at: [24, 5] as [number, number],
    locked: true,
    props: { color: 'red' },
  },
];

// --- Voting machine ----------------------------------------------------------------------
// Three judges A, B, C vote yes (1) or no (0); Y lights when the vote passes. Only the
// unanimous rows are given: the student decides what "passes" means.
const VOTE_GIVEN = [row('000', 0), row('111', 1)];

const voteParts = [
  { id: 'A', type: 'SWITCH', at: [0, 0] as [number, number], locked: true },
  { id: 'B', type: 'SWITCH', at: [0, 5] as [number, number], locked: true },
  { id: 'C', type: 'SWITCH', at: [0, 10] as [number, number], locked: true },
  {
    id: 'Y',
    type: 'LIGHT',
    at: [24, 5] as [number, number],
    locked: true,
    props: { color: 'green' },
  },
];

const PALETTE = ['AND', 'OR', 'NOT', 'XOR'];

export const unit1ProjectLesson: LessonDef = {
  id: 'unit-1-project',
  number: 4.5, // after Lesson 4 in the list; shown as "Unit 1 project"
  unit: 1,
  kind: 'project',
  standards: ['CSTA 3B-CS-02'],
  steps: [
    { id: 'brief', kind: 'explain' },
    {
      id: 'build',
      kind: 'project',
      briefs: [
        {
          id: 'door-alarm',
          starter: buildCircuit({ name: 'Door alarm', parts: doorParts }),
          palette: PALETTE,
          inputs: ['D', 'P', 'R'],
          outputs: ['L'],
          rule: { kind: 'student', given: DOOR_GIVEN },
          criteria: criteria(DOOR_GIVEN),
          example: {
            // Panic always works: L = P OR (D AND R).
            rule: [
              row('000', 0),
              row('001', 0),
              row('010', 1),
              row('011', 1),
              row('100', 0),
              row('101', 1),
              row('110', 1),
              row('111', 1),
            ],
            solution: buildCircuit({
              name: 'Door alarm',
              parts: [
                ...doorParts,
                { id: 'g1', type: 'AND', at: [8, 0] },
                { id: 'g2', type: 'OR', at: [16, 4] },
              ],
              wires: [
                ['D', 'g1.in0'],
                ['R', 'g1.in1'],
                ['g1', 'g2.in0'],
                ['P', 'g2.in1'],
                ['g2', 'L'],
              ],
            }),
          },
        },
        {
          id: 'voting',
          starter: buildCircuit({ name: 'Voting machine', parts: voteParts }),
          palette: PALETTE,
          inputs: ['A', 'B', 'C'],
          outputs: ['Y'],
          rule: { kind: 'student', given: VOTE_GIVEN },
          criteria: criteria(VOTE_GIVEN),
          example: {
            // Majority: (A AND B) OR (C AND (A OR B)).
            rule: [
              row('000', 0),
              row('001', 0),
              row('010', 0),
              row('011', 1),
              row('100', 0),
              row('101', 1),
              row('110', 1),
              row('111', 1),
            ],
            solution: buildCircuit({
              name: 'Voting machine',
              parts: [
                ...voteParts,
                { id: 'g1', type: 'AND', at: [8, 0] },
                { id: 'g2', type: 'OR', at: [8, 6] },
                { id: 'g3', type: 'AND', at: [13, 8] },
                { id: 'g4', type: 'OR', at: [18, 4] },
              ],
              wires: [
                ['A', 'g1.in0'],
                ['B', 'g1.in1'],
                ['A', 'g2.in0'],
                ['B', 'g2.in1'],
                ['g2', 'g3.in0'],
                ['C', 'g3.in1'],
                ['g1', 'g4.in0'],
                ['g3', 'g4.in1'],
                ['g4', 'Y'],
              ],
            }),
          },
        },
      ],
    },
  ],
};

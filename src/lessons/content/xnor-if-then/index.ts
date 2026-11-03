/**
 * Lesson 6: XNOR, "if … then", and turning English rules into logic.
 *
 * The heaviest lesson (ICER '08): students read XNOR ("the inputs match") as AND, and
 * "if A then B" as AND – forgetting that a false "if" never breaks the rule. The word
 * problems list their `rules`, so the checker can say which rule a mistake is in; the
 * lesson tests check that the rules make exactly the expected rows.
 */
import { buildCircuit, rowsFromRules, type RulePart } from '../../../sim';
import type { LessonDef } from '../../types';
import { gateExample, io } from '../helpers';

const IF_THEN: RulePart[] = [{ fn: 'IMPLY', inputs: ['A', 'B'] }];

/** Two rules: "if A then B", and "not both B and C". */
const TWO_RULES: RulePart[] = [
  { fn: 'IMPLY', inputs: ['A', 'B'] },
  { fn: 'NAND', inputs: ['B', 'C'] },
];

/** Three rules: "if A then C", "B and C match", "not both A and B" (Y = 1 on 000 and 011). */
const THREE_RULES: RulePart[] = [
  { fn: 'IMPLY', inputs: ['A', 'C'] },
  { fn: 'XNOR', inputs: ['B', 'C'] },
  { fn: 'NAND', inputs: ['A', 'B'] },
];

const ABC = ['A', 'B', 'C'];
const PALETTE = ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR'];

export const xnorIfThenLesson: LessonDef = {
  id: 'xnor-if-then',
  number: 6,
  unit: 2,
  introduces: ['XNOR'],
  standards: ['IB A1.2.3', 'IB A1.2.4', 'IB A1.2.5'],
  steps: [
    { id: 'match', kind: 'explain', example: gateExample('XNOR example', 'XNOR') },
    {
      id: 'if-then',
      kind: 'explain',
      // "If A then B" = (NOT A) OR B.
      example: buildCircuit({
        name: 'If A then B',
        parts: [
          { id: 'A', type: 'SWITCH', at: [0, 0], locked: true },
          { id: 'B', type: 'SWITCH', at: [0, 4], locked: true },
          { id: 'n', type: 'NOT', at: [6, -1], locked: true },
          { id: 'g', type: 'OR', at: [12, 0], locked: true },
          { id: 'Y', type: 'LIGHT', at: [19, 1], locked: true },
        ],
        wires: [
          ['A', 'n'],
          ['n', 'g.in0'],
          ['B', 'g.in1'],
          ['g', 'Y'],
        ],
      }),
    },
    {
      id: 'build-if-then',
      kind: 'guided',
      starter: buildCircuit({ name: 'If A then B', parts: io(['A', 'B'], ['Y']) }),
      solution: buildCircuit({
        name: 'If A then B',
        parts: [
          ...io(['A', 'B'], ['Y']),
          { id: 'not-1', type: 'NOT', at: [6, -1] },
          { id: 'or-1', type: 'OR', at: [12, 0] },
        ],
        wires: [
          ['A', 'not-1'],
          ['not-1', 'or-1.in0'],
          ['B', 'or-1.in1'],
          ['or-1', 'Y'],
        ],
      }),
      spec: {
        inputs: ['A', 'B'],
        outputs: ['Y'],
        expected: rowsFromRules(['A', 'B'], IF_THEN),
        rules: IF_THEN,
      },
      palette: ['AND', 'OR', 'NOT', 'XOR'],
    },
    {
      id: 'two-rules',
      kind: 'guided',
      starter: buildCircuit({ name: 'Two rules', parts: io(ABC, ['Y'], { outputX: 28 }) }),
      // Each rule on its own, then AND them: ((NOT A) OR B) AND (B NAND C).
      solution: buildCircuit({
        name: 'Two rules',
        parts: [
          ...io(ABC, ['Y'], { outputX: 28 }),
          { id: 'not-1', type: 'NOT', at: [6, -1] },
          { id: 'or-1', type: 'OR', at: [12, 0] },
          { id: 'nand-1', type: 'NAND', at: [12, 6] },
          { id: 'and-1', type: 'AND', at: [20, 2] },
        ],
        wires: [
          ['A', 'not-1'],
          ['not-1', 'or-1.in0'],
          ['B', 'or-1.in1'],
          ['B', 'nand-1.in0'],
          ['C', 'nand-1.in1'],
          ['or-1', 'and-1.in0'],
          ['nand-1', 'and-1.in1'],
          ['and-1', 'Y'],
        ],
      }),
      spec: {
        inputs: ABC,
        outputs: ['Y'],
        expected: rowsFromRules(ABC, TWO_RULES),
        rules: TWO_RULES,
      },
      palette: PALETTE,
    },
    {
      id: 'three-rules',
      kind: 'challenge',
      starter: buildCircuit({ name: 'Three rules', parts: io(ABC, ['Y'], { outputX: 30 }) }),
      // One gate group per rule, then AND them together.
      solution: buildCircuit({
        name: 'Three rules',
        parts: [
          ...io(ABC, ['Y'], { outputX: 30 }),
          { id: 'not-1', type: 'NOT', at: [6, -2] },
          { id: 'or-1', type: 'OR', at: [12, -1] },
          { id: 'xnor-1', type: 'XNOR', at: [12, 5] },
          { id: 'nand-1', type: 'NAND', at: [12, 11] },
          { id: 'and-1', type: 'AND', at: [19, 1] },
          { id: 'and-2', type: 'AND', at: [25, 3] },
        ],
        wires: [
          ['A', 'not-1'],
          ['not-1', 'or-1.in0'],
          ['C', 'or-1.in1'],
          ['B', 'xnor-1.in0'],
          ['C', 'xnor-1.in1'],
          ['A', 'nand-1.in0'],
          ['B', 'nand-1.in1'],
          ['or-1', 'and-1.in0'],
          ['xnor-1', 'and-1.in1'],
          ['and-1', 'and-2.in0'],
          ['nand-1', 'and-2.in1'],
          ['and-2', 'Y'],
        ],
      }),
      spec: {
        inputs: ABC,
        outputs: ['Y'],
        expected: rowsFromRules(ABC, THREE_RULES),
        rules: THREE_RULES,
      },
      palette: PALETTE,
      liveOutputs: false,
      truthTable: 'hidden',
    },
  ],
};

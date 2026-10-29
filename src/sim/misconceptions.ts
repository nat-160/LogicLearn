/**
 * Misconception signatures: recognizing a *specific* mistake from the rows that are wrong.
 *
 * Herman, Kaczmarczyk, Loui & Zilles ("Proof by Incomplete Enumeration and Other Logical
 * Misconceptions", ICER '08) found that students swap a "hard" operator for an "easy" one
 * that agrees with it on most rows – and then check only the rows that agree. Each swap
 * leaves a fingerprint in the truth table:
 *
 *   wanted            built   differs only on rows
 *   NAND "not both"   XOR     0,0
 *   XNOR "iff"        AND     0,0
 *   XOR               OR      1,1
 *   A → B "if-then"   AND     0,0 and 0,1
 *
 * So when a two-input, one-output check fails, we work out which standard function the
 * student's circuit actually computes. If it is a known swap, the hint can name the
 * misunderstanding instead of just saying "wrong". For any circuit, if the ONLY wrong row
 * is all zeros, we remind the student to check that row – the one most often skipped.
 */
import { rowNumber, type Bit, type Value } from './values';

/**
 * The standard two-input functions, as their outputs for rows 00, 01, 10, 11
 * (first input is the left bit).
 */
export const TWO_INPUT_FUNCTIONS: Readonly<Record<string, readonly Bit[]>> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  XOR: [0, 1, 1, 0],
  NAND: [1, 1, 1, 0],
  NOR: [1, 0, 0, 0],
  XNOR: [1, 0, 0, 1],
  IMPLY: [1, 1, 0, 1], // "if A then B" = NOT A OR B
};

/** The name of the standard function with this 4-row output column, if any. */
export function identifyTwoInputFunction(column: readonly Value[]): string | undefined {
  if (column.length !== 4) return undefined;
  return Object.keys(TWO_INPUT_FUNCTIONS).find((name) =>
    TWO_INPUT_FUNCTIONS[name].every((bit, i) => column[i] === bit),
  );
}

export interface Misconception {
  id: string;
  /** What the student's circuit does, in plain words. */
  summary: string;
  /** A question that points at the wrong row(s) without giving the answer away. */
  hint: string;
}

interface Signature extends Misconception {
  target: string;
  built: string;
}

const SIGNATURES: Signature[] = [
  {
    id: 'not-both-as-xor',
    target: 'NAND',
    built: 'XOR',
    summary: 'Your circuit acts like XOR ("exactly one"), but the rule is "not both".',
    hint: '"Not both" also allows neither. What should happen when both inputs are 0?',
  },
  {
    id: 'iff-as-and',
    target: 'XNOR',
    built: 'AND',
    summary: 'Your circuit acts like AND, but the rule is "if and only if" (the inputs match).',
    hint: 'Do the inputs match when both are 0? Check that row.',
  },
  {
    id: 'xor-as-or',
    target: 'XOR',
    built: 'OR',
    summary: 'Your circuit acts like OR ("at least one"), but the rule is "one or the other, not both".',
    hint: 'What should happen when both inputs are 1?',
  },
  {
    id: 'if-then-as-and',
    target: 'IMPLY',
    built: 'AND',
    summary: 'Your circuit acts like AND, but "if A then B" says nothing when A is 0.',
    hint: 'If A is off, has the rule been broken? Check the rows where A is 0.',
  },
];

const MISSED_ALL_ZEROS: Misconception = {
  id: 'missed-all-zeros',
  summary: 'Only the row where every input is 0 is wrong.',
  hint: 'Did you check the case where every input is 0?',
};

export interface MisconceptionInput {
  inputCount: number;
  outputCount: number;
  /** Expected and actual outputs, row by row, for every row that was checked. */
  rows: { inputs: readonly Bit[]; expected: readonly Bit[]; actual: readonly Value[] }[];
}

/** Recognize a known mistake from a failed check, or return undefined. */
export function diagnoseMisconception(input: MisconceptionInput): Misconception | undefined {
  const wrong = input.rows.filter((r) => r.expected.some((bit, i) => r.actual[i] !== bit));
  if (wrong.length === 0) return undefined;

  if (input.inputCount === 2 && input.outputCount === 1 && input.rows.length === 4) {
    const expected: Value[] = [];
    const actual: Value[] = [];
    for (const row of input.rows) {
      expected[rowNumber(row.inputs)] = row.expected[0];
      actual[rowNumber(row.inputs)] = row.actual[0];
    }
    const target = identifyTwoInputFunction(expected);
    const built = identifyTwoInputFunction(actual);
    const match = SIGNATURES.find((s) => s.target === target && s.built === built);
    if (match) return { id: match.id, summary: match.summary, hint: match.hint };
  }

  if (wrong.length === 1 && wrong[0].inputs.every((bit) => bit === 0)) return MISSED_ALL_ZEROS;
  return undefined;
}

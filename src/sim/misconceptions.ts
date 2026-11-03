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
import { allInputRows, rowNumber, type Bit, type Value } from './values';

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
  /**
   * Which output, input or rule (1-based) the mistake is about, when that matters. The
   * lesson text for a misconception can use them as {output}, {input} and {rule}.
   */
  params?: { output?: string; input?: string; rule?: number };
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
    summary:
      'Your circuit acts like OR ("at least one"), but the rule is "one or the other, not both".',
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

const INVERTED_OUTPUT: Misconception = {
  id: 'inverted-output',
  summary: 'Output {output} is the opposite of what the rule wants, in every row.',
  hint: 'Is there one NOT too many – or one missing – on the way to {output}?',
};

const IGNORES_INPUT: Misconception = {
  id: 'ignores-input',
  summary: 'Output {output} never changes when {input} changes, but the rule depends on {input}.',
  hint: 'Is {input} connected to the part of the circuit that drives {output}? "By itself" and "without" need a NOT.',
};

/** Every misconception id the checker can report (each needs lesson text, see lessons). */
export const MISCONCEPTION_IDS: readonly string[] = [
  ...SIGNATURES.map((s) => s.id),
  MISSED_ALL_ZEROS.id,
  INVERTED_OUTPUT.id,
  IGNORES_INPUT.id,
];

/** For each "hard" operator, the "easy" one students swap in (the SIGNATURES pairs). */
const COMMON_SWAP: Readonly<Record<string, string>> = Object.fromEntries(
  SIGNATURES.map((s) => [s.target, s.built]),
);

/**
 * One rule of a word problem, e.g. "if A then C" = { fn: 'IMPLY', inputs: ['A', 'C'] }. A
 * spec's `rules` all have to hold, so its output is the AND of the rules.
 */
export interface RulePart {
  fn: keyof typeof TWO_INPUT_FUNCTIONS;
  inputs: [string, string];
}

/** The value of one rule for one row of inputs (labels in `inputs` order). */
function ruleValue(
  fn: string,
  rule: RulePart,
  labels: readonly string[],
  bits: readonly Bit[],
): Bit {
  const a = bits[labels.indexOf(rule.inputs[0])];
  const b = bits[labels.indexOf(rule.inputs[1])];
  return TWO_INPUT_FUNCTIONS[fn][a * 2 + b];
}

/** The expected rows for a set of rules: 1 exactly when every rule holds. */
export function rowsFromRules(
  inputs: readonly string[],
  rules: readonly RulePart[],
): { inputs: Bit[]; outputs: Bit[] }[] {
  return allInputRows(inputs.length).map((bits) => ({
    inputs: bits,
    outputs: [rules.every((r) => ruleValue(r.fn, r, inputs, bits) === 1) ? 1 : 0],
  }));
}

function fill(text: string, params: NonNullable<Misconception['params']>): string {
  return text.replace(/\{(output|input|rule)\}/g, (whole, name: keyof typeof params) =>
    params[name] !== undefined ? String(params[name]) : whole,
  );
}

function withParams(m: Misconception, params: NonNullable<Misconception['params']>): Misconception {
  return { id: m.id, summary: fill(m.summary, params), hint: fill(m.hint, params), params };
}

export interface MisconceptionInput {
  inputCount: number;
  outputCount: number;
  /** Expected and actual outputs, row by row, for every row that was checked. */
  rows: { inputs: readonly Bit[]; expected: readonly Bit[]; actual: readonly Value[] }[];
  /** Input and output labels, in column order (for messages and rules). */
  inputs?: readonly string[];
  outputs?: readonly string[];
  /** The spec's rules, if it was written as rules (a word problem). */
  rules?: readonly RulePart[];
}

/**
 * Recognize a known mistake from a failed check, or return undefined. In order:
 *  1. a two-input swap (XOR for NAND, …), checked for each output on its own;
 *  2. a swap inside one rule of a word problem ("if-then" read as AND in rule 2);
 *  3. only the all-zeros row is wrong;
 *  4. an output is the exact opposite of what was wanted (inverted);
 *  5. an output ignores an input it should depend on (a missing NOT or wire).
 */
export function diagnoseMisconception(input: MisconceptionInput): Misconception | undefined {
  const isWrong = (r: MisconceptionInput['rows'][number], o: number) =>
    r.actual[o] !== r.expected[o];
  const wrong = input.rows.filter((r) => r.expected.some((_, o) => isWrong(r, o)));
  if (wrong.length === 0) return undefined;
  const outputLabel = (o: number) => input.outputs?.[o] ?? `output ${o + 1}`;
  const hasX = (o: number) => input.rows.some((r) => r.actual[o] === 'X');

  // 1. A two-input swap, output by output.
  if (input.inputCount === 2 && input.rows.length === 4) {
    for (let o = 0; o < input.outputCount; o++) {
      const expected: Value[] = [];
      const actual: Value[] = [];
      for (const row of input.rows) {
        expected[rowNumber(row.inputs)] = row.expected[o];
        actual[rowNumber(row.inputs)] = row.actual[o];
      }
      const target = identifyTwoInputFunction(expected);
      const built = identifyTwoInputFunction(actual);
      const match = SIGNATURES.find((s) => s.target === target && s.built === built);
      if (!match) continue;
      const found = { id: match.id, summary: match.summary, hint: match.hint };
      return input.outputCount > 1
        ? {
            ...found,
            summary: `Output ${outputLabel(o)}: ${found.summary}`,
            params: { output: outputLabel(o) },
          }
        : found;
    }
  }

  // 2. A swap inside one rule of a word problem.
  if (input.rules && input.inputs && input.outputCount === 1 && !hasX(0)) {
    const labels = input.inputs;
    for (const [k, rule] of input.rules.entries()) {
      const swapped = COMMON_SWAP[rule.fn];
      if (!swapped) continue;
      const matches = input.rows.every(
        (row) =>
          row.actual[0] ===
          (input.rules!.every(
            (r, j) => ruleValue(j === k ? swapped : r.fn, r, labels, row.inputs) === 1,
          )
            ? 1
            : 0),
      );
      const signature = SIGNATURES.find((s) => s.target === rule.fn && s.built === swapped);
      if (matches && signature) {
        return {
          id: signature.id,
          summary: `Rule ${k + 1}: ${signature.summary}`,
          hint: signature.hint,
          params: { rule: k + 1 },
        };
      }
    }
  }

  // 3. Only the all-zeros row is wrong. (X outputs mean something is unconnected – a
  // wiring problem, not this misconception.)
  const allZerosOnly =
    input.inputCount > 0 &&
    wrong.length === 1 &&
    wrong[0].inputs.every((bit) => bit === 0) &&
    !wrong[0].actual.includes('X');
  if (allZerosOnly) return MISSED_ALL_ZEROS;

  // 4. An output that is wrong in every row is upside down.
  for (let o = 0; o < input.outputCount; o++) {
    if (input.rows.length >= 2 && !hasX(o) && input.rows.every((r) => isWrong(r, o))) {
      return withParams(INVERTED_OUTPUT, { output: outputLabel(o) });
    }
  }

  // 5. An output that ignores an input the rule depends on.
  if (input.inputs && input.rows.length === 2 ** input.inputCount) {
    const expected = inputDependencies(
      input.rows.map((r) => ({ inputs: r.inputs, outputs: r.expected })),
    );
    const actual = inputDependencies(
      input.rows.map((r) => ({ inputs: r.inputs, outputs: r.actual })),
    );
    for (let o = 0; o < input.outputCount; o++) {
      if (hasX(o)) continue;
      const i = expected[o].findIndex((needed, i) => needed && !actual[o][i]);
      if (i >= 0)
        return withParams(IGNORES_INPUT, { output: outputLabel(o), input: input.inputs[i] });
    }
  }
  return undefined;
}

/**
 * Which inputs each output depends on, judged by behaviour: output o depends on input i if
 * flipping i in some row changes o. (A wire that leads nowhere useful – A AND NOT A – does
 * not count.) Rows may be in any order; the result is [output][input].
 */
export function inputDependencies(
  rows: readonly { inputs: readonly Bit[]; outputs: readonly Value[] }[],
): boolean[][] {
  if (rows.length === 0) return [];
  const n = rows[0].inputs.length;
  const byRow = new Map(rows.map((r) => [rowNumber(r.inputs), r.outputs]));
  return rows[0].outputs.map((_, o) =>
    Array.from({ length: n }, (_, i) => {
      for (const [num, outs] of byRow) {
        const other = byRow.get(num ^ (1 << (n - 1 - i)));
        if (other && other[o] !== outs[o]) return true;
      }
      return false;
    }),
  );
}

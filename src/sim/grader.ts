/**
 * Grading open projects: instead of one right answer, a checklist of criteria.
 *
 * A project's "rule" is a truth table – given by the brief, or partly written by the
 * student ("does the panic button work when the alarm is off? you decide"). The grader
 * then checks the circuit against that rule and a few structural criteria, and reports
 * each one separately, so the student sees what is done and what is not.
 *
 * Results are codes and details only; the lesson screens turn them into sentences.
 */
import { check, gateParts, type CheckResult, type CheckRow, type CheckSpec } from './checker';
import type { CircuitDoc } from './circuit';
import { inputDependencies } from './misconceptions';
import { rowNumber } from './values';

export type Criterion =
  /** The circuit follows the rule in every row (and meets any constraints). */
  | { kind: 'matches-rule' }
  /** The rule keeps the rows the brief gives (the student may only fill the others). */
  | { kind: 'rule-keeps-rows'; rows: CheckRow[] }
  /** The rule uses every input: some row changes when any one input changes. */
  | { kind: 'rule-uses-every-input' }
  /** In the circuit, every output depends on every input (judged by behaviour). */
  | { kind: 'outputs-use-every-input' }
  | { kind: 'min-gates'; count: number }
  | { kind: 'max-gates'; count: number }
  /** The circuit has at least `count` (default 1) parts of this type – any part, I/O too. */
  | { kind: 'uses-part'; type: string; count?: number };

export interface GradeSpec {
  inputs: string[];
  outputs: string[];
  /** The rule: one row per input combination. */
  rule: CheckRow[];
  criteria: Criterion[];
  constraints?: CheckSpec['constraints'];
}

export interface CriterionResult {
  criterion: Criterion;
  pass: boolean;
  /** What went wrong, e.g. { input: 'P' } or { wrong: 2, rows: 8 } or { have: 1 }. */
  details?: Record<string, string | number>;
}

export interface GradeResult {
  pass: boolean;
  check: CheckResult;
  criteria: CriterionResult[];
}

const RULE_ONLY: Criterion['kind'][] = ['rule-keeps-rows', 'rule-uses-every-input'];

/** The criteria about the rule itself, for feedback before anything is built. */
export function gradeRule(spec: GradeSpec): CriterionResult[] {
  return spec.criteria.filter((c) => RULE_ONLY.includes(c.kind)).map((c) => gradeOne(c, spec));
}

export function grade(doc: CircuitDoc, spec: GradeSpec): GradeResult {
  const result = check(doc, {
    inputs: spec.inputs,
    outputs: spec.outputs,
    expected: spec.rule,
    ...(spec.constraints && { constraints: spec.constraints }),
  });
  const criteria = spec.criteria.map((c) => gradeOne(c, spec, doc, result));
  return { pass: criteria.every((c) => c.pass), check: result, criteria };
}

function gradeOne(
  criterion: Criterion,
  spec: GradeSpec,
  doc?: CircuitDoc,
  result?: CheckResult,
): CriterionResult {
  const done = (pass: boolean, details?: CriterionResult['details']): CriterionResult => ({
    criterion,
    pass,
    ...(details && { details }),
  });
  switch (criterion.kind) {
    case 'rule-keeps-rows': {
      const byRow = new Map(spec.rule.map((r) => [rowNumber(r.inputs), r.outputs]));
      const changed = criterion.rows.find((given) => {
        const outputs = byRow.get(rowNumber(given.inputs));
        return !outputs || given.outputs.some((bit, o) => outputs[o] !== bit);
      });
      return done(!changed, changed && { row: changed.inputs.join('') });
    }
    case 'rule-uses-every-input': {
      const deps = inputDependencies(spec.rule);
      const unused = spec.inputs.findIndex((_, i) => !deps.some((outputDeps) => outputDeps[i]));
      return done(unused < 0, unused >= 0 ? { input: spec.inputs[unused] } : undefined);
    }
    case 'matches-rule': {
      if (!result) return done(false);
      const errors = result.diagnostics.filter((d) => d.severity === 'error').length;
      return done(result.pass, {
        wrong: result.mismatches.length,
        rows: result.rows.length,
        errors,
      });
    }
    case 'outputs-use-every-input': {
      if (!result || result.rows.length === 0) return done(false);
      const deps = inputDependencies(
        result.rows.map((r) => ({ inputs: r.inputs, outputs: r.actual })),
      );
      for (const [o, outputDeps] of deps.entries()) {
        const i = outputDeps.findIndex((d) => !d);
        if (i >= 0) return done(false, { output: spec.outputs[o], input: spec.inputs[i] });
      }
      return done(true);
    }
    case 'min-gates':
    case 'max-gates': {
      const have = doc ? gateParts(doc).length : 0;
      const pass =
        criterion.kind === 'min-gates' ? have >= criterion.count : have <= criterion.count;
      return done(pass, { have });
    }
    case 'uses-part': {
      const have = doc ? doc.components.filter((c) => c.type === criterion.type).length : 0;
      return done(have >= (criterion.count ?? 1), { have });
    }
  }
}

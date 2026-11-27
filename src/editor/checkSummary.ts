/**
 * A check result in one or two sentences, for screen reader announcements and narration.
 */
import type { CheckResult, Misconception, Value } from '../sim';

/** Words for a misconception (lessons supply the author's text; default: the checker's). */
export type MisconceptionWordsFor = (m: Misconception) => { summary: string; hint: string };

export const checkerWords: MisconceptionWordsFor = (m) => ({ summary: m.summary, hint: m.hint });

export function summarizeCheck(
  result: CheckResult,
  words: MisconceptionWordsFor = checkerWords,
): string {
  if (result.pass) return 'Correct! Every row matches.';
  const parts = ['Not yet.'];
  if (result.rows.length) {
    parts.push(`${result.mismatches.length} of ${result.rows.length} rows are wrong.`);
  }
  const example = exampleText(result);
  if (example) parts.push(example);
  if (result.misconception) {
    const { summary, hint } = words(result.misconception);
    parts.push(summary, `Hint: ${hint}`);
  }
  for (const d of result.diagnostics.filter((d) => d.severity === 'error')) parts.push(d.message);
  return parts.join(' ');
}

/** A value in words: 0, 1, or "? (unknown)". */
export const valueText = (v: Value) => (v === 'X' ? '? (unknown)' : String(v));

/** A row of inputs in words: "A = 1, B = 0". */
export function rowText(labels: readonly string[], bits: readonly Value[]): string {
  return labels.map((label, i) => `${label} = ${valueText(bits[i])}`).join(', ');
}

/** How many wrong outputs to name in one example before "and more". */
const MAX_NAMED = 3;

/**
 * The check's example wrong row in words: "For example, with A = 1, B = 0, your circuit
 * gives Y = 1, but the task wants Y = 0." Only the outputs that are wrong are named.
 */
export function exampleText(result: CheckResult): string | undefined {
  const row = result.example;
  if (!row) return undefined;
  const wrong = result.labels.outputs
    .map((label, o) => ({ label, got: row.actual[o], want: row.expected[o] }))
    .filter((o) => o.got !== o.want);
  if (wrong.length === 0) return undefined;
  const named = wrong.slice(0, MAX_NAMED);
  const more = wrong.length > MAX_NAMED ? ` (and ${wrong.length - MAX_NAMED} more)` : '';
  const gives = named.map((o) => `${o.label} = ${valueText(o.got)}`).join(', ');
  const wants = named.map((o) => `${o.label} = ${o.want}`).join(', ');
  return `For example, with ${rowText(result.labels.inputs, row.inputs)}, your circuit gives ${gives}${more}, but the task wants ${wants}.`;
}

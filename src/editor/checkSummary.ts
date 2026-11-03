/**
 * A check result in one or two sentences, for screen reader announcements and narration.
 */
import type { CheckResult, Misconception } from '../sim';

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
  if (result.misconception) {
    const { summary, hint } = words(result.misconception);
    parts.push(summary, `Hint: ${hint}`);
  }
  for (const d of result.diagnostics.filter((d) => d.severity === 'error')) parts.push(d.message);
  return parts.join(' ');
}

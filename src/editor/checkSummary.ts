/**
 * A check result in one or two sentences, for screen reader announcements and narration.
 */
import type { CheckResult } from '../sim';

export function summarizeCheck(result: CheckResult): string {
  if (result.pass) return 'Correct! Every row matches.';
  const parts = ['Not yet.'];
  if (result.rows.length) {
    parts.push(`${result.mismatches.length} of ${result.rows.length} rows are wrong.`);
  }
  if (result.misconception)
    parts.push(result.misconception.summary, `Hint: ${result.misconception.hint}`);
  for (const d of result.diagnostics.filter((d) => d.severity === 'error')) parts.push(d.message);
  return parts.join(' ');
}

/**
 * The project checklist in words: one line per grader criterion (src/sim/grader.ts), saying
 * what is done or what is still missing. Interface text, English for now (see
 * docs/translating.md).
 */
import type { CriterionResult } from '../sim';

export function criterionText({ criterion, pass, details = {} }: CriterionResult): string {
  switch (criterion.kind) {
    case 'matches-rule':
      if (pass) return 'Your circuit follows your rule in every row.';
      return details.errors
        ? 'Your circuit isn’t finished yet – see the messages below.'
        : `Your circuit doesn’t follow your rule in ${details.wrong} of ${details.rows} rows (marked in the truth table).`;
    case 'rule-keeps-rows':
      return pass
        ? 'Your rule keeps the cases the brief gives.'
        : `Your rule changes a case the brief gives (inputs ${details.row}).`;
    case 'rule-uses-every-input':
      return pass
        ? 'Your rule uses every input.'
        : `Your rule never uses ${details.input} – should it matter?`;
    case 'outputs-use-every-input':
      return pass
        ? 'Every output depends on every input.'
        : `${details.output} never changes when ${details.input} changes – is ${details.input} connected?`;
    case 'min-gates':
      return pass
        ? `Uses at least ${criterion.count} gates.`
        : `Uses ${details.have} ${details.have === 1 ? 'gate' : 'gates'}; the project needs at least ${criterion.count}.`;
    case 'max-gates':
      return pass
        ? `Uses at most ${criterion.count} gates.`
        : `Uses ${details.have} gates; the project allows at most ${criterion.count}.`;
    case 'uses-part':
      return pass ? `Uses a ${partWord(criterion.type)}.` : `Needs a ${partWord(criterion.type)}.`;
  }
}

function partWord(type: string): string {
  return (
    { SEVEN_SEG: 'seven-segment display', PUSH_BUTTON: 'push button', LIGHT: 'light' }[type] ??
    `${type} gate`
  );
}

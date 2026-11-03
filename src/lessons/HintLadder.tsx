/**
 * Hints, revealed one at a time. Guided steps' hints go from a pointer ("look at the row
 * where both are off") to the rule, and the last one shows how ("Show me how"), so a
 * student is never stuck for good. Challenges have fewer hints and no "show me how".
 *
 * The highest hint revealed is saved with the step's progress, so hints stay shown after a
 * reload. After two failed checks without a hint, a short note points to the hints.
 */
import { MarkdownInline } from './Markdown';
import { stuckText } from './sharedMessages';
import { textLang } from './stepSpeech';
import type { BuildStep } from './types';

export function HintLadder({
  step,
  shown,
  onShow,
  stuck,
}: {
  step: BuildStep;
  /** How many hints are revealed. */
  shown: number;
  onShow: () => void;
  /** Show the "Stuck? A hint is ready" note. */
  stuck: boolean;
}) {
  const total = step.hints.length;
  if (total === 0) return null;
  const next = shown + 1;
  const showMeHow = step.kind === 'guided' && total > 1 && next === total;
  return (
    <div className="hints">
      {step.hints.slice(0, shown).map((hint, i) => (
        <p key={i} className="hint">
          <span aria-hidden>💡 </span>
          <span className="sr-only">Hint {i + 1}: </span>
          <MarkdownInline source={hint} lang={textLang(step)} />
        </p>
      ))}
      {shown < total && (
        <>
          {stuck && (
            <p className="stuck-note" data-testid="stuck-note">
              {stuckText(step.locale)}
            </p>
          )}
          <button type="button" onClick={onShow} data-testid="hint-button">
            {showMeHow
              ? `Show me how (hint ${next} of ${total})`
              : `Show a hint (${next} of ${total})`}
          </button>
        </>
      )}
    </div>
  );
}

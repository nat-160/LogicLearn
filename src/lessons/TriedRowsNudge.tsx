/**
 * "You have tried 2 of 4 rows" – shown instead of the check result when the student
 * presses Check before trying every row (see triedRows.ts). It offers the next untried
 * row (one tap sets the switches) and "Check anyway". It never blocks: it appears once
 * per version of the circuit, and it doesn't count as a check attempt.
 */
import type { Bit } from '../sim';
import { fillPlaceholders, findSharedText } from './lessonText';
import { Markdown } from './Markdown';
import { nudgeTitle } from './sharedMessages';
import { textLang } from './stepSpeech';

export function TriedRowsNudge({
  inputs,
  untried,
  total,
  locale,
  onTryRow,
  onCheckAnyway,
}: {
  /** The spec's input labels. */
  inputs: readonly string[];
  untried: readonly (readonly Bit[])[];
  total: number;
  locale: string;
  onTryRow: (bits: readonly Bit[]) => void;
  onCheckAnyway: () => void;
}) {
  const text = findSharedText('nudge-untried-rows', locale);
  const params = { tried: total - untried.length, total };
  const next = untried[0];
  return (
    <div className="nudge" data-testid="tried-rows-nudge" lang={text && textLang(text)}>
      <p className="nudge-title">{nudgeTitle(locale, params.tried, total)}</p>
      {text?.prose && <Markdown source={fillPlaceholders(text.prose, params)} />}
      <div className="button-row">
        {next && (
          <button
            type="button"
            className="primary"
            onClick={() => onTryRow(next)}
            data-testid="try-row"
          >
            Try row {inputs.map((label, i) => `${label} = ${next[i]}`).join(', ')}
          </button>
        )}
        <button type="button" onClick={onCheckAnyway} data-testid="check-anyway">
          Check anyway
        </button>
      </div>
    </div>
  );
}

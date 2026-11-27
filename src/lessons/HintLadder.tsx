/**
 * Hints, revealed one at a time, from general to specific:
 *  1. the step's written hints – the gate's rule or the idea behind the step;
 *  2. "Look at your circuit" – the part to look at (worked out from the circuit);
 *  3. "Try one row" – one wrong row, walked through gate by gate.
 * None of them gives the whole answer, so a student who opens them all still has
 * something to work out (full answers are only in the teacher's answer key). Steps
 * without a circuit to build (predictions, projects) have written hints only.
 *
 * The highest hint revealed is saved with the step's progress, so hints stay shown after a
 * reload. After two failed checks without a hint, a short note points to the hints.
 */
import { announce } from '../a11y/announcer';
import { SetRowButton } from '../editor/CheckPanel';
import { useEditorStore } from '../editor/editorContext';
import type { CircuitHint } from './circuitHints';
import { MarkdownInline } from './Markdown';
import { stuckText } from './sharedMessages';
import { textLang } from './stepSpeech';

/** What the ladder needs from a step (or a project brief). */
interface HintSource {
  hints: string[];
  locale: string;
}

/** A hint worked out from the student's circuit, shown after the written ones. */
export interface GeneratedHint {
  title: string;
  hint: CircuitHint;
}

export function HintLadder({
  step,
  generated = [],
  shown,
  onShow,
  stuck,
}: {
  step: HintSource;
  generated?: GeneratedHint[];
  /** How many hints are revealed (written ones first, then generated ones). */
  shown: number;
  onShow: () => void;
  /** Show the "Stuck? A hint is ready" note. */
  stuck: boolean;
}) {
  const written = step.hints.length;
  const total = written + generated.length;
  if (total === 0) return null;
  const next = shown + 1;
  return (
    <div className="hints">
      {step.hints.slice(0, shown).map((hint, i) => (
        <p key={i} className="hint">
          <span aria-hidden>💡 </span>
          <span className="sr-only">Hint {i + 1}: </span>
          <MarkdownInline source={hint} lang={textLang(step)} />
        </p>
      ))}
      {generated.slice(0, Math.max(0, shown - written)).map((g, i) => (
        <CircuitHintView key={g.title} number={written + i + 1} {...g} />
      ))}
      {shown < total && (
        <>
          {stuck && (
            <p className="stuck-note" data-testid="stuck-note">
              {stuckText(step.locale)}
            </p>
          )}
          <button type="button" onClick={onShow} data-testid="hint-button">
            Show a hint ({next} of {total})
          </button>
        </>
      )}
    </div>
  );
}

/** A hint about the student's own circuit, with buttons to point at it or try its row. */
function CircuitHintView({ number, title, hint }: GeneratedHint & { number: number }) {
  const store = useEditorStore();
  const partIds = hint.partIds ?? [];
  return (
    <div className="hint hint-circuit" data-testid={`circuit-hint-${number}`}>
      <p>
        <span aria-hidden>🔎 </span>
        <span className="sr-only">Hint {number}: </span>
        <strong>{title}:</strong> {hint.text}
      </p>
      {(partIds.length > 0 || hint.row) && (
        <p className="hint-actions">
          {partIds.length > 0 && (
            <button
              type="button"
              className="link-button"
              onClick={() => {
                store.getState().setHighlight({ componentIds: partIds, tone: 'pointer' });
                announce(
                  `Marked on the canvas: ${partIds.length === 1 ? 'one part' : `${partIds.length} parts`}.`,
                );
              }}
              data-testid="show-on-canvas"
            >
              Show it on the canvas
            </button>
          )}
          {hint.row && <SetRowButton labels={hint.row.labels} bits={hint.row.bits} />}
        </p>
      )}
    </div>
  );
}

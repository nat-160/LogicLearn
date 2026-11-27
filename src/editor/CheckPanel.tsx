/**
 * Checking a circuit against a target, and showing the result.
 *
 * `useCheck()` runs the checker (src/sim/checker.ts) on the current circuit, then
 * highlights what went wrong: wrong rows in the truth table and problem parts on the
 * canvas. A result goes stale as soon as the circuit changes, so it is hidden then.
 * The sandbox uses <TargetCheckPanel>; lessons reuse `useCheck` (useCheck.ts) and
 * <CheckResultView>.
 */
import { announce } from '../a11y/announcer';
import type { Bit, CheckResult } from '../sim';
import {
  checkerWords,
  exampleText,
  rowText,
  summarizeCheck,
  type MisconceptionWordsFor,
} from './checkSummary';
import { TARGETS } from './targets';
import { useEditorStore } from './editorContext';
import { inputsForRow, useCheck } from './useCheck';

export function CheckResultView({
  result,
  words = checkerWords,
}: {
  result: CheckResult;
  /** Words for a recognized misconception (lessons pass the author's text). */
  words?: MisconceptionWordsFor;
}) {
  const errors = result.diagnostics.filter((d) => d.severity === 'error');
  const warnings = result.diagnostics.filter((d) => d.severity === 'warning');
  const wrong = result.mismatches.length;
  const example = exampleText(result);
  return (
    <div
      className={`check-result ${result.pass ? 'pass' : 'fail'}`}
      role="status"
      data-testid="check-result"
    >
      <p className="check-headline">
        {result.pass ? '✔ Correct! Every row matches.' : '✘ Not yet.'}
        {!result.pass && result.rows.length > 0 && (
          <>
            {' '}
            {wrong} of {result.rows.length} rows are wrong (marked in the truth table).
          </>
        )}
      </p>
      {example && result.example && (
        <p className="check-example" data-testid="check-example">
          {example} <SetRowButton labels={result.labels.inputs} bits={result.example.inputs} />
        </p>
      )}
      {result.misconception && (
        <div className="misconception" data-misconception={result.misconception.id}>
          <p>{words(result.misconception).summary}</p>
          {words(result.misconception).hint && (
            <p className="hint">💡 {words(result.misconception).hint}</p>
          )}
        </div>
      )}
      {errors.length > 0 && (
        <ul className="diagnostics">
          {errors.map((d, i) => (
            <li key={i} className="diag-error">
              {d.message}
            </li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="diagnostics">
          {warnings.map((d, i) => (
            <li key={i} className="diag-warning">
              {d.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Sets the switches to one row of the task, so the student can see what their circuit
 * does there (wires and lights show the values). Inside an editor only.
 */
export function SetRowButton({
  labels,
  bits,
  children = 'Set the switches to this row',
}: {
  labels: readonly string[];
  bits: readonly Bit[];
  children?: string;
}) {
  const store = useEditorStore();
  return (
    <button
      type="button"
      className="link-button"
      onClick={() => {
        const { doc, setInputs } = store.getState();
        setInputs(inputsForRow(doc, labels, bits));
        announce(`Switches set: ${rowText(labels, bits)}.`);
      }}
      data-testid="set-row"
    >
      {children}
    </button>
  );
}

/** The sandbox's "check against a target" panel. */
export function TargetCheckPanel({
  targetId,
  onTargetChange,
  words = checkerWords,
}: {
  targetId: string;
  onTargetChange: (id: string) => void;
  words?: MisconceptionWordsFor;
}) {
  const { result, run, clear } = useCheck();
  const target = TARGETS.find((t) => t.id === targetId);

  return (
    <section className="panel check-panel" aria-label="Check against a target">
      <h2 className="panel-title">Check</h2>
      <label className="field">
        <span>Target</span>
        <select
          value={targetId}
          onChange={(e) => {
            clear();
            onTargetChange(e.target.value);
          }}
          data-testid="target-select"
        >
          <option value="">— choose a target —</option>
          {TARGETS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {target && (
        <>
          <p className="task">{target.task}</p>
          <p className="muted small">
            Inputs: {target.spec.inputs.join(', ')} · Outputs: {target.spec.outputs.join(', ')}
          </p>
          <button
            type="button"
            className="primary"
            onClick={() => announce(summarizeCheck(run(target.spec), words))}
            data-testid="check-button"
          >
            Check my circuit
          </button>
        </>
      )}
      {result && <CheckResultView result={result} words={words} />}
    </section>
  );
}

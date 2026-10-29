/**
 * Checking a circuit against a target, and showing the result.
 *
 * `useCheck()` runs the checker (src/sim/checker.ts) on the current circuit, then
 * highlights what went wrong: wrong rows in the truth table and problem parts on the
 * canvas. A result goes stale as soon as the circuit changes, so it is hidden then.
 * The sandbox uses <TargetCheckPanel>; lessons reuse `useCheck` (useCheck.ts) and
 * <CheckResultView>.
 */
import type { CheckResult } from '../sim';
import { TARGETS } from './targets';
import { useCheck } from './useCheck';

export function CheckResultView({ result }: { result: CheckResult }) {
  const errors = result.diagnostics.filter((d) => d.severity === 'error');
  const warnings = result.diagnostics.filter((d) => d.severity === 'warning');
  const wrong = result.mismatches.length;
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
      {result.misconception && (
        <div className="misconception">
          <p>{result.misconception.summary}</p>
          <p className="hint">💡 {result.misconception.hint}</p>
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

/** The sandbox's "check against a target" panel. */
export function TargetCheckPanel({
  targetId,
  onTargetChange,
}: {
  targetId: string;
  onTargetChange: (id: string) => void;
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
            onClick={() => run(target.spec)}
            data-testid="check-button"
          >
            Check my circuit
          </button>
        </>
      )}
      {result && <CheckResultView result={result} />}
    </section>
  );
}

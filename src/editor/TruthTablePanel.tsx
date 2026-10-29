/**
 * The live truth table for whatever is on the canvas.
 *
 *  - The row matching the current switch settings is highlighted, so the table and the
 *    circuit always point at the same case.
 *  - Tapping a row sets the switches to that row.
 *  - Rows the student has actually tried with the switches get a check mark. Students
 *    tend to test only a few cases (ICER '08: "proof by incomplete enumeration"), so the
 *    panel shows "tried 3 of 4" as a gentle nudge.
 *  - With a target, an "expected" column appears and wrong rows are marked after a check.
 */
import { useMemo } from 'react';
import { computeTruthTable, rowNumber, type Bit, type CheckSpec, type Value } from '../sim';
import { useEditor } from './editorContext';

/** Show the table for up to this many inputs (64 rows). */
const MAX_SHOWN_INPUTS = 6;

const show = (v: Value) => (v === 'X' ? '?' : String(v));

export function TruthTablePanel({ spec }: { spec?: CheckSpec }) {
  const doc = useEditor((s) => s.doc);
  const inputs = useEditor((s) => s.inputs);
  const tried = useEditor((s) => s.triedRows);
  const wrongRows = useEditor((s) => s.highlight.rows);
  const setInputs = useEditor((s) => s.setInputs);

  const result = useMemo(() => computeTruthTable(doc, MAX_SHOWN_INPUTS), [doc]);

  if (!result.ok) {
    return (
      <section className="panel truth-table-panel" aria-label="Truth table">
        <h2 className="panel-title">Truth table</h2>
        <p className="muted">
          Too many inputs to list ({result.inputCount}); the table shows up to {MAX_SHOWN_INPUTS}.
        </p>
      </section>
    );
  }

  const { table } = result;
  if (table.inputs.length === 0) {
    return (
      <section className="panel truth-table-panel" aria-label="Truth table">
        <h2 className="panel-title">Truth table</h2>
        <p className="muted">Add a switch and a light to see the truth table.</p>
      </section>
    );
  }

  const current = rowNumber(table.inputs.map((p) => inputs[p.id] ?? 0));
  const inputLabels = table.inputs.map((p) => p.label);
  // Expected outputs line up only if the switches carry the spec's labels, in order.
  const comparable = !!spec && spec.inputs.join('|') === inputLabels.join('|');
  const expectedFor = (bits: Bit[], outputLabel: string): Bit | undefined => {
    if (!comparable || !spec) return undefined;
    const col = spec.outputs.indexOf(outputLabel);
    const row = spec.expected.find((r) => r.inputs.every((bit, i) => bit === bits[i]));
    return col >= 0 && row ? row.outputs[col] : undefined;
  };
  const expectedLabels = comparable
    ? table.outputs.map((p) => p.label).filter((l) => spec!.outputs.includes(l))
    : [];
  const triedCount = table.rows.filter((_, i) => tried.has(i)).length;

  return (
    <section className="panel truth-table-panel" aria-label="Truth table">
      <h2 className="panel-title">
        Truth table
        <span className="tried-count" data-testid="tried-count">
          tried {triedCount} of {table.rows.length}
        </span>
      </h2>
      {spec && !comparable && (
        <p className="muted small">
          Label your switches {spec.inputs.join(', ')} to compare with the target.
        </p>
      )}
      <div className="table-scroll">
        <table className="truth-table" data-testid="truth-table">
          <thead>
            <tr>
              <th aria-label="tried" />
              {table.inputs.map((p) => (
                <th key={p.id} className="col-input">
                  {p.label}
                </th>
              ))}
              {table.outputs.map((p) => (
                <th key={p.id} className="col-output">
                  {p.label}
                </th>
              ))}
              {expectedLabels.map((label) => (
                <th key={`exp-${label}`} className="col-expected" title="What the target expects">
                  {label} wanted
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => {
              const classes = [
                i === current && 'is-current',
                wrongRows.has(i) && 'is-wrong',
                !row.settled && 'is-unstable',
              ]
                .filter(Boolean)
                .join(' ');
              const tryRow = () =>
                setInputs(Object.fromEntries(table.inputs.map((p, k) => [p.id, row.inputs[k]])));
              return (
                <tr
                  key={i}
                  className={classes}
                  aria-current={i === current ? 'true' : undefined}
                  tabIndex={0}
                  onClick={tryRow}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      tryRow();
                    }
                  }}
                  title="Tap to set the switches to this row"
                  data-testid={`tt-row-${i}`}
                >
                  <td className="tried-mark">{tried.has(i) ? '✓' : ''}</td>
                  {row.inputs.map((bit, k) => (
                    <td key={`i${k}`} className="col-input">
                      {bit}
                    </td>
                  ))}
                  {row.outputs.map((v, k) => (
                    <td key={`o${k}`} className={`col-output value-${show(v)}`}>
                      {show(v)}
                    </td>
                  ))}
                  {expectedLabels.map((label) => (
                    <td key={`e-${label}`} className="col-expected">
                      {expectedFor(row.inputs, label) ?? ''}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="muted small">
        ✓ = a row you have tried with the switches. Tap a row to try it.
      </p>
    </section>
  );
}

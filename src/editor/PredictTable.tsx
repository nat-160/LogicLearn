/**
 * A truth table the student fills in: their prediction of each output in each row, made
 * before the circuit shows its values (predict → observe → explain). Also used for a
 * project's rule ("what should the alarm do in each case?").
 *
 * Each cell is a pair of native radio buttons, 0 and 1, inside a <fieldset> whose hidden
 * legend says which cell it is ("Y when A is 0, B is 1"). That gives screen readers the
 * full question, one Tab stop per cell, and arrow keys to choose – no custom widget.
 *
 * After the prediction is checked (`result`), each row also shows the real value and
 * "✓ right" or "✗ wrong" in words, so color is never the only cue.
 */
import type { Bit, Prediction, Value } from '../sim';
import { TableScroll } from './TableScroll';

export interface PredictTableResult {
  /** The real outputs, [row][output]. */
  actual: Value[][];
  /** right[row][output]. */
  right: boolean[][];
}

export function PredictTable({
  id,
  caption,
  inputs,
  outputs,
  rows,
  cells,
  onChange,
  given,
  result,
  currentRow,
  disabled = false,
  showCount = true,
}: {
  /** Unique on the page: used for the radio groups' names. */
  id: string;
  caption: string;
  /** Input and output labels, in column order. */
  inputs: readonly string[];
  outputs: readonly string[];
  /** The input bits of each row, in counting order. */
  rows: readonly (readonly Bit[])[];
  /** The student's predictions, [row][output]. */
  cells: readonly (readonly Prediction[])[];
  onChange: (row: number, output: number, bit: Bit) => void;
  /** Cells fixed by the task (shown as plain text, not editable), [row][output]. */
  given?: readonly (readonly Prediction[])[];
  result?: PredictTableResult | null;
  /** The row the switches are set to now (highlighted). */
  currentRow?: number;
  disabled?: boolean;
  /** The "6 of 8 rows filled in" line (not needed when every cell is given). */
  showCount?: boolean;
}) {
  const filled = rows.filter((_, r) => outputs.every((_, o) => cells[r]?.[o] != null)).length;
  return (
    <div className="predict-table-wrap">
      {showCount && (
        <p className="small predict-count" data-testid={`${id}-count`}>
          {filled} of {rows.length} rows filled in
        </p>
      )}
      <TableScroll label={caption}>
        <table className="truth-table predict-table" data-testid={id}>
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {inputs.map((label) => (
                <th key={label} scope="col" className="col-input">
                  {label}
                </th>
              ))}
              {outputs.map((label) => (
                <th key={label} scope="col" className="col-output">
                  {result ? `${label} predicted` : label}
                </th>
              ))}
              {result &&
                outputs.map((label) => (
                  <th key={`a-${label}`} scope="col" className="col-expected">
                    {label} is
                  </th>
                ))}
              {result && (
                <th scope="col">
                  <span className="sr-only">Result</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((bits, r) => {
              const rowRight = result?.right[r]?.every(Boolean);
              const when = bits.map((bit, i) => `${inputs[i]} is ${bit}`).join(', ');
              return (
                <tr
                  key={r}
                  className={[r === currentRow && 'is-current', result && !rowRight && 'is-wrong']
                    .filter(Boolean)
                    .join(' ')}
                  data-testid={`${id}-row-${r}`}
                >
                  {bits.map((bit, i) => (
                    <td key={i} className="col-input">
                      {bit}
                    </td>
                  ))}
                  {outputs.map((label, o) => {
                    const fixed = given?.[r]?.[o];
                    if (fixed != null) {
                      return (
                        <td key={o} className="col-output predict-given">
                          {fixed}
                          <span className="sr-only"> (given)</span>
                        </td>
                      );
                    }
                    const name = `${id}-r${r}-o${o}`;
                    return (
                      <td key={o} className="col-output">
                        <fieldset className="predict-cell" disabled={disabled}>
                          <legend className="sr-only">
                            {label} when {when}
                          </legend>
                          {([0, 1] as const).map((bit) => (
                            <label key={bit} className="predict-choice">
                              <input
                                type="radio"
                                name={name}
                                checked={cells[r]?.[o] === bit}
                                onChange={() => onChange(r, o, bit)}
                                data-testid={`${name}-${bit}`}
                              />
                              <span>{bit}</span>
                            </label>
                          ))}
                        </fieldset>
                      </td>
                    );
                  })}
                  {result &&
                    outputs.map((_, o) => {
                      const v = result.actual[r]?.[o];
                      return (
                        <td key={`a${o}`} className="col-expected">
                          {v === 'X' ? '?' : v}
                        </td>
                      );
                    })}
                  {result && (
                    <td className={rowRight ? 'right-mark' : 'wrong-mark'}>
                      {rowRight ? '✓ right' : '✗ wrong'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}

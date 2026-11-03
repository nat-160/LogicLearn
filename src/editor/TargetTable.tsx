/**
 * The truth table a step asks for, shown on its own: used in a challenge that hides the
 * circuit's own truth table but gives the target ("build a circuit for this table").
 * Read-only – it shows what is wanted, not what the circuit does.
 */
import type { CheckSpec } from '../sim';
import { TableScroll } from './TableScroll';

export function TargetTable({ spec }: { spec: CheckSpec }) {
  return (
    <section className="panel truth-table-panel" aria-labelledby="target-table-title">
      <h2 id="target-table-title" className="panel-title">
        The table to build
      </h2>
      <p className="muted small">
        Your circuit's own values stay hidden until you press Check. Build it to match this.
      </p>
      <TableScroll label="The table to build">
        <table className="truth-table" data-testid="target-table">
          <caption className="sr-only">
            The truth table to build. Inputs: {spec.inputs.join(', ')}. Outputs:{' '}
            {spec.outputs.join(', ')}.
          </caption>
          <thead>
            <tr>
              {spec.inputs.map((label) => (
                <th key={`i-${label}`} scope="col" className="col-input">
                  {label}
                </th>
              ))}
              {spec.outputs.map((label) => (
                <th key={`o-${label}`} scope="col" className="col-output">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.expected.map((row, r) => (
              <tr key={r}>
                {row.inputs.map((bit, k) => (
                  <td key={`i${k}`} className="col-input">
                    {bit}
                  </td>
                ))}
                {row.outputs.map((bit, k) => (
                  <td key={`o${k}`} className="col-output">
                    {bit}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </TableScroll>
    </section>
  );
}

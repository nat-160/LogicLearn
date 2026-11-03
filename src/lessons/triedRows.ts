/**
 * Which rows of a step's truth table the student hasn't tried yet – for the nudge before
 * Check ("You have tried 2 of 4 rows"). Students tend to test only the rows that confirm
 * their idea, and rarely the all-zeros row (ICER '08), so a lesson asks them to try the
 * rest first. The nudge is skipped when it wouldn't help:
 *  - predict-first steps (the outputs are hidden, so trying rows shows nothing);
 *  - big tables (more than 8 rows);
 *  - circuits that don't have the spec's switches yet, or whose outputs are still X
 *    (unconnected): the checker's own message is more useful then.
 */
import { findIO, rowNumber, type Bit, type CheckSpec, type CircuitDoc, type Value } from '../sim';

export const MAX_NUDGE_ROWS = 8;

/** The untried spec rows (their input bits, in counting order), or [] for no nudge. */
export function rowsToTry(
  doc: CircuitDoc,
  values: Readonly<Record<string, Value>>,
  tried: ReadonlySet<number>,
  spec: CheckSpec,
  blind: boolean,
): Bit[][] {
  if (blind || spec.expected.length > MAX_NUDGE_ROWS) return [];
  const io = findIO(doc);
  if (io.inputs.map((p) => p.label).join('|') !== spec.inputs.join('|')) return [];
  const outputs = spec.outputs.map((label) => io.outputs.find((p) => p.label === label));
  if (
    outputs.some((p) => !p || values[`${p.id}.in`] === 'X' || values[`${p.id}.in`] === undefined)
  ) {
    return [];
  }
  // With the spec's labels in the circuit's (sorted) order, row numbers match.
  return spec.expected.filter((row) => !tried.has(rowNumber(row.inputs))).map((row) => row.inputs);
}

/**
 * Truth tables: try every combination of the circuit's inputs and record its outputs.
 *
 * The circuit's inputs and outputs are the parts whose registry role is "input" or
 * "output" (switches and lights in Phase 1). They are put in order by label (A, B, C… and
 * Y, Z…), and the rows are in binary counting order, so the all-zeros row is always
 * first. Students often skip that row when checking by hand (Herman et al., ICER '08).
 *
 * Each row starts from a fresh simulator (every wire X), so one row can't affect the
 * next. That is exactly right for circuits without loops, which is all of Phase 1.
 */
import { compile, type CompiledCircuit } from './compile';
import type { CircuitDoc } from './circuit';
import { findComponentDef } from './registry';
import { Simulator, type InputValues } from './simulator';
import { allInputRows, type Bit, type Value } from './values';

export interface IOPart {
  id: string;
  /** The label, or the id when the part has no label. */
  label: string;
  role: 'input' | 'output';
}

export interface CircuitIO {
  inputs: IOPart[];
  outputs: IOPart[];
}

/** Natural label order: "A" < "B" < "In2" < "In10". */
const labelOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'variant' });

/** The circuit's inputs and outputs, each sorted by label. */
export function findIO(doc: CircuitDoc): CircuitIO {
  const io: CircuitIO = { inputs: [], outputs: [] };
  for (const c of doc.components) {
    const role = findComponentDef(c.type)?.io;
    if (!role) continue;
    const part = { id: c.id, label: c.label?.trim() || c.id, role };
    (role === 'input' ? io.inputs : io.outputs).push(part);
  }
  const byLabel = (a: IOPart, b: IOPart) =>
    labelOrder.compare(a.label, b.label) || labelOrder.compare(a.id, b.id);
  io.inputs.sort(byLabel);
  io.outputs.sort(byLabel);
  return io;
}

export interface RowResult {
  outputs: Value[];
  /** False if the circuit never settled for this row (it oscillates). */
  settled: boolean;
}

/**
 * Run one row: set the given inputs, settle from scratch, read the outputs.
 * `others` sets any inputs that are not in `inputs` (they default to 0).
 */
export function evaluateRow(
  circuit: CompiledCircuit,
  inputs: readonly IOPart[],
  bits: readonly Bit[],
  outputs: readonly IOPart[],
  others: InputValues = {},
): RowResult {
  const values: Record<string, Bit> = Object.assign(Object.create(null), others);
  inputs.forEach((part, i) => (values[part.id] = bits[i]));
  const sim = new Simulator(circuit, values);
  return {
    outputs: outputs.map((part) => outputValue(sim, circuit, part.id)),
    settled: sim.lastReport.settled,
  };
}

/** What an output part (light) is showing: the value on its first input pin. */
function outputValue(sim: Simulator, circuit: CompiledCircuit, id: string): Value {
  const index = circuit.indexById.get(id);
  if (index === undefined) return 'X';
  const pin = circuit.components[index].inputPins[0];
  return pin === undefined ? 'X' : sim.pinValue(id, pin);
}

export interface TruthTableRow {
  inputs: Bit[];
  outputs: Value[];
  settled: boolean;
}

export interface TruthTable {
  inputs: IOPart[];
  outputs: IOPart[];
  rows: TruthTableRow[];
}

/** The largest number of inputs we will enumerate (2^10 = 1024 rows). */
export const MAX_TRUTH_TABLE_INPUTS = 10;

export type TruthTableResult =
  | { ok: true; table: TruthTable }
  | { ok: false; reason: 'too-many-inputs'; inputCount: number };

export function computeTruthTable(
  doc: CircuitDoc,
  maxInputs = MAX_TRUTH_TABLE_INPUTS,
): TruthTableResult {
  const { inputs, outputs } = findIO(doc);
  if (inputs.length > maxInputs) {
    return { ok: false, reason: 'too-many-inputs', inputCount: inputs.length };
  }
  const circuit = compile(doc);
  const rows = allInputRows(inputs.length).map((bits) => ({
    inputs: bits,
    ...evaluateRow(circuit, inputs, bits, outputs),
  }));
  return { ok: true, table: { inputs, outputs, rows } };
}

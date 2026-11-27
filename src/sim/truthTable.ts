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
import { findComponentDef, getComponentDef, pinsOf } from './registry';
import { Simulator, type InputValues } from './simulator';
import { allInputRows, type Bit, type Value } from './values';

export interface IOPart {
  id: string;
  /**
   * The label, or the id when the part has no label. For a part with several pins (a
   * seven-segment display), each pin is its own column: "D.a", "D.b", …
   */
  label: string;
  role: 'input' | 'output';
  /** The pin, for a column of a part with several pins. */
  pin?: string;
  /** The part's own label, for a column of a part with several pins ("D"). */
  partLabel?: string;
}

export interface CircuitIO {
  inputs: IOPart[];
  outputs: IOPart[];
}

/** Natural label order: "A" < "B" < "In2" < "In10". */
const labelOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'variant' });

/**
 * The circuit's inputs and outputs, sorted by label. An output part with several input
 * pins (a seven-segment display) gives one entry per pin, labelled "D.a" … "D.g" and kept
 * in pin order, so every segment is its own truth-table column.
 */
export function findIO(doc: CircuitDoc): CircuitIO {
  const io: CircuitIO = { inputs: [], outputs: [] };
  const parts: {
    component: CircuitDoc['components'][number];
    role: 'input' | 'output';
    label: string;
  }[] = [];
  for (const c of doc.components) {
    const role = findComponentDef(c.type)?.io;
    if (role) parts.push({ component: c, role, label: c.label?.trim() || c.id });
  }
  parts.sort(
    (a, b) =>
      labelOrder.compare(a.label, b.label) || labelOrder.compare(a.component.id, b.component.id),
  );
  for (const { component: c, role, label } of parts) {
    const layout = pinsOf(c.type, c.props);
    // An input part drives its output pin; an output part reads its input pins.
    const pins = role === 'input' ? layout.outputs : layout.inputs;
    const list = role === 'input' ? io.inputs : io.outputs;
    if (pins.length <= 1) list.push({ id: c.id, label, role });
    else {
      for (const pin of pins) {
        list.push({ id: c.id, label: `${label}.${pin.id}`, role, pin: pin.id, partLabel: label });
      }
    }
  }
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
    outputs: outputs.map((part) => outputValue(sim, circuit, part)),
    settled: sim.lastReport.settled,
  };
}

/** What an output shows: the value on its pin (a light's only input pin). */
function outputValue(sim: Simulator, circuit: CompiledCircuit, part: IOPart): Value {
  const index = circuit.indexById.get(part.id);
  if (index === undefined) return 'X';
  const pin = part.pin ?? circuit.components[index].inputPins[0];
  return pin === undefined ? 'X' : sim.pinValue(part.id, pin);
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
  { ok: true; table: TruthTable } | { ok: false; reason: 'too-many-inputs'; inputCount: number };

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

/**
 * A gate's own truth table, computed from its definition in the registry (so the gate
 * reminder card can never disagree with the simulator). Rows are in counting order.
 */
export function gateTruthTable(type: string): {
  inputs: number;
  rows: { inputs: Bit[]; output: Value }[];
} {
  const def = getComponentDef(type);
  const inputs = pinsOf(type, def.defaultProps).inputs.length;
  const rows = allInputRows(inputs).map((row) => ({
    inputs: row,
    output: def.evaluate(row, def.defaultProps, def.initialState?.(def.defaultProps)).outputs[0],
  }));
  return { inputs, rows };
}

/** A student's prediction for one output in one row: 0, 1, or not filled in yet. */
export type Prediction = Bit | null;

export interface PredictionResult {
  /** right[row][output]: whether that prediction matches the circuit. */
  right: boolean[][];
  /** Rows where every output was predicted right. */
  rowsRight: number;
  rows: number;
  /** Whether every prediction is filled in. */
  complete: boolean;
}

/**
 * Compare a student's predicted truth table with the real one, row by row. `cells` is
 * [row][output], in the table's own row and output order. A missing prediction is wrong.
 */
export function comparePredictions(
  table: TruthTable,
  cells: readonly (readonly Prediction[])[],
): PredictionResult {
  const right = table.rows.map((row, r) =>
    row.outputs.map((actual, o) => {
      const guess = cells[r]?.[o] ?? null;
      return guess !== null && guess === actual;
    }),
  );
  return {
    right,
    rowsRight: right.filter((row) => row.every(Boolean)).length,
    rows: table.rows.length,
    complete: table.rows.every((row, r) =>
      row.outputs.every((_, o) => (cells[r]?.[o] ?? null) !== null),
    ),
  };
}

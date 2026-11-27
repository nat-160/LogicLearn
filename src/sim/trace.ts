/**
 * Tracing one row through a circuit: what every gate receives and gives when the inputs
 * are set to one combination. Hints and check results use it to walk a student through
 * a single row ("With A = 1 and B = 0, OR gate 1 gets 1 and 0 and gives 1, so Y is 1"),
 * leaving the fix to the student.
 *
 * Gates are listed in the order the signal reaches them: a gate comes after every gate
 * that feeds it. Gates on a loop have no such order; they come last, in the order they
 * were added to the circuit.
 */
import type { CircuitDoc } from './circuit';
import { compile, findLoops, UNCONNECTED, type CompiledCircuit } from './compile';
import { Simulator } from './simulator';
import { findIO } from './truthTable';
import type { Bit, Value } from './values';

export interface TraceStep {
  /** The gate's component id. */
  id: string;
  type: string;
  /** The value on each input pin, in pin order (X if it isn't connected). */
  inputs: Value[];
  /** The value on each output pin (gates have one). */
  outputs: Value[];
}

export interface RowTrace {
  /** The inputs as set for this row, in truth-table (label) order. */
  inputs: { id: string; label: string; bit: Bit }[];
  /** Every gate, in the order the signal reaches it. */
  steps: TraceStep[];
  /** What each output shows, in truth-table order ("Y", or "D.a" … "D.g"). */
  outputs: { id: string; label: string; value: Value }[];
  /** False if the circuit never settled for this row. */
  settled: boolean;
}

/**
 * Run one row and record every gate's values. `bitsByLabel` sets inputs by label; inputs
 * it doesn't mention are 0, as in the checker.
 */
export function traceRow(doc: CircuitDoc, bitsByLabel: Record<string, Bit>): RowTrace {
  const circuit = compile(doc);
  const io = findIO(doc);
  const inputs = io.inputs.map((p) => ({
    id: p.id,
    label: p.label,
    bit: (bitsByLabel[p.label] === 1 ? 1 : 0) as Bit,
  }));
  const sim = new Simulator(circuit, Object.fromEntries(inputs.map((p) => [p.id, p.bit])));
  const steps = signalOrder(circuit)
    .map((i) => circuit.components[i])
    .filter((c) => !c.def.io)
    .map((c) => ({
      id: c.id,
      type: c.def.type,
      inputs: c.inputPins.map((pin) => sim.pinValue(c.id, pin)),
      outputs: c.outputPins.map((pin) => sim.pinValue(c.id, pin)),
    }));
  const outputs = io.outputs.map((p) => {
    const index = circuit.indexById.get(p.id);
    const pin = p.pin ?? (index === undefined ? undefined : circuit.components[index].inputPins[0]);
    return { id: p.id, label: p.label, value: pin === undefined ? 'X' : sim.pinValue(p.id, pin) };
  });
  return { inputs, steps, outputs, settled: sim.lastReport.settled };
}

/**
 * Component indexes, each after every part that drives it (its "depth" from the inputs).
 * Parts on a loop, and anything they feed, come last.
 */
function signalOrder(circuit: CompiledCircuit): number[] {
  const loops = findLoops(circuit);
  const driverOfNet = new Map<number, number>();
  circuit.components.forEach((c, i) => c.outputNets.forEach((net) => driverOfNet.set(net, i)));
  const depth = new Map<number, number>();
  const depthOf = (i: number): number => {
    const known = depth.get(i);
    if (known !== undefined) return known;
    const c = circuit.components[i];
    if (loops.has(c.id)) {
      depth.set(i, Infinity);
      return Infinity;
    }
    depth.set(i, 0); // guards against revisiting while this part is being worked out
    let d = 0;
    for (const net of c.inputNets) {
      if (net === UNCONNECTED) continue;
      const driver = driverOfNet.get(net);
      if (driver !== undefined) d = Math.max(d, depthOf(driver) + 1);
    }
    depth.set(i, d);
    return d;
  };
  return circuit.components.map((_, i) => i).sort((a, b) => depthOf(a) - depthOf(b) || a - b);
}

/**
 * Which wrong row to show as an example: the first one where the circuit gives a clear 0
 * or 1 (an "unknown" is less telling), or else the first wrong row.
 */
export function pickExampleRow<T extends { actual: Value[] }>(
  mismatches: readonly T[],
): T | undefined {
  return mismatches.find((r) => r.actual.every((v) => v !== 'X')) ?? mismatches[0];
}

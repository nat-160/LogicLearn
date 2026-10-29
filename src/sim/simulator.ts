/**
 * The simulator: works out the value on every wire.
 *
 * It is EVENT-DRIVEN with a UNIT DELAY, the same idea as Logisim and Digital:
 *
 *   1. Something changes (a switch is flipped) → the parts that read it are "scheduled".
 *   2. One TICK: every scheduled part recomputes its outputs from its current inputs.
 *      All of the new outputs are applied together at the end of the tick, as if every
 *      gate took exactly one unit of time to respond.
 *   3. Any part reading a wire that changed is scheduled for the next tick.
 *   4. Repeat until nothing changes – the circuit has "settled".
 *
 * Why not just evaluate the gates left to right? Because circuits can contain loops.
 * Loops are how memory (latches, flip-flops) works, and this approach handles them
 * without a redesign. A loop that never settles – like a NAND gate feeding its own
 * output back into itself while its other input is 1 – keeps changing forever. The
 * simulator stops after a fixed TICK BUDGET and reports which parts were still changing,
 * so the editor can say "this circuit never settles" and highlight them.
 *
 * Every wire starts as X (unknown). A switch's value enters the circuit on the first tick
 * and spreads from there. A loop with nothing to pin it down (a NOT gate wired to itself)
 * simply stays X.
 */
import { compile, isCompiled, UNCONNECTED, type CompiledCircuit } from './compile';
import type { CircuitDoc } from './circuit';
import { X, type Bit, type Value } from './values';

/** The bit each input part (switch) is set to, by component id. Missing ids count as 0. */
export type InputValues = Readonly<Record<string, Bit>>;

export interface SettleReport {
  settled: boolean;
  /** How many ticks it took to settle (or the budget, if it never settled). */
  ticks: number;
  /** Ids of parts that were still changing when the budget ran out. */
  unstable: string[];
}

/** The minimum number of ticks a circuit gets before it is declared oscillating. */
export const MIN_TICK_BUDGET = 100;

/**
 * Ticks allowed before giving up. A circuit without loops settles in at most as many
 * ticks as its longest chain of parts, which is never more than the number of parts, so
 * this budget is always enough for it.
 */
export function tickBudget(componentCount: number): number {
  return Math.max(MIN_TICK_BUDGET, 4 * componentCount);
}

export class Simulator {
  readonly circuit: CompiledCircuit;
  private values: Value[] = [];
  private states: unknown[] = [];
  private report: SettleReport = { settled: true, ticks: 0, unstable: [] };
  /** Parts still waiting to be evaluated when the tick budget ran out. */
  private pending = new Set<number>();

  constructor(circuit: CompiledCircuit | CircuitDoc, inputs: InputValues = {}) {
    this.circuit = isCompiled(circuit) ? circuit : compile(circuit);
    this.reset(inputs);
  }

  /** Start from scratch: every wire X, inputs set as given, then settle. */
  reset(inputs: InputValues = {}): SettleReport {
    const { components, netCount } = this.circuit;
    this.values = new Array<Value>(netCount).fill(X);
    this.states = components.map((c) => {
      if (c.def.io === 'input') return Object.hasOwn(inputs, c.id) ? inputs[c.id] : 0;
      return c.def.initialState?.(c.props);
    });
    this.pending.clear();
    // Schedule every part once: this is how switches put their values onto the wires.
    return this.settle(components.map((_, i) => i));
  }

  /** Flip a switch (or any input part) and let the circuit settle again. */
  setInput(componentId: string, bit: Bit): SettleReport {
    const index = this.circuit.indexById.get(componentId);
    if (index === undefined || this.circuit.components[index].def.io !== 'input') {
      return this.report;
    }
    if (this.states[index] === bit) return this.report;
    this.states[index] = bit;
    return this.settle([index]);
  }

  /** The result of the most recent settle. */
  get lastReport(): SettleReport {
    return this.report;
  }

  /** The value on one of a part's pins (an input pin shows the value it receives). */
  pinValue(componentId: string, pinId: string): Value {
    const index = this.circuit.indexById.get(componentId);
    if (index === undefined) return X;
    const c = this.circuit.components[index];
    const out = c.outputPins.indexOf(pinId);
    if (out >= 0) return this.values[c.outputNets[out]];
    const inp = c.inputPins.indexOf(pinId);
    if (inp >= 0) return this.readNet(c.inputNets[inp]);
    return X;
  }

  /** The current bit of an input part (switch). */
  inputBit(componentId: string): Bit {
    const index = this.circuit.indexById.get(componentId);
    return index !== undefined && this.states[index] === 1 ? 1 : 0;
  }

  /** Every pin's value, keyed "componentId.pinId" – handy for drawing the circuit. */
  snapshot(): Record<string, Value> {
    const result: Record<string, Value> = {};
    for (const c of this.circuit.components) {
      c.inputPins.forEach((pin, i) => (result[`${c.id}.${pin}`] = this.readNet(c.inputNets[i])));
      c.outputPins.forEach((pin, i) => (result[`${c.id}.${pin}`] = this.values[c.outputNets[i]]));
    }
    return result;
  }

  private readNet(net: number): Value {
    return net === UNCONNECTED ? X : this.values[net];
  }

  /** Run ticks until nothing changes, or the tick budget runs out. */
  private settle(initial: Iterable<number>): SettleReport {
    const { components, readers } = this.circuit;
    const budget = tickBudget(components.length);
    // Parts whose outputs changed during the last quarter of the budget: if the circuit
    // never settles, these are the ones caught in the oscillation.
    const lateChanges = new Set<number>();
    // Include anything left over from an earlier settle that never finished: a loop that
    // was still oscillating is still oscillating.
    let scheduled = new Set([...this.pending, ...initial]);
    this.pending.clear();
    let ticks = 0;

    while (scheduled.size > 0) {
      if (ticks >= budget) {
        this.pending = scheduled;
        this.report = {
          settled: false,
          ticks,
          unstable: [...lateChanges].map((i) => components[i].id),
        };
        return this.report;
      }

      // Evaluate every scheduled part using the values from BEFORE this tick...
      const changes: { net: number; value: Value; part: number }[] = [];
      for (const i of scheduled) {
        const c = components[i];
        const inputs = c.inputNets.map((net) => this.readNet(net));
        const result = c.def.evaluate(inputs, c.props, this.states[i]);
        if (result.state !== undefined) this.states[i] = result.state;
        c.outputNets.forEach((net, k) => {
          const value = result.outputs[k] ?? X;
          if (value !== this.values[net]) changes.push({ net, value, part: i });
        });
      }

      // ...then apply all of the changes at once (the "unit delay").
      const next = new Set<number>();
      for (const { net, value, part } of changes) {
        this.values[net] = value;
        if (ticks >= budget * 0.75) lateChanges.add(part);
        for (const reader of readers[net]) next.add(reader);
      }
      scheduled = next;
      ticks++;
    }

    this.report = { settled: true, ticks, unstable: [] };
    return this.report;
  }
}

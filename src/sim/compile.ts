/**
 * Compiling: turning a CircuitDoc (friendly for editing) into a netlist (fast to simulate).
 *
 * A "net" is one signal: the value on one OUTPUT pin, plus every input pin wired to it.
 * Because each input pin has at most one wire, every input pin reads exactly one net, or
 * nothing at all (unconnected → X).
 *
 *     SWITCH A ──net 0──┬──► AND.in0
 *                       └──► XOR.in0
 *
 * Compiling also finds loops (a gate whose output eventually feeds back into its own
 * input). Loops are how memory works, but they come later in the curriculum, so for now
 * the checker reports them with a friendly message.
 */
import { effectiveProps, type CircuitDoc } from './circuit';
import { findComponentDef, type ComponentDef, type Props } from './registry';

/** Marks an input pin with no wire. It always reads X. */
export const UNCONNECTED = -1;

export interface CompiledComponent {
  id: string;
  def: ComponentDef;
  props: Props;
  inputPins: string[];
  outputPins: string[];
  /** For each input pin, the net it reads (or UNCONNECTED). */
  inputNets: number[];
  /** For each output pin, the net it drives. */
  outputNets: number[];
}

export interface CompiledCircuit {
  components: CompiledComponent[];
  indexById: Map<string, number>;
  netCount: number;
  /** For each net, the indexes of the components that read it. */
  readers: number[][];
}

/** Every circuit made by compile(), so it can't be confused with a plain document. */
const compiledCircuits = new WeakSet<CompiledCircuit>();

export function isCompiled(value: unknown): value is CompiledCircuit {
  return (
    typeof value === 'object' && value !== null && compiledCircuits.has(value as CompiledCircuit)
  );
}

export function compile(doc: CircuitDoc): CompiledCircuit {
  const components: CompiledComponent[] = [];
  const indexById = new Map<string, number>();
  const netOfOutput = new Map<string, number>(); // "componentId.pinId" → net
  let netCount = 0;

  // 1. Give every output pin its own net.
  for (const instance of doc.components) {
    const def = findComponentDef(instance.type);
    if (!def) continue; // unknown parts are skipped; validateCircuit reports them
    const props = effectiveProps(instance);
    const pins = def.pins(props);
    const outputNets = pins.outputs.map((pin) => {
      netOfOutput.set(`${instance.id}.${pin.id}`, netCount);
      return netCount++;
    });
    indexById.set(instance.id, components.length);
    components.push({
      id: instance.id,
      def,
      props,
      inputPins: pins.inputs.map((p) => p.id),
      outputPins: pins.outputs.map((p) => p.id),
      inputNets: pins.inputs.map(() => UNCONNECTED),
      outputNets,
    });
  }

  // 2. Point each wired input pin at the net of the output it is connected to.
  const readers: number[][] = Array.from({ length: netCount }, () => []);
  for (const wire of doc.wires) {
    const net = netOfOutput.get(`${wire.from.component}.${wire.from.pin}`);
    const index = indexById.get(wire.to.component);
    if (net === undefined || index === undefined) continue;
    const pinIndex = components[index].inputPins.indexOf(wire.to.pin);
    if (pinIndex < 0) continue;
    components[index].inputNets[pinIndex] = net;
    if (!readers[net].includes(index)) readers[net].push(index);
  }

  const compiled = { components, indexById, netCount, readers };
  compiledCircuits.add(compiled);
  return compiled;
}

/**
 * The ids of all components that sit on a loop (including a part wired to itself).
 * Uses Tarjan's strongly-connected-components algorithm: a group of parts that can all
 * reach each other through wires is a loop.
 */
export function findLoops(circuit: CompiledCircuit): Set<string> {
  const { components } = circuit;
  const next = components.map((c) => [
    ...new Set(c.outputNets.flatMap((net) => circuit.readers[net])),
  ]);

  const inLoop = new Set<string>();
  const index: number[] = new Array(components.length).fill(-1);
  const low: number[] = new Array(components.length).fill(0);
  const onStack: boolean[] = new Array(components.length).fill(false);
  const stack: number[] = [];
  let counter = 0;

  const visit = (v: number) => {
    index[v] = low[v] = counter++;
    stack.push(v);
    onStack[v] = true;
    for (const w of next[v]) {
      if (index[w] === -1) {
        visit(w);
        low[v] = Math.min(low[v], low[w]);
      } else if (onStack[w]) {
        low[v] = Math.min(low[v], index[w]);
      }
    }
    if (low[v] === index[v]) {
      const group: number[] = [];
      let w: number;
      do {
        w = stack.pop()!;
        onStack[w] = false;
        group.push(w);
      } while (w !== v);
      const selfLoop = group.length === 1 && next[v].includes(v);
      if (group.length > 1 || selfLoop) group.forEach((i) => inLoop.add(components[i].id));
    }
  };

  for (let v = 0; v < components.length; v++) if (index[v] === -1) visit(v);
  return inLoop;
}

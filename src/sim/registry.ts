/**
 * The component registry: one entry per kind of part (AND gate, switch, light, …).
 *
 * A ComponentDef describes a part's *behavior* only – its pins and how it turns input
 * values into output values. How it *looks* lives in the editor (src/editor/nodes).
 * Later phases add parts (push buttons, seven-segment displays, flip-flops) by
 * registering new definitions; the simulator and checker never change, because they
 * only ever talk to parts through this interface.
 */
import type { Value } from './values';

export type Props = Record<string, unknown>;

export interface PinDef {
  /** Stable id used in wires, e.g. "in0", "out". */
  id: string;
}

export interface PinLayout {
  inputs: PinDef[];
  outputs: PinDef[];
}

export interface EvaluateResult {
  outputs: Value[];
  /** New internal state, for parts that remember something (switches, later flip-flops). */
  state?: unknown;
}

export interface ComponentDef {
  /** Unique type name stored in saved circuits, e.g. "AND". */
  type: string;
  /** Human-readable name, e.g. "AND gate". */
  name: string;
  category: 'io' | 'gate' | 'display' | 'sequential';
  /**
   * Marks the parts that the truth table and checker treat as the circuit's inputs and
   * outputs. They find I/O through this role, never through type names, so new I/O parts
   * (push buttons, displays) work without changes elsewhere.
   */
  io?: 'input' | 'output';
  /** One-line explanation shown in the palette and the gate reference card. */
  description: string;
  defaultProps: Props;
  pins(props: Props): PinLayout;
  /** Starting internal state, for parts that have one. */
  initialState?(props: Props): unknown;
  /**
   * Compute output values from input values. Must be a pure function of its arguments:
   * the simulator may call it any number of times.
   */
  evaluate(inputs: readonly Value[], props: Props, state: unknown): EvaluateResult;
}

const registry = new Map<string, ComponentDef>();

/** Add (or, during development hot-reload, replace) a part definition. */
export function registerComponent(def: ComponentDef): void {
  registry.set(def.type, def);
}

/** Look up a part definition, or `undefined` if the type is unknown. */
export function findComponentDef(type: string): ComponentDef | undefined {
  return registry.get(type);
}

/** Look up a part definition, throwing if the type is unknown. */
export function getComponentDef(type: string): ComponentDef {
  const def = registry.get(type);
  if (!def) throw new Error(`Unknown component type "${type}"`);
  return def;
}

export function allComponentDefs(): ComponentDef[] {
  return [...registry.values()];
}

/** The pin layout of a part with the given props (merged over its defaults). */
export function pinsOf(type: string, props: Props = {}): PinLayout {
  const def = getComponentDef(type);
  return def.pins({ ...def.defaultProps, ...props });
}

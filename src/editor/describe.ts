/**
 * A text version of the circuit on the canvas, for screen readers (and anyone who prefers
 * reading to looking): every part with its current value, and every wire.
 *
 *   Switch A: on (1)
 *   AND gate 1: output is 0
 *   Light Y: off (0)
 *   Switch A → AND gate 1, input 1
 *   AND gate 1, input 2: not connected
 *
 * In predict-first mode, values other than the switches' are hidden.
 */
import {
  digitShown,
  findComponent,
  SEGMENTS,
  findComponentDef,
  pinsOf,
  type CircuitDoc,
  type ComponentInstance,
  type PinRef,
  type Value,
} from '../sim';

/** A part's spoken name: "Switch A", "Light Y", "AND gate 1" (from id "and-1"), "NOT gate n". */
export function partName(c: ComponentInstance): string {
  const def = findComponentDef(c.type);
  if (!def) return c.id;
  if (def.io) return `${def.name} ${c.label ?? c.id}`;
  if (c.label) return `${def.name} ${c.label}`;
  const number = c.id.match(/-(\d+)$/);
  return `${def.name} ${number ? number[1] : c.id}`;
}

/**
 * "input 1" for in0, "input" for a part's only input, "output" for its only output, or the
 * pin's own name ("segment a").
 */
function pinPhrase(c: ComponentInstance, pin: string): string {
  const pins = pinsOf(c.type, c.props);
  const named = [...pins.inputs, ...pins.outputs].find((p) => p.id === pin)?.label;
  if (named) return named;
  if (pins.outputs.some((p) => p.id === pin))
    return pins.outputs.length > 1 ? `output ${pin}` : 'output';
  const index = pins.inputs.findIndex((p) => p.id === pin);
  return pins.inputs.length > 1 ? `input ${index + 1}` : 'input';
}

/** "AND gate 1, input 2" – or just "Light Y" for a part with one input. */
export function pinName(doc: CircuitDoc, ref: PinRef): string {
  const c = findComponent(doc, ref.component);
  if (!c) return ref.component;
  const pins = pinsOf(c.type, c.props);
  const single = pins.inputs.length + pins.outputs.length === 1;
  return single ? partName(c) : `${partName(c)}, ${pinPhrase(c, ref.pin)}`;
}

const spoken = (v: Value | undefined) => (v === 1 ? 'on (1)' : v === 0 ? 'off (0)' : 'unknown');

/** What a seven-segment display shows, in words: "shows 2", "blank", "no digit (b, e on)". */
export function describeDisplay(segments: readonly (Value | undefined)[]): string {
  if (segments.some((v) => v !== 0 && v !== 1)) return 'some segments are not connected';
  const lit = SEGMENTS.filter((_, i) => segments[i] === 1);
  if (lit.length === 0) return 'blank';
  const digit = digitShown(segments as Value[]);
  return digit !== undefined ? `shows ${digit}` : `no digit (segments ${lit.join(', ')} on)`;
}

/** A display's segment values, a–g, from the simulator's pin values. */
export function displaySegments(
  id: string,
  values: Readonly<Record<string, Value>>,
): (Value | undefined)[] {
  return SEGMENTS.map((s) => values[`${id}.${s}`]);
}

export interface CircuitDescription {
  parts: string[];
  wires: { id: string; text: string }[];
  /** Inputs with no wire, e.g. "AND gate 1, input 2: not connected". */
  loose: string[];
}

export function describeCircuit(
  doc: CircuitDoc,
  values: Readonly<Record<string, Value>>,
  { hideValues = false }: { hideValues?: boolean } = {},
): CircuitDescription {
  const parts = doc.components.map((c) => {
    const def = findComponentDef(c.type);
    const name = partName(c);
    if (c.type === 'PUSH_BUTTON') {
      return `${name}: ${values[`${c.id}.out`] === 1 ? 'held down (1)' : 'up (0)'}`;
    }
    if (def?.io === 'input') return `${name}: ${spoken(values[`${c.id}.out`])}`;
    if (hideValues) return `${name}: value hidden until you check`;
    if (c.type === 'SEVEN_SEG') return `${name}: ${describeDisplay(displaySegments(c.id, values))}`;
    if (def?.io === 'output') {
      const v = values[`${c.id}.in`];
      return `${name}: ${v === 'X' || v === undefined ? 'unknown – check its wire' : spoken(v)}`;
    }
    const out = values[`${c.id}.out`];
    return `${name}: output is ${out === 1 ? '1' : out === 0 ? '0' : 'unknown'}`;
  });
  const wires = doc.wires.map((w) => ({
    id: w.id,
    text: `${pinName(doc, w.from)} → ${pinName(doc, w.to)}`,
  }));
  const connected = new Set(doc.wires.map((w) => `${w.to.component}.${w.to.pin}`));
  const loose = doc.components.flatMap((c) =>
    pinsOf(c.type, c.props)
      .inputs.filter((p) => !connected.has(`${c.id}.${p.id}`))
      .map((p) => `${pinName(doc, { component: c.id, pin: p.id })}: not connected`),
  );
  return { parts, wires, loose };
}

/** "from Switch A to AND gate 1, input 1" */
export function wireEnds(doc: CircuitDoc, wire: { from: PinRef; to: PinRef }): string {
  return `from ${pinName(doc, wire.from)} to ${pinName(doc, wire.to)}`;
}

/**
 * What a deletion removed, as a sentence for screen readers: "Deleted AND gate 1 and 2
 * wires." or "Removed the wire from Switch A to Light Y." Empty if nothing was removed.
 */
export function describeRemoval(before: CircuitDoc, after: CircuitDoc): string {
  const keptParts = new Set(after.components.map((c) => c.id));
  const keptWires = new Set(after.wires.map((w) => w.id));
  const parts = before.components.filter((c) => !keptParts.has(c.id)).map(partName);
  const wires = before.wires.filter((w) => !keptWires.has(w.id));
  const wireCount = wires.length === 1 ? '1 wire' : `${wires.length} wires`;
  if (parts.length > 0) {
    return `Deleted ${parts.join(', ')}${wires.length ? ` and ${wireCount}` : ''}.`;
  }
  if (wires.length === 1) return `Removed the wire ${wireEnds(before, wires[0])}.`;
  return wires.length ? `Removed ${wireCount}.` : '';
}

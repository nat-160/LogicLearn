/**
 * The circuit document: the single source of truth for a student's design.
 *
 * A CircuitDoc is plain, serializable data – the parts, where they sit, and the wires
 * between their pins. It deliberately holds NO simulation values (which wires are on):
 * those live in the Simulator. That keeps saved files, share links and undo/redo about
 * the *design* only.
 *
 * All edit operations here are pure functions: they return a new document and never
 * modify the old one. The editor's undo/redo is just a list of previous documents.
 */
import './components'; // registers the built-in parts
import { findComponentDef, pinsOf, type Props } from './registry';

export const SCHEMA_VERSION = 1;

export interface Position {
  x: number;
  y: number;
}

export interface ComponentInstance {
  id: string;
  /** Registry type, e.g. "AND", "SWITCH", "LIGHT". */
  type: string;
  position: Position;
  /** Reserved for later: rotated parts. */
  rotation?: 0 | 90 | 180 | 270;
  /** Name shown on the part and used by truth tables and checks, e.g. "A", "Y". */
  label?: string;
  props: Props;
  /** Lesson-provided parts that students cannot move or delete. */
  locked?: boolean;
}

export interface PinRef {
  component: string;
  pin: string;
}

export interface Wire {
  id: string;
  /** Always an OUTPUT pin. */
  from: PinRef;
  /** Always an INPUT pin. Each input pin has at most one wire (the single-driver rule). */
  to: PinRef;
  /** Reserved for later: drawn wire routing (bend points). */
  waypoints?: Position[];
}

export interface CircuitDoc {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  components: ComponentInstance[];
  wires: Wire[];
}

export function emptyCircuit(name = 'Untitled circuit', id = 'circuit'): CircuitDoc {
  return { schemaVersion: SCHEMA_VERSION, id, name, components: [], wires: [] };
}

export function findComponent(doc: CircuitDoc, id: string): ComponentInstance | undefined {
  return doc.components.find((c) => c.id === id);
}

/** A part's props merged over its type's defaults. */
export function effectiveProps(component: ComponentInstance): Props {
  const def = findComponentDef(component.type);
  return { ...def?.defaultProps, ...component.props };
}

// ---------------------------------------------------------------------------
// Ids and automatic labels
// ---------------------------------------------------------------------------

/** A short id that is not used yet, like "and-3". */
export function nextId(doc: CircuitDoc, prefix: string): string {
  const used = new Set([...doc.components.map((c) => c.id), ...doc.wires.map((w) => w.id)]);
  for (let n = 1; ; n++) {
    const id = `${prefix}-${n}`;
    if (!used.has(id)) return id;
  }
}

const INPUT_LABELS = 'ABCDEFGHJKLMNP'.split('');
const OUTPUT_LABELS = ['Y', 'Z', 'Q', 'R', 'S', 'T', 'U', 'V', 'W'];

/** The next free label for a new input (A, B, C, …) or output (Y, Z, Q, …). */
export function nextLabel(doc: CircuitDoc, role: 'input' | 'output'): string {
  // An unlabeled input/output is known by its id in truth tables, so ids count as used too.
  const used = new Set(doc.components.flatMap((c) => [c.label?.trim(), c.id]));
  const candidates = role === 'input' ? INPUT_LABELS : OUTPUT_LABELS;
  const free = candidates.find((label) => !used.has(label));
  if (free) return free;
  const prefix = role === 'input' ? 'In' : 'Out';
  for (let n = 1; ; n++) if (!used.has(`${prefix}${n}`)) return `${prefix}${n}`;
}

// ---------------------------------------------------------------------------
// Edit operations (pure: each returns a new document)
// ---------------------------------------------------------------------------

export interface AddResult {
  doc: CircuitDoc;
  id: string;
}

/** Add a part. Inputs and outputs get an automatic label (A, B, … / Y, Z, …). */
export function addComponent(
  doc: CircuitDoc,
  type: string,
  position: Position,
  options: { id?: string; label?: string; props?: Props; locked?: boolean } = {},
): AddResult {
  const def = findComponentDef(type);
  if (!def) throw new Error(`Unknown component type "${type}"`);
  const id = options.id ?? nextId(doc, type.toLowerCase());
  if (!isSafeId(id)) throw new Error(`"${id}" can't be used as a part id`);
  if (findComponent(doc, id)) throw new Error(`There is already a part with id "${id}"`);
  const label = options.label ?? (def.io ? nextLabel(doc, def.io) : undefined);
  const component: ComponentInstance = {
    id,
    type,
    position: { ...position },
    props: { ...options.props },
    ...(label !== undefined && { label }),
    ...(options.locked && { locked: true }),
  };
  return { doc: { ...doc, components: [...doc.components, component] }, id };
}

export function moveComponent(doc: CircuitDoc, id: string, position: Position): CircuitDoc {
  return {
    ...doc,
    components: doc.components.map((c) =>
      c.id === id && !c.locked ? { ...c, position: { ...position } } : c,
    ),
  };
}

export function setLabel(doc: CircuitDoc, id: string, label: string): CircuitDoc {
  const trimmed = label.trim();
  return {
    ...doc,
    components: doc.components.map((c) => {
      if (c.id !== id || c.locked) return c;
      if (!trimmed) {
        // Removing a label: drop the field rather than storing an empty string.
        const rest = { ...c };
        delete rest.label;
        return rest;
      }
      return { ...c, label: trimmed };
    }),
  };
}

/**
 * Change a part's settings (e.g. a light's color, a gate's number of inputs). If the
 * change removes pins, the wires attached to those pins are removed too, so the
 * document never refers to pins that don't exist.
 */
export function setProps(doc: CircuitDoc, id: string, props: Props): CircuitDoc {
  const target = findComponent(doc, id);
  if (!target || target.locked) return doc;
  const updated = { ...target, props: { ...target.props, ...props } };
  const pins = pinsOf(updated.type, updated.props);
  const inputs = new Set(pins.inputs.map((p) => p.id));
  const outputs = new Set(pins.outputs.map((p) => p.id));
  return {
    ...doc,
    components: doc.components.map((c) => (c.id === id ? updated : c)),
    wires: doc.wires.filter(
      (w) =>
        (w.to.component !== id || inputs.has(w.to.pin)) &&
        (w.from.component !== id || outputs.has(w.from.pin)),
    ),
  };
}

/**
 * Ids are used as keys in plain objects (switch settings, pin values), so names that
 * mean something special to JavaScript objects are not allowed.
 */
const RESERVED_IDS = new Set(['__proto__', 'constructor', 'prototype']);
/** Letters, digits, "_" and "-" only: no "." because pins are written "part.pin". */
const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

export function isSafeId(id: unknown): id is string {
  return typeof id === 'string' && ID_PATTERN.test(id) && !RESERVED_IDS.has(id);
}

export type PinDirection = 'input' | 'output';

/** Whether `pin` exists on the component, and which way it points. */
export function pinDirection(doc: CircuitDoc, ref: PinRef): PinDirection | undefined {
  const component = findComponent(doc, ref.component);
  if (!component || !findComponentDef(component.type)) return undefined;
  const pins = pinsOf(component.type, component.props);
  if (pins.inputs.some((p) => p.id === ref.pin)) return 'input';
  if (pins.outputs.some((p) => p.id === ref.pin)) return 'output';
  return undefined;
}

export type ConnectResult =
  { ok: true; doc: CircuitDoc; id: string } | { ok: false; reason: string };

/**
 * Connect two pins with a wire. The pins may be given in either order, as long as one is
 * an output and the other an input.
 *
 * Single-driver rule: an input pin listens to exactly one wire. Connecting a new wire to
 * an input that already has one REPLACES the old wire. This means two outputs can never
 * fight over the same wire, so there is no "short circuit" state to explain.
 */
export function connect(doc: CircuitDoc, a: PinRef, b: PinRef): ConnectResult {
  const dirA = pinDirection(doc, a);
  const dirB = pinDirection(doc, b);
  if (!dirA || !dirB) return { ok: false, reason: 'That pin does not exist.' };
  if (dirA === dirB) {
    return {
      ok: false,
      reason:
        dirA === 'input'
          ? 'Connect an output to an input (both of these are inputs).'
          : 'Connect an output to an input (both of these are outputs).',
    };
  }
  const from = dirA === 'output' ? a : b;
  const to = dirA === 'output' ? b : a;
  const existing = doc.wires.find((w) => samePin(w.to, to));
  if (existing && samePin(existing.from, from)) {
    return { ok: true, doc, id: existing.id }; // already connected
  }
  const id = nextId(doc, 'wire');
  const wires = doc.wires.filter((w) => !samePin(w.to, to));
  wires.push({ id, from: { ...from }, to: { ...to } });
  return { ok: true, doc: { ...doc, wires }, id };
}

/**
 * Remove parts and wires. Wires attached to a removed part go with it.
 * Locked (lesson-provided) parts are never removed.
 */
export function removeItems(
  doc: CircuitDoc,
  componentIds: Iterable<string>,
  wireIds: Iterable<string> = [],
): CircuitDoc {
  const removeComponents = new Set(
    [...componentIds].filter((id) => !findComponent(doc, id)?.locked),
  );
  const removeWires = new Set(wireIds);
  return {
    ...doc,
    components: doc.components.filter((c) => !removeComponents.has(c.id)),
    wires: doc.wires.filter(
      (w) =>
        !removeWires.has(w.id) &&
        !removeComponents.has(w.from.component) &&
        !removeComponents.has(w.to.component),
    ),
  };
}

/** The same circuit with every part unlocked (for the sandbox, where nothing is "the task"). */
export function unlockAll(doc: CircuitDoc): CircuitDoc {
  if (!doc.components.some((c) => c.locked)) return doc;
  return {
    ...doc,
    components: doc.components.map((c) => {
      const copy = { ...c };
      delete copy.locked;
      return copy;
    }),
  };
}

export function samePin(a: PinRef, b: PinRef): boolean {
  return a.component === b.component && a.pin === b.pin;
}

// ---------------------------------------------------------------------------
// A compact way to write circuits in code (tests, lesson starters and solutions)
// ---------------------------------------------------------------------------

export interface PartSpec {
  id: string;
  type: string;
  /** Grid position [column, row]; one cell is GRID_CELL pixels. */
  at?: [number, number];
  label?: string;
  props?: Props;
  locked?: boolean;
}

/** One grid cell of the editor, in pixels. Parts snap to multiples of this. */
export const GRID_CELL = 20;

/**
 * Build a circuit from a short description:
 *
 *   buildCircuit({
 *     parts: [
 *       { id: 'A', type: 'SWITCH' }, { id: 'B', type: 'SWITCH' },
 *       { id: 'g', type: 'XOR' },    { id: 'Y', type: 'LIGHT' },
 *     ],
 *     wires: [['A', 'g.in0'], ['B', 'g.in1'], ['g', 'Y']],
 *   });
 *
 * In a wire, "g" alone means "g's only output pin" (when it is the source) or "g's
 * only input pin" (when it is the target). Inputs and outputs are labeled with their
 * id unless a label is given.
 */
export function buildCircuit(spec: {
  name?: string;
  parts: PartSpec[];
  wires?: [string, string][];
}): CircuitDoc {
  let doc = emptyCircuit(spec.name);
  spec.parts.forEach((part, i) => {
    const def = findComponentDef(part.type);
    if (!def) throw new Error(`Unknown component type "${part.type}"`);
    const [col, row] = part.at ?? [i * 6, 0];
    doc = addComponent(
      doc,
      part.type,
      { x: col * GRID_CELL, y: row * GRID_CELL },
      {
        id: part.id,
        label: part.label ?? (def.io ? part.id : undefined),
        props: part.props,
        locked: part.locked,
      },
    ).doc;
  });
  for (const [fromSpec, toSpec] of spec.wires ?? []) {
    const result = connect(
      doc,
      resolvePin(doc, fromSpec, 'output'),
      resolvePin(doc, toSpec, 'input'),
    );
    if (!result.ok) throw new Error(`Cannot wire ${fromSpec} → ${toSpec}: ${result.reason}`);
    doc = result.doc;
  }
  return doc;
}

function resolvePin(doc: CircuitDoc, text: string, direction: PinDirection): PinRef {
  const [componentId, pinId] = text.split('.');
  const component = findComponent(doc, componentId);
  if (!component) throw new Error(`No part with id "${componentId}"`);
  if (pinId) return { component: componentId, pin: pinId };
  const pins = pinsOf(component.type, component.props);
  const candidates = direction === 'output' ? pins.outputs : pins.inputs;
  if (candidates.length !== 1) {
    throw new Error(`"${componentId}" has ${candidates.length} ${direction} pins; name one`);
  }
  return { component: componentId, pin: candidates[0].id };
}

/**
 * Saving and loading circuits as JSON (files, share links, localStorage).
 *
 * Anything loaded from outside – an uploaded file, a link someone pasted – is untrusted,
 * so it is checked field by field before the app uses it. Problems come back as
 * friendly messages instead of crashes.
 *
 * `schemaVersion` lets the format change later: `migrate()` upgrades older documents
 * step by step, so files saved today keep opening.
 */
import {
  isSafeId,
  SCHEMA_VERSION,
  type CircuitDoc,
  type ComponentInstance,
  type Position,
  type Wire,
} from './circuit';
import { findComponentDef, pinsOf } from './registry';

/** Limits that keep a hostile or broken file from freezing the page. */
export const MAX_PARTS = 2000;
export const MAX_WIRES = 6000;
const MAX_TEXT = 200;

export type LoadResult = { ok: true; doc: CircuitDoc } | { ok: false; errors: string[] };

export function serializeCircuit(doc: CircuitDoc): string {
  return JSON.stringify(doc);
}

/** Parse JSON text into a checked, up-to-date circuit document. */
export function parseCircuit(text: string): LoadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: ['This is not a circuit file (it is not valid JSON).'] };
  }
  return loadCircuit(raw);
}

/** Upgrade (if needed) and check an already-parsed value. */
export function loadCircuit(raw: unknown): LoadResult {
  const migrated = migrate(raw);
  if (!migrated.ok) return migrated;
  return validateCircuit(migrated.value);
}

/**
 * Upgrade an older document to the current schema. There is only version 1 so far;
 * when version 2 arrives, add a `if (version === 1) { …convert…; version = 2 }` step.
 */
export function migrate(raw: unknown): { ok: true; value: unknown } | { ok: false; errors: string[] } {
  if (!isObject(raw)) return { ok: false, errors: ['This is not a circuit file.'] };
  const version = raw.schemaVersion;
  if (typeof version !== 'number') {
    return { ok: false, errors: ['This is not a circuit file (no schemaVersion).'] };
  }
  if (version > SCHEMA_VERSION) {
    return {
      ok: false,
      errors: ['This circuit was made with a newer version of LogicLearn. Refresh the page and try again.'],
    };
  }
  return { ok: true, value: raw };
}

/**
 * Check every field of a document. Returns all problems found, not just the first.
 * On success the document is REBUILT from the checked fields only, so unexpected extra
 * data in a file can never reach the rest of the app.
 */
export function validateCircuit(raw: unknown): LoadResult {
  const errors: string[] = [];
  if (!isObject(raw)) return { ok: false, errors: ['This is not a circuit file.'] };
  if (raw.schemaVersion !== SCHEMA_VERSION) errors.push('Unsupported schemaVersion.');
  if (!isShortText(raw.id)) errors.push('Missing circuit id.');
  if (!isShortText(raw.name)) errors.push('Missing circuit name.');
  if (!Array.isArray(raw.components)) errors.push('Missing list of parts.');
  if (!Array.isArray(raw.wires)) errors.push('Missing list of wires.');
  if (errors.length) return { ok: false, errors };

  const rawComponents = raw.components as unknown[];
  const rawWires = raw.wires as unknown[];
  if (rawComponents.length > MAX_PARTS || rawWires.length > MAX_WIRES) {
    return { ok: false, errors: [`This circuit is too big (the limit is ${MAX_PARTS} parts).`] };
  }

  const components: ComponentInstance[] = [];
  const pinTable = new Map<string, { inputs: Set<string>; outputs: Set<string> }>();
  rawComponents.forEach((c, i) => {
    const where = `Part ${i + 1}`;
    if (!isObject(c)) return errors.push(`${where} is not valid.`);
    if (!isSafeId(c.id)) return errors.push(`${where} has a missing or invalid id.`);
    if (pinTable.has(c.id)) return errors.push(`Two parts share the id "${c.id}".`);
    if (typeof c.type !== 'string' || !findComponentDef(c.type)) {
      return errors.push(`${where} has an unknown type "${String(c.type)}".`);
    }
    if (!isPosition(c.position)) return errors.push(`${where} has no valid position.`);
    if (c.label !== undefined && !isShortText(c.label)) errors.push(`${where} has a bad label.`);
    if (c.locked !== undefined && typeof c.locked !== 'boolean') errors.push(`${where} has a bad "locked" flag.`);
    if (c.rotation !== undefined && ![0, 90, 180, 270].includes(c.rotation as number)) {
      errors.push(`${where} has a bad rotation.`);
    }
    if (!isObject(c.props)) return errors.push(`${where} has no props object.`);
    const pins = pinsOf(c.type, c.props);
    pinTable.set(c.id, {
      inputs: new Set(pins.inputs.map((p) => p.id)),
      outputs: new Set(pins.outputs.map((p) => p.id)),
    });
    components.push({
      id: c.id,
      type: c.type,
      position: { x: c.position.x, y: c.position.y },
      props: { ...c.props },
      ...(typeof c.label === 'string' && { label: c.label }),
      ...(c.locked === true && { locked: true }),
      ...(c.rotation !== undefined && { rotation: c.rotation as ComponentInstance['rotation'] }),
    });
  });

  const wires: Wire[] = [];
  const wireIds = new Set<string>();
  const drivenInputs = new Set<string>();
  rawWires.forEach((w, i) => {
    const where = `Wire ${i + 1}`;
    if (!isObject(w) || !isSafeId(w.id)) return errors.push(`${where} is not valid.`);
    if (wireIds.has(w.id)) return errors.push(`Two wires share the id "${w.id}".`);
    wireIds.add(w.id);
    if (!isPinRef(w.from) || !isPinRef(w.to)) return errors.push(`${where} has bad ends.`);
    if (!pinTable.get(w.from.component)?.outputs.has(w.from.pin)) {
      errors.push(`${where} does not start at an output pin.`);
    }
    if (!pinTable.get(w.to.component)?.inputs.has(w.to.pin)) {
      errors.push(`${where} does not end at an input pin.`);
    }
    const key = `${w.to.component}.${w.to.pin}`;
    if (drivenInputs.has(key)) errors.push(`Input ${key} has more than one wire.`);
    drivenInputs.add(key);
    if (w.waypoints !== undefined && !(Array.isArray(w.waypoints) && w.waypoints.every(isPosition))) {
      errors.push(`${where} has bad waypoints.`);
    }
    wires.push({
      id: w.id,
      from: { component: w.from.component, pin: w.from.pin },
      to: { component: w.to.component, pin: w.to.pin },
      ...(Array.isArray(w.waypoints) && {
        waypoints: (w.waypoints as Position[]).map((p) => ({ x: p.x, y: p.y })),
      }),
    });
  });

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    doc: { schemaVersion: SCHEMA_VERSION, id: raw.id as string, name: raw.name as string, components, wires },
  };
}

function isShortText(value: unknown): value is string {
  return typeof value === 'string' && value.length <= MAX_TEXT;
}

function isPosition(value: unknown): value is Position {
  return isObject(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isPinRef(value: unknown): value is { component: string; pin: string } {
  return isObject(value) && typeof value.component === 'string' && typeof value.pin === 'string';
}

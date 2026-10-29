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
import { SCHEMA_VERSION, type CircuitDoc } from './circuit';
import { findComponentDef, pinsOf } from './registry';

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

/** Check every field of a document. Returns all problems found, not just the first. */
export function validateCircuit(raw: unknown): LoadResult {
  const errors: string[] = [];
  if (!isObject(raw)) return { ok: false, errors: ['This is not a circuit file.'] };
  if (raw.schemaVersion !== SCHEMA_VERSION) errors.push('Unsupported schemaVersion.');
  if (typeof raw.id !== 'string') errors.push('Missing circuit id.');
  if (typeof raw.name !== 'string') errors.push('Missing circuit name.');
  if (!Array.isArray(raw.components)) errors.push('Missing list of parts.');
  if (!Array.isArray(raw.wires)) errors.push('Missing list of wires.');
  if (errors.length) return { ok: false, errors };

  const components = raw.components as unknown[];
  const wires = raw.wires as unknown[];
  const pinTable = new Map<string, { inputs: Set<string>; outputs: Set<string> }>();

  components.forEach((c, i) => {
    const where = `Part ${i + 1}`;
    if (!isObject(c)) return errors.push(`${where} is not valid.`);
    if (typeof c.id !== 'string' || !c.id) return errors.push(`${where} has no id.`);
    if (pinTable.has(c.id)) return errors.push(`Two parts share the id "${c.id}".`);
    if (typeof c.type !== 'string' || !findComponentDef(c.type)) {
      return errors.push(`${where} has an unknown type "${String(c.type)}".`);
    }
    if (!isObject(c.position) || !isFiniteNumber(c.position.x) || !isFiniteNumber(c.position.y)) {
      return errors.push(`${where} has no valid position.`);
    }
    if (c.label !== undefined && typeof c.label !== 'string') errors.push(`${where} has a bad label.`);
    if (!isObject(c.props)) return errors.push(`${where} has no props object.`);
    const pins = pinsOf(c.type, c.props);
    pinTable.set(c.id, {
      inputs: new Set(pins.inputs.map((p) => p.id)),
      outputs: new Set(pins.outputs.map((p) => p.id)),
    });
  });

  const wireIds = new Set<string>();
  const drivenInputs = new Set<string>();
  wires.forEach((w, i) => {
    const where = `Wire ${i + 1}`;
    if (!isObject(w) || typeof w.id !== 'string') return errors.push(`${where} is not valid.`);
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
  });

  if (errors.length) return { ok: false, errors };
  return { ok: true, doc: raw as unknown as CircuitDoc };
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

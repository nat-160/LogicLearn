/**
 * The checker: does a student's circuit do what the task asks?
 *
 * A CheckSpec is plain data: the input and output labels, the expected truth table, and
 * optional rules about which gates may be used. `check()` runs EVERY row of the table, so
 * it never falls for "proof by incomplete enumeration". It returns structured results –
 * exactly which rows are wrong, and why – so the UI can highlight those rows and the hint
 * system can respond to the specific mistake.
 */
import { compile, findLoops, UNCONNECTED } from './compile';
import type { CircuitDoc } from './circuit';
import { diagnoseMisconception, type Misconception } from './misconceptions';
import { findComponentDef } from './registry';
import { evaluateRow, findIO, type IOPart } from './truthTable';
import { allInputRows, type Bit, type Value } from './values';

export interface CheckRow {
  inputs: Bit[];
  outputs: Bit[];
}

export interface CheckSpec {
  /** Input labels, in truth-table column order, e.g. ["A", "B"]. */
  inputs: string[];
  /** Output labels, e.g. ["Y"]. */
  outputs: string[];
  /** The rows to check. Use `rowsFrom()` to generate a full table from a function. */
  expected: CheckRow[];
  /** Rules about gates. Input and output parts (switches, lights) never count. */
  constraints?: {
    /** Only these gate types may be used, e.g. ["NAND"]. */
    allowedTypes?: string[];
    /** At most this many gates. */
    maxGates?: number;
    /** Each of these gate types must be used at least once. */
    requiredTypes?: string[];
  };
}

export type DiagnosticCode =
  | 'MISSING_IO'
  | 'EXTRA_IO'
  | 'DUPLICATE_LABEL'
  | 'UNCONNECTED_INPUT'
  | 'OUTPUT_UNKNOWN'
  | 'HAS_CYCLE'
  | 'OSCILLATES'
  | 'DISALLOWED_TYPE'
  | 'TOO_MANY_GATES'
  | 'MISSING_REQUIRED_TYPE';

export interface Diagnostic {
  code: DiagnosticCode;
  /** Errors make the check fail; warnings are advice. */
  severity: 'error' | 'warning';
  message: string;
  /** Parts to highlight in the editor. */
  componentIds?: string[];
}

export interface CheckedRow {
  inputs: Bit[];
  expected: Bit[];
  actual: Value[];
  correct: boolean;
}

export interface CheckResult {
  pass: boolean;
  /** Every row that was run, right or wrong (empty if the circuit could not be run). */
  rows: CheckedRow[];
  /** Just the wrong rows. */
  mismatches: CheckedRow[];
  diagnostics: Diagnostic[];
  /** A recognized mistake (see misconceptions.ts), if the wrong rows match one. */
  misconception?: Misconception;
}

/**
 * Generate every row of a truth table from a function, e.g. XOR:
 *   rowsFrom(2, (a, b) => (a ^ b) as Bit)
 * Return an array for several outputs: rowsFrom(2, (a, b) => [a & b, a ^ b] as Bit[]).
 */
export function rowsFrom(inputCount: number, fn: (...bits: Bit[]) => Bit | Bit[]): CheckRow[] {
  return allInputRows(inputCount).map((inputs) => {
    const out = fn(...inputs);
    return { inputs, outputs: Array.isArray(out) ? out : [out] };
  });
}

export function check(doc: CircuitDoc, spec: CheckSpec): CheckResult {
  assertWellFormed(spec);
  const diagnostics: Diagnostic[] = [];
  const io = findIO(doc);
  const all = [...io.inputs, ...io.outputs];

  // --- Inputs and outputs: are the right ones there, with unique labels? ---
  const labelCounts = new Map<string, IOPart[]>();
  for (const part of all) labelCounts.set(part.label, [...(labelCounts.get(part.label) ?? []), part]);
  for (const [label, parts] of labelCounts) {
    if (parts.length > 1) {
      diagnostics.push({
        code: 'DUPLICATE_LABEL',
        severity: 'error',
        message: `${parts.length} parts are labeled "${label}". Give each input and output its own label.`,
        componentIds: parts.map((p) => p.id),
      });
    }
  }
  const findPart = (label: string, role: 'input' | 'output') =>
    (role === 'input' ? io.inputs : io.outputs).find((p) => p.label === label);
  const specInputs = spec.inputs.map((label) => findPart(label, 'input'));
  const specOutputs = spec.outputs.map((label) => findPart(label, 'output'));
  spec.inputs.forEach((label, i) => {
    if (!specInputs[i]) {
      diagnostics.push({
        code: 'MISSING_IO',
        severity: 'error',
        message: `Your circuit needs an input (switch) labeled "${label}".`,
      });
    }
  });
  spec.outputs.forEach((label, i) => {
    if (!specOutputs[i]) {
      diagnostics.push({
        code: 'MISSING_IO',
        severity: 'error',
        message: `Your circuit needs an output (light) labeled "${label}".`,
      });
    }
  });
  const expectedLabels = new Set([...spec.inputs, ...spec.outputs]);
  const extras = all.filter((p) => !expectedLabels.has(p.label));
  if (extras.length) {
    diagnostics.push({
      code: 'EXTRA_IO',
      severity: 'warning',
      message: `This task doesn't use ${extras.map((p) => `"${p.label}"`).join(', ')}. Extra switches are kept off during the check.`,
      componentIds: extras.map((p) => p.id),
    });
  }

  // --- Gate rules (switches and lights never count) ---
  const gates = doc.components.filter((c) => findComponentDef(c.type)?.category === 'gate');
  const rules = spec.constraints ?? {};
  if (rules.allowedTypes) {
    const banned = gates.filter((g) => !rules.allowedTypes!.includes(g.type));
    if (banned.length) {
      diagnostics.push({
        code: 'DISALLOWED_TYPE',
        severity: 'error',
        message: `For this task you may only use ${rules.allowedTypes.join(', ')} gates.`,
        componentIds: banned.map((g) => g.id),
      });
    }
  }
  for (const type of rules.requiredTypes ?? []) {
    if (!gates.some((g) => g.type === type)) {
      diagnostics.push({
        code: 'MISSING_REQUIRED_TYPE',
        severity: 'error',
        message: `This task needs at least one ${type} gate.`,
      });
    }
  }
  if (rules.maxGates !== undefined && gates.length > rules.maxGates) {
    diagnostics.push({
      code: 'TOO_MANY_GATES',
      severity: 'error',
      message: `Use at most ${rules.maxGates} gates (you have ${gates.length}).`,
      componentIds: gates.map((g) => g.id),
    });
  }

  // --- Wiring: loops and loose inputs ---
  const circuit = compile(doc);
  const loops = findLoops(circuit);
  if (loops.size) {
    diagnostics.push({
      code: 'HAS_CYCLE',
      severity: 'error',
      message:
        "Part of your circuit loops back into itself. Loops are how computers remember things – that comes in a later lesson. For now, make sure signals only flow forward.",
      componentIds: [...loops],
    });
  }
  const loose = circuit.components.filter(
    (c) => c.def.io !== 'input' && c.inputNets.includes(UNCONNECTED),
  );
  if (loose.length) {
    diagnostics.push({
      code: 'UNCONNECTED_INPUT',
      severity: 'warning',
      message: 'Some inputs are not connected to anything (shown as gray dashed X).',
      componentIds: loose.map((c) => c.id),
    });
  }

  // Can't run the truth table without the right inputs/outputs, or with a loop.
  const blocked = diagnostics.some(
    (d) => d.code === 'MISSING_IO' || d.code === 'DUPLICATE_LABEL' || d.code === 'HAS_CYCLE',
  );
  if (blocked) return { pass: false, rows: [], mismatches: [], diagnostics };

  // --- Run every row ---
  const inputParts = specInputs as IOPart[];
  const outputParts = specOutputs as IOPart[];
  const rows: CheckedRow[] = [];
  let unknown = false;
  let oscillates = false;
  for (const row of spec.expected) {
    const result = evaluateRow(circuit, inputParts, row.inputs, outputParts);
    if (!result.settled) oscillates = true;
    if (result.outputs.includes('X')) unknown = true;
    rows.push({
      inputs: row.inputs,
      expected: row.outputs,
      actual: result.outputs,
      correct: row.outputs.every((bit, i) => result.outputs[i] === bit),
    });
  }
  if (unknown) {
    diagnostics.push({
      code: 'OUTPUT_UNKNOWN',
      severity: 'error',
      message: 'An output shows X (unknown) for some rows. Is everything connected?',
      componentIds: outputParts.map((p) => p.id),
    });
  }
  if (oscillates) {
    diagnostics.push({
      code: 'OSCILLATES',
      severity: 'error',
      message: 'Your circuit never settles for some inputs – its outputs keep flipping.',
    });
  }

  const mismatches = rows.filter((r) => !r.correct);
  const misconception = diagnoseMisconception({
    inputCount: spec.inputs.length,
    outputCount: spec.outputs.length,
    rows,
  });
  const pass = mismatches.length === 0 && !diagnostics.some((d) => d.severity === 'error');
  return { pass, rows, mismatches, diagnostics, ...(misconception && { misconception }) };
}

/** Catch mistakes in a spec itself (a lesson-authoring bug, not a student mistake). */
function assertWellFormed(spec: CheckSpec): void {
  for (const row of spec.expected) {
    if (row.inputs.length !== spec.inputs.length || row.outputs.length !== spec.outputs.length) {
      throw new Error(
        `CheckSpec row ${JSON.stringify(row)} does not match ${spec.inputs.length} inputs / ${spec.outputs.length} outputs`,
      );
    }
  }
}

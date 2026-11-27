/**
 * The two hints worked out from the student's own circuit, after the step's written hints
 * (which remind them of the gate or the idea):
 *
 *  - "Look at your circuit": what to look at – a part that isn't connected, or the gate
 *    that drives a wrong output ("Look at OR gate 1: it drives Y, and Y is wrong in 1 of
 *    4 rows").
 *  - "Try one row": one wrong row, walked through gate by gate ("With A = 1, B = 1, OR
 *    gate 1 gets 1 and 1 and gives 1, so Y is 1. The task wants 0.").
 *
 * Neither gives the answer: the student still has to work out the fix. Both are computed
 * from the circuit as it is now (a check that is not counted as an attempt), so they stay
 * true as the student edits.
 */
import { partName } from '../editor/describe';
import { rowText, valueText } from '../editor/checkSummary';
import {
  check,
  findComponent,
  findComponentDef,
  traceRow,
  type Bit,
  type CheckSpec,
  type CircuitDoc,
  type DiagnosticCode,
  type Value,
} from '../sim';

export interface CircuitHint {
  text: string;
  /** Parts the hint is about (they can be pointed out on the canvas). */
  partIds?: string[];
  /** A row of the task to try (the switch settings, by input label). */
  row?: { labels: string[]; bits: Bit[] };
}

const ALREADY_RIGHT: CircuitHint = {
  text: 'Your circuit already gives the right output in every row. Press Check!',
};

/** The output part (and its pin, for a display) behind a truth-table column label. */
function outputPart(doc: CircuitDoc, label: string): { id: string; pin?: string } | undefined {
  const [partLabel, pin] = label.split('.');
  const part = doc.components.find(
    (c) => findComponentDef(c.type)?.io === 'output' && (c.label ?? c.id) === partLabel,
  );
  return part && { id: part.id, ...(pin && { pin }) };
}

/** The component whose output is wired to an output part's pin, if any. */
function driverOf(doc: CircuitDoc, out: { id: string; pin?: string }): string | undefined {
  const wire = doc.wires.find(
    (w) => w.to.component === out.id && (out.pin === undefined || w.to.pin === out.pin),
  );
  return wire?.from.component;
}

/** Every component that feeds `id`, directly or through other parts (and `id` itself). */
function feeders(doc: CircuitDoc, id: string): Set<string> {
  const found = new Set([id]);
  const queue = [id];
  while (queue.length) {
    const current = queue.pop()!;
    for (const w of doc.wires) {
      if (w.to.component === current && !found.has(w.from.component)) {
        found.add(w.from.component);
        queue.push(w.from.component);
      }
    }
  }
  return found;
}

const name = (doc: CircuitDoc, id: string) => {
  const c = findComponent(doc, id);
  return c ? partName(c) : id;
};

/** "gets 1 and 0" / "gets 1" / "gets 1, 0 and 1". */
function getsText(values: readonly Value[]): string {
  const words = values.map(valueText);
  return words.length <= 1
    ? words.join('')
    : `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`;
}

/** The circuit's problem, or its most-wrong output; shared by both hints. */
function diagnose(doc: CircuitDoc, spec: CheckSpec) {
  const result = check(doc, spec);
  const errors = result.diagnostics.filter((d) => d.severity === 'error');
  // A loose gate input is only a warning, but it is usually why an output is unknown.
  if (errors.length) {
    errors.push(...result.diagnostics.filter((d) => d.code === 'UNCONNECTED_INPUT'));
  }
  // The most useful problem to point at first: an unknown output is usually caused by
  // a missing part or a loose input, so those come before it.
  const rank = (code: DiagnosticCode) => {
    const i = FIRST.indexOf(code);
    return i < 0 ? FIRST.length : i;
  };
  const error = [...errors].sort((a, b) => rank(a.code) - rank(b.code))[0];
  return { result, error };
}

const FIRST: DiagnosticCode[] = [
  'MISSING_IO',
  'DUPLICATE_LABEL',
  'HAS_CYCLE',
  'UNCONNECTED_INPUT',
  'DISALLOWED_TYPE',
];

/** "Look at your circuit": what to look at, without saying how to fix it. */
export function lookHint(doc: CircuitDoc, spec: CheckSpec): CircuitHint {
  const { result, error } = diagnose(doc, spec);
  if (result.pass) return ALREADY_RIGHT;
  if (error) {
    const ids = error.componentIds ?? [];
    const text =
      error.code === 'UNCONNECTED_INPUT' && ids.length
        ? `${ids.map((id) => name(doc, id)).join(', ')} ${ids.length === 1 ? 'has an input' : 'have inputs'} that ${ids.length === 1 ? "isn't" : "aren't"} connected (shown as a gray dashed X).`
        : error.message;
    return { text: `Look here first: ${text}`, ...(ids.length && { partIds: [...ids] }) };
  }
  // The output that is wrong in the most rows.
  const counts = result.labels.outputs.map(
    (_, o) => result.mismatches.filter((r) => r.actual[o] !== r.expected[o]).length,
  );
  const o = counts.indexOf(Math.max(...counts));
  const label = result.labels.outputs[o];
  const wrong = `${label} is wrong in ${counts[o]} of ${result.rows.length} rows`;
  const input = result.misconception?.params?.input;
  const extra = input ? ` Does ${input} reach it?` : '';
  const out = outputPart(doc, label);
  const driver = out && driverOf(doc, out);
  if (!driver) return { text: `${wrong}. What is it connected to?` };
  const driverDef = findComponentDef(findComponent(doc, driver)?.type ?? '');
  if (driverDef?.io === 'input') {
    return {
      text: `${label} is wired straight to ${name(doc, driver)}, so it copies it – and ${wrong}. Does the task need a gate in between?`,
      partIds: [driver],
    };
  }
  return {
    text: `Look at ${name(doc, driver)}: it drives ${label}, and ${wrong}.${extra}`,
    partIds: [driver],
  };
}

/** "Try one row": one wrong row, walked through the gates that feed the wrong output. */
export function rowHint(doc: CircuitDoc, spec: CheckSpec): CircuitHint {
  const { result, error } = diagnose(doc, spec);
  if (result.pass) return ALREADY_RIGHT;
  if (error || !result.example) return lookHint(doc, spec);
  const example = result.example;
  const labels = result.labels.inputs;
  const bits = Object.fromEntries(labels.map((l, i) => [l, example.inputs[i]]));
  const trace = traceRow(doc, bits);
  const o = example.actual.findIndex((v, i) => v !== example.expected[i]);
  const label = result.labels.outputs[o];
  const out = outputPart(doc, label);
  const path = out ? feeders(doc, out.id) : new Set<string>();
  const steps = trace.steps
    .filter((s) => path.has(s.id))
    .map(
      (s) => `${name(doc, s.id)} gets ${getsText(s.inputs)} and gives ${valueText(s.outputs[0])}.`,
    );
  const shows = trace.outputs.find((t) => t.label === label)?.value ?? example.actual[o];
  return {
    text: [
      `Try ${rowText(labels, example.inputs)}.`,
      ...steps,
      `So ${label} is ${valueText(shows)}, but the task wants ${example.expected[o]}. Which gate should change?`,
    ].join(' '),
    row: { labels: [...labels], bits: [...example.inputs] },
    ...(out && { partIds: [...path].filter((id) => id !== out.id && !isInput(doc, id)) }),
  };
}

const isInput = (doc: CircuitDoc, id: string) =>
  findComponentDef(findComponent(doc, id)?.type ?? '')?.io === 'input';

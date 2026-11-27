/**
 * The parts:
 *  - inputs: a switch (stays where you put it) and a push button (1 only while held);
 *  - outputs: a light (in four colors) and a seven-segment display (pins a–g);
 *  - the seven standard gates covered by IB Computer Science A1.2 (AND, OR, NOT, NAND,
 *    NOR, XOR, XNOR).
 *
 * Importing this module registers them. Pin ids are fixed: gate inputs are "in0",
 * "in1", … and every gate has one output, "out".
 *
 * A push button behaves exactly like a switch here: whether it springs back when let go
 * is the editor's business (it sets the input back to 0). So the simulator, truth table
 * and checker treat both the same.
 */
import { registerComponent, type ComponentDef, type PinLayout, type Props } from './registry';
import { and, isBit, not, or, xor, type Bit, type Value } from './values';

/** Number of inputs for a gate (props.inputs), clamped to 2–4. Defaults to 2. */
function gateInputCount(props: Props): number {
  const n =
    typeof props.inputs === 'number' && Number.isFinite(props.inputs)
      ? Math.round(props.inputs)
      : 2;
  return Math.min(4, Math.max(2, n));
}

function gatePins(inputCount: number): PinLayout {
  return {
    inputs: Array.from({ length: inputCount }, (_, i) => ({ id: `in${i}` })),
    outputs: [{ id: 'out' }],
  };
}

/** Builds a definition for a gate with 2–4 inputs from its logic function. */
function gate(
  type: string,
  description: string,
  logic: (inputs: readonly Value[]) => Value,
): ComponentDef {
  return {
    type,
    name: `${type} gate`,
    category: 'gate',
    description,
    defaultProps: { inputs: 2 },
    pins: (props) => gatePins(gateInputCount(props)),
    evaluate: (inputs) => ({ outputs: [logic(inputs)] }),
  };
}

export const GATE_TYPES = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'] as const;
export type GateType = (typeof GATE_TYPES)[number];

/** The colors a light can be (each has its own theme tokens in themes.css). */
export const LIGHT_COLORS = ['yellow', 'red', 'green', 'blue'] as const;

/** The seven segments of a display, in pin order: top, top right, bottom right, … middle. */
export const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const;

/** Which segments are lit for each digit (the usual convention; 1 = lit). */
export const DIGIT_SEGMENTS: readonly string[] = [
  'abcdef', // 0
  'bc', // 1
  'abdeg', // 2
  'abcdg', // 3
  'bcfg', // 4
  'acdfg', // 5
  'acdefg', // 6
  'abc', // 7
  'abcdefg', // 8
  'abcdfg', // 9
];

/** Other ways some displays draw 6, 7 and 9 (accepted when saying what a display shows). */
const DIGIT_VARIANTS: Readonly<Record<string, number>> = { cdefg: 6, abcf: 7, abcfg: 9 };

/**
 * The digit a display shows, given its segment values in pin order (a–g), or undefined
 * if the lit segments don't form a digit (or some are unknown).
 */
export function digitShown(segments: readonly Value[]): number | undefined {
  if (segments.some((v) => v === 'X')) return undefined;
  const lit = SEGMENTS.filter((_, i) => segments[i] === 1).join('');
  const digit = DIGIT_SEGMENTS.indexOf(lit);
  return digit >= 0 ? digit : DIGIT_VARIANTS[lit];
}

/** An input part (switch or push button): its state is its current bit. */
function inputPart(type: string, name: string, description: string): ComponentDef {
  return {
    type,
    name,
    category: 'io',
    io: 'input',
    description,
    defaultProps: {},
    pins: () => ({ inputs: [], outputs: [{ id: 'out' }] }),
    // The simulator changes the state with setInput().
    initialState: () => 0,
    evaluate: (_inputs, _props, state) => ({ outputs: [isBit(state) ? state : 0] }),
  };
}

const definitions: ComponentDef[] = [
  inputPart('SWITCH', 'Switch', 'An input you can turn on (1) or off (0).'),
  inputPart('PUSH_BUTTON', 'Push button', 'An input that is 1 only while you hold it down.'),
  {
    type: 'LIGHT',
    name: 'Light',
    category: 'io',
    io: 'output',
    description: 'An output that lights up when its input is 1.',
    defaultProps: { color: 'yellow' },
    pins: () => ({ inputs: [{ id: 'in' }], outputs: [] }),
    // Only known colors: the color becomes part of a CSS class name in the editor. An
    // unknown one is dropped, so the light falls back to its default (yellow).
    normalizeProps: (props) => {
      if (props.color === undefined || (LIGHT_COLORS as readonly unknown[]).includes(props.color))
        return props;
      const rest = { ...props };
      delete rest.color;
      return rest;
    },
    evaluate: () => ({ outputs: [] }),
  },
  {
    type: 'SEVEN_SEG',
    name: 'Seven-segment display',
    category: 'display',
    io: 'output',
    description: 'Shows a digit: each input lights one segment, a (top) to g (middle).',
    defaultProps: {},
    pins: () => ({
      inputs: SEGMENTS.map((id) => ({ id, label: `segment ${id}` })),
      outputs: [],
    }),
    evaluate: () => ({ outputs: [] }),
  },
  gate('AND', 'Output is 1 only when ALL inputs are 1.', and),
  gate('OR', 'Output is 1 when AT LEAST ONE input is 1.', or),
  {
    type: 'NOT',
    name: 'NOT gate',
    category: 'gate',
    description: 'Output is the opposite of the input.',
    defaultProps: {},
    pins: () => ({ inputs: [{ id: 'in0' }], outputs: [{ id: 'out' }] }),
    evaluate: (inputs) => ({ outputs: [not(inputs[0] ?? 'X')] }),
  },
  gate('NAND', 'NOT-AND: output is 0 only when ALL inputs are 1 ("not both").', (v) => not(and(v))),
  gate('NOR', 'NOT-OR: output is 1 only when ALL inputs are 0.', (v) => not(or(v))),
  gate('XOR', 'Exclusive OR: output is 1 when an ODD number of inputs are 1.', xor),
  gate('XNOR', 'Output is 1 when the two inputs MATCH ("if and only if").', (v) => not(xor(v))),
];

for (const def of definitions) registerComponent(def);

/** The bit a switch is set to, given its stored state. */
export function switchBit(state: unknown): Bit {
  return isBit(state) ? state : 0;
}

/**
 * The Phase 1 parts: a switch (input), a light (output), and the seven standard gates
 * covered by IB Computer Science A1.2 (AND, OR, NOT, NAND, NOR, XOR, XNOR).
 *
 * Importing this module registers them. Pin ids are fixed: gate inputs are "in0",
 * "in1", … and every gate has one output, "out".
 */
import { registerComponent, type ComponentDef, type PinLayout, type Props } from './registry';
import { and, isBit, not, or, xor, type Bit, type Value } from './values';

/** Number of inputs for a gate (props.inputs), clamped to 2–4. Defaults to 2. */
function gateInputCount(props: Props): number {
  const n = typeof props.inputs === 'number' ? Math.round(props.inputs) : 2;
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

const definitions: ComponentDef[] = [
  {
    type: 'SWITCH',
    name: 'Switch',
    category: 'io',
    io: 'input',
    description: 'An input you can turn on (1) or off (0).',
    defaultProps: {},
    pins: () => ({ inputs: [], outputs: [{ id: 'out' }] }),
    // A switch's state is its current bit; the simulator changes it with setInput().
    initialState: () => 0,
    evaluate: (_inputs, _props, state) => ({ outputs: [isBit(state) ? state : 0] }),
  },
  {
    type: 'LIGHT',
    name: 'Light',
    category: 'io',
    io: 'output',
    description: 'An output that lights up when its input is 1.',
    defaultProps: { color: 'yellow' },
    pins: () => ({ inputs: [{ id: 'in' }], outputs: [] }),
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

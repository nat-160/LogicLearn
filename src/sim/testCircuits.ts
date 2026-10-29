/**
 * Small example circuits used by the tests (and handy in demos).
 */
import { buildCircuit, type CircuitDoc } from './circuit';

/** Two switches into one 2-input gate of the given type, lighting Y. */
export function oneGate(type: string): CircuitDoc {
  return buildCircuit({
    name: `${type} gate`,
    parts: [
      { id: 'A', type: 'SWITCH', at: [0, 0] },
      { id: 'B', type: 'SWITCH', at: [0, 4] },
      { id: 'g', type, at: [6, 2] },
      { id: 'Y', type: 'LIGHT', at: [12, 2] },
    ],
    wires: [
      ['A', 'g.in0'],
      ['B', 'g.in1'],
      ['g', 'Y'],
    ],
  });
}

/** Half adder: S = A XOR B, C = A AND B. */
export function halfAdder(): CircuitDoc {
  return buildCircuit({
    name: 'Half adder',
    parts: [
      { id: 'A', type: 'SWITCH', at: [0, 0] },
      { id: 'B', type: 'SWITCH', at: [0, 6] },
      { id: 'x', type: 'XOR', at: [8, 0] },
      { id: 'a', type: 'AND', at: [8, 6] },
      { id: 'S', type: 'LIGHT', at: [16, 0] },
      { id: 'C', type: 'LIGHT', at: [16, 6] },
    ],
    wires: [
      ['A', 'x.in0'],
      ['B', 'x.in1'],
      ['A', 'a.in0'],
      ['B', 'a.in1'],
      ['x', 'S'],
      ['a', 'C'],
    ],
  });
}

/** Full adder: S = A ⊕ B ⊕ Cin, Cout = AB + Cin(A ⊕ B). Labels: A, B, Cin → Cout, S. */
export function fullAdder(): CircuitDoc {
  return buildCircuit({
    name: 'Full adder',
    parts: [
      { id: 'A', type: 'SWITCH', at: [0, 0] },
      { id: 'B', type: 'SWITCH', at: [0, 4] },
      { id: 'Cin', type: 'SWITCH', at: [0, 8] },
      { id: 'x1', type: 'XOR', at: [6, 2] },
      { id: 'x2', type: 'XOR', at: [12, 4] },
      { id: 'a1', type: 'AND', at: [6, 10] },
      { id: 'a2', type: 'AND', at: [12, 8] },
      { id: 'o', type: 'OR', at: [18, 10] },
      { id: 'S', type: 'LIGHT', at: [24, 4] },
      { id: 'Cout', type: 'LIGHT', at: [24, 10] },
    ],
    wires: [
      ['A', 'x1.in0'],
      ['B', 'x1.in1'],
      ['x1', 'x2.in0'],
      ['Cin', 'x2.in1'],
      ['A', 'a1.in0'],
      ['B', 'a1.in1'],
      ['x1', 'a2.in0'],
      ['Cin', 'a2.in1'],
      ['a1', 'o.in0'],
      ['a2', 'o.in1'],
      ['x2', 'S'],
      ['o', 'Cout'],
    ],
  });
}

/** A chain of `length` NOT gates from switch A to light Y. */
export function notChain(length: number): CircuitDoc {
  const parts = [{ id: 'A', type: 'SWITCH' }];
  const wires: [string, string][] = [];
  let previous = 'A';
  for (let i = 0; i < length; i++) {
    parts.push({ id: `n${i}`, type: 'NOT' });
    wires.push([previous, `n${i}`]);
    previous = `n${i}`;
  }
  parts.push({ id: 'Y', type: 'LIGHT' });
  wires.push([previous, 'Y']);
  return buildCircuit({ parts, wires });
}

import { buildCircuit, type CircuitDoc } from '../sim';

/** What a first-time visitor sees: an AND gate, ready to try. */
export function exampleCircuit(): CircuitDoc {
  return buildCircuit({
    name: 'My circuit',
    parts: [
      { id: 'A', type: 'SWITCH', at: [0, 0] },
      { id: 'B', type: 'SWITCH', at: [0, 4] },
      { id: 'and-1', type: 'AND', at: [7, 0] },
      { id: 'Y', type: 'LIGHT', at: [14, 1] },
    ],
    wires: [
      ['A', 'and-1.in0'],
      ['B', 'and-1.in1'],
      ['and-1', 'Y'],
    ],
  });
}

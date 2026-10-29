import { Simulator, buildCircuit, removeItems } from '../sim';
import { describeCircuit, describeRemoval, partName } from './describe';

const doc = buildCircuit({
  parts: [
    { id: 'A', type: 'SWITCH' },
    { id: 'B', type: 'SWITCH' },
    { id: 'and-1', type: 'AND' },
    { id: 'Y', type: 'LIGHT' },
  ],
  wires: [
    ['A', 'and-1.in0'],
    ['and-1', 'Y'],
  ],
});

describe('describeCircuit', () => {
  it('names parts the way a person would say them', () => {
    expect(doc.components.map(partName)).toEqual(['Switch A', 'Switch B', 'AND gate 1', 'Light Y']);
  });

  it('lists every part with its value, every wire, and loose inputs', () => {
    const values = new Simulator(doc, { A: 1 }).snapshot();
    expect(describeCircuit(doc, values)).toEqual({
      parts: [
        'Switch A: on (1)',
        'Switch B: off (0)',
        'AND gate 1: output is unknown',
        'Light Y: unknown – check its wire',
      ],
      wires: [
        { id: doc.wires[0].id, text: 'Switch A → AND gate 1, input 1' },
        { id: doc.wires[1].id, text: 'AND gate 1, output → Light Y' },
      ],
      loose: ['AND gate 1, input 2: not connected'],
    });
  });

  it('hides values in predict-first mode, except the switches', () => {
    const values = new Simulator(doc, { A: 1 }).snapshot();
    const { parts } = describeCircuit(doc, values, { hideValues: true });
    expect(parts[0]).toBe('Switch A: on (1)');
    expect(parts[3]).toBe('Light Y: value hidden until you check');
  });
});

describe('describeRemoval', () => {
  it('says which part was deleted, and how many wires went with it', () => {
    expect(describeRemoval(doc, removeItems(doc, ['and-1']))).toBe(
      'Deleted AND gate 1 and 2 wires.',
    );
    expect(describeRemoval(doc, removeItems(doc, ['B']))).toBe('Deleted Switch B.');
  });

  it('names a single removed wire by its ends', () => {
    expect(describeRemoval(doc, removeItems(doc, [], [doc.wires[1].id]))).toBe(
      'Removed the wire from AND gate 1, output to Light Y.',
    );
  });

  it('is empty when nothing was removed', () => {
    expect(describeRemoval(doc, doc)).toBe('');
  });
});

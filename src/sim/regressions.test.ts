/**
 * Regression tests for defects found by an independent review of the simulation core.
 */
import { addComponent, buildCircuit, setLabel, setProps } from './circuit';
import { check, rowsFrom } from './checker';
import { diagnoseMisconception } from './misconceptions';
import { parseCircuit, serializeCircuit } from './serialize';
import { Simulator } from './simulator';
import { computeTruthTable } from './truthTable';
import type { Bit } from './values';

const base = { schemaVersion: 1, id: 'c', name: 'n' };

describe('review regressions', () => {
  it('drops unknown fields from loaded files (a "readers" key used to crash the simulator)', () => {
    const text = JSON.stringify({
      ...base,
      readers: [],
      components: [{ id: 's', type: 'SWITCH', position: { x: 0, y: 0 }, props: {} }],
      wires: [],
    });
    const result = parseCircuit(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect('readers' in result.doc).toBe(false);
    expect(() => new Simulator(result.doc)).not.toThrow();
  });

  it('rejects part ids that are special to JavaScript objects, like "__proto__"', () => {
    const text = JSON.stringify({
      ...base,
      components: [
        { id: '__proto__', type: 'SWITCH', position: { x: 0, y: 0 }, props: {}, label: 'A' },
      ],
      wires: [],
    });
    expect(parseCircuit(text).ok).toBe(false);
    expect(() =>
      addComponent(buildCircuit({ parts: [] }), 'SWITCH', { x: 0, y: 0 }, { id: '__proto__' }),
    ).toThrow();
  });

  it('keeps reporting a loop that is still oscillating after an unrelated switch flips', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'g', type: 'NAND' },
        { id: 'B', type: 'SWITCH' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'g.in0'],
        ['g', 'g.in1'],
        ['B', 'Y'],
      ],
    });
    const sim = new Simulator(doc, { A: 0 });
    expect(sim.setInput('A', 1).settled).toBe(false);
    const report = sim.setInput('B', 1);
    expect(report.settled).toBe(false);
    expect(report.unstable).toContain('g');
    expect(sim.pinValue('Y', 'in')).toBe(1); // the unrelated part still updated
  });

  it('removes wires from pins that disappear when a gate loses inputs', () => {
    let doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'g', type: 'AND', props: { inputs: 3 } },
      ],
      wires: [['A', 'g.in2']],
    });
    doc = setProps(doc, 'g', { inputs: 2 });
    expect(doc.wires).toHaveLength(0);
    expect(parseCircuit(serializeCircuit(doc)).ok).toBe(true);
  });

  it('treats a nonsense input count as the default of 2', () => {
    const doc = buildCircuit({
      parts: [{ id: 'g', type: 'AND', props: { inputs: Number('abc') } }],
    });
    const sim = new Simulator(doc);
    expect(sim.circuit.components[0].inputPins).toEqual(['in0', 'in1']);
  });

  it('refuses huge files instead of overflowing the stack', () => {
    const components = Array.from({ length: 2500 }, (_, i) => ({
      id: `n${i}`,
      type: 'NOT',
      position: { x: 0, y: 0 },
      props: {},
    }));
    expect(parseCircuit(JSON.stringify({ ...base, components, wires: [] })).ok).toBe(false);
  });

  it('does not blame the all-zeros row when the output is unknown (a loose wire)', () => {
    const rows = [
      { inputs: [0, 0] as Bit[], expected: [0] as Bit[], actual: ['X' as const] },
      { inputs: [0, 1] as Bit[], expected: [1] as Bit[], actual: [1] as Bit[] },
    ];
    expect(diagnoseMisconception({ inputCount: 2, outputCount: 1, rows })).toBeUndefined();
    const noInputs = [{ inputs: [] as Bit[], expected: [1] as Bit[], actual: [0] as Bit[] }];
    expect(
      diagnoseMisconception({ inputCount: 0, outputCount: 1, rows: noInputs }),
    ).toBeUndefined();
  });

  it('refuses to add a part with an id that is already used', () => {
    const doc = buildCircuit({ parts: [{ id: 'A', type: 'SWITCH' }] });
    expect(() => addComponent(doc, 'SWITCH', { x: 0, y: 0 }, { id: 'A' })).toThrow();
  });

  it('never gives a new part a label already shown by an unlabeled part', () => {
    let doc = buildCircuit({ parts: [{ id: 'A', type: 'SWITCH' }] });
    doc = setLabel(doc, 'A', ''); // now unlabeled, so it is shown as "A" (its id)
    doc = addComponent(doc, 'SWITCH', { x: 0, y: 60 }).doc;
    expect(doc.components[1].label).not.toBe('A');
  });

  it('applies gate rules to every non-I/O part', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'n', type: 'NOT' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'n'],
        ['n', 'Y'],
      ],
    });
    const spec = {
      inputs: ['A'],
      outputs: ['Y'],
      expected: rowsFrom(1, (a) => (a ? 0 : 1) as Bit),
    };
    expect(check(doc, { ...spec, constraints: { allowedTypes: ['NAND'] } }).pass).toBe(false);
    expect(check(doc, { ...spec, constraints: { maxGates: 1 } }).pass).toBe(true);
    expect(computeTruthTable(doc).ok).toBe(true);
  });
});

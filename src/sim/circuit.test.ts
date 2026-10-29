import {
  addComponent,
  buildCircuit,
  connect,
  emptyCircuit,
  moveComponent,
  removeItems,
  setLabel,
} from './circuit';
import { parseCircuit, serializeCircuit, validateCircuit } from './serialize';

describe('editing a circuit', () => {
  it('adds parts with automatic labels for inputs and outputs', () => {
    let doc = emptyCircuit();
    doc = addComponent(doc, 'SWITCH', { x: 0, y: 0 }).doc;
    doc = addComponent(doc, 'SWITCH', { x: 0, y: 40 }).doc;
    doc = addComponent(doc, 'LIGHT', { x: 200, y: 0 }).doc;
    doc = addComponent(doc, 'AND', { x: 100, y: 0 }).doc;
    expect(doc.components.map((c) => c.label)).toEqual(['A', 'B', 'Y', undefined]);
    expect(new Set(doc.components.map((c) => c.id)).size).toBe(4);
  });

  it('never modifies the original document', () => {
    const before = emptyCircuit();
    const after = addComponent(before, 'AND', { x: 0, y: 0 }).doc;
    expect(before.components).toHaveLength(0);
    expect(after.components).toHaveLength(1);
  });

  it('connects pins given in either order', () => {
    const doc = buildCircuit({ parts: [{ id: 'A', type: 'SWITCH' }, { id: 'Y', type: 'LIGHT' }] });
    const result = connect(doc, { component: 'Y', pin: 'in' }, { component: 'A', pin: 'out' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.doc.wires[0].from).toEqual({ component: 'A', pin: 'out' });
  });

  it('refuses to connect two inputs or two outputs', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'B', type: 'SWITCH' },
      ],
    });
    const result = connect(doc, { component: 'A', pin: 'out' }, { component: 'B', pin: 'out' });
    expect(result.ok).toBe(false);
  });

  it('replaces the old wire when an input is connected again (single-driver rule)', () => {
    let doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'B', type: 'SWITCH' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [['A', 'Y']],
    });
    const result = connect(doc, { component: 'B', pin: 'out' }, { component: 'Y', pin: 'in' });
    expect(result.ok).toBe(true);
    if (result.ok) doc = result.doc;
    expect(doc.wires).toHaveLength(1);
    expect(doc.wires[0].from.component).toBe('B');
  });

  it('removes wires along with the parts they attach to', () => {
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
    const after = removeItems(doc, ['n']);
    expect(after.components.map((c) => c.id)).toEqual(['A', 'Y']);
    expect(after.wires).toHaveLength(0);
  });

  it('never moves, relabels or deletes locked (lesson-provided) parts', () => {
    const doc = buildCircuit({ parts: [{ id: 'A', type: 'SWITCH', locked: true }] });
    expect(removeItems(doc, ['A']).components).toHaveLength(1);
    expect(moveComponent(doc, 'A', { x: 99, y: 99 }).components[0].position).toEqual({ x: 0, y: 0 });
    expect(setLabel(doc, 'A', 'Q').components[0].label).toBe('A');
  });
});

describe('saving and loading', () => {
  const doc = buildCircuit({
    parts: [
      { id: 'A', type: 'SWITCH' },
      { id: 'B', type: 'SWITCH' },
      { id: 'g', type: 'AND' },
      { id: 'Y', type: 'LIGHT' },
    ],
    wires: [
      ['A', 'g.in0'],
      ['B', 'g.in1'],
      ['g', 'Y'],
    ],
  });

  it('round-trips through JSON unchanged', () => {
    const result = parseCircuit(serializeCircuit(doc));
    expect(result).toEqual({ ok: true, doc });
  });

  it('rejects text that is not JSON with a friendly message', () => {
    const result = parseCircuit('hello');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/not a circuit file/);
  });

  it('rejects files from a newer version', () => {
    const result = parseCircuit(JSON.stringify({ ...doc, schemaVersion: 99 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/newer version/);
  });

  it('rejects unknown part types and wires to missing pins', () => {
    const bad = {
      ...doc,
      components: [...doc.components, { id: 'z', type: 'TELEPORTER', position: { x: 0, y: 0 }, props: {} }],
      wires: [...doc.wires, { id: 'w9', from: { component: 'A', pin: 'out' }, to: { component: 'g', pin: 'in7' } }],
    };
    const result = validateCircuit(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(' ')).toMatch(/unknown type "TELEPORTER"/);
      expect(result.errors.join(' ')).toMatch(/does not end at an input pin/);
    }
  });

  it('rejects two wires into the same input', () => {
    const bad = {
      ...doc,
      wires: [...doc.wires, { id: 'w9', from: { component: 'B', pin: 'out' }, to: { component: 'Y', pin: 'in' } }],
    };
    const result = validateCircuit(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.join(' ')).toMatch(/more than one wire/);
  });
});

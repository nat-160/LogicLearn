// @vitest-environment jsdom
import { buildCircuit } from '../sim';
import { halfAdder } from '../sim/testCircuits';
import { createEditorStore } from './store';

describe('editor store', () => {
  it('undoes and redoes design changes, re-running the simulation each time', () => {
    const store = createEditorStore(buildCircuit({ parts: [{ id: 'A', type: 'SWITCH' }] }));
    store.getState().addPart('LIGHT', { x: 200, y: 0 });
    store
      .getState()
      .connect({ source: 'A', sourceHandle: 'out', target: 'light-1', targetHandle: 'in' });
    store.getState().toggleSwitch('A');
    expect(store.getState().values['light-1.in']).toBe(1);

    store.getState().undo(); // removes the wire
    expect(store.getState().doc.wires).toHaveLength(0);
    expect(store.getState().values['light-1.in']).toBe('X');

    store.getState().redo(); // puts it back; the switch is still on
    expect(store.getState().doc.wires).toHaveLength(1);
    expect(store.getState().values['light-1.in']).toBe(1);
  });

  it('records a whole drag as one undo step', () => {
    const store = createEditorStore(halfAdder());
    const before = store.getState().doc;
    store.getState().beginDrag();
    for (const x of [20, 40, 60]) {
      store
        .getState()
        .onNodesChange([{ type: 'position', id: 'A', position: { x, y: 0 }, dragging: true }]);
    }
    store.getState().endDrag();
    expect(store.getState().past).toHaveLength(1);
    store.getState().undo();
    expect(store.getState().doc).toBe(before);
  });

  it('does not record switch flips in the undo history', () => {
    const store = createEditorStore(halfAdder());
    store.getState().toggleSwitch('A');
    expect(store.getState().past).toHaveLength(0);
  });

  it('forgets the setting of a deleted switch, so a new one starts off', () => {
    const store = createEditorStore(buildCircuit({ parts: [] }));
    const id = store.getState().addPart('SWITCH', { x: 0, y: 0 });
    store.getState().toggleSwitch(id);
    store.getState().removeItems([id], []);
    const again = store.getState().addPart('SWITCH', { x: 0, y: 0 });
    expect(again).toBe(id); // the id is reused...
    expect(store.getState().values[`${again}.out`]).toBe(0); // ...but the switch starts off
  });

  it('restarts the tried-rows count when the circuit changes', () => {
    const store = createEditorStore(halfAdder());
    store.getState().setInputs({ A: 1 });
    store.getState().setInputs({ B: 1 });
    expect([...store.getState().triedRows].sort()).toEqual([0, 2, 3]);
    store.getState().addPart('NOT', { x: 400, y: 0 });
    expect([...store.getState().triedRows]).toEqual([3]); // only the current row
  });

  it('clears check highlights when the design changes', () => {
    const store = createEditorStore(halfAdder());
    store.getState().setHighlight({ rows: [1, 2] });
    const version = store.getState().designVersion;
    store.getState().addPart('NOT', { x: 400, y: 0 });
    expect(store.getState().highlight.rows.size).toBe(0);
    expect(store.getState().designVersion).toBe(version + 1);
  });

  it('refuses a connection between two outputs and explains why', () => {
    const store = createEditorStore(halfAdder());
    store
      .getState()
      .connect({ source: 'A', sourceHandle: 'out', target: 'B', targetHandle: 'out' });
    expect(store.getState().notice).toMatch(/output to an input/);
  });
});

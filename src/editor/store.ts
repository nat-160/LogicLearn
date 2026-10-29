/**
 * The editor's state: one store per editor on screen (the sandbox, or a lesson step).
 *
 * The store holds:
 *   - doc       the circuit design (source of truth; see src/sim/circuit.ts)
 *   - inputs    which switches are on (NOT part of the design, so flipping a switch is
 *               not an undo step and is not saved)
 *   - values    every pin's current value, from the Simulator
 *   - nodes / edges   React Flow's view of the doc (positions, selection, sizes)
 *   - past / future   undo/redo history: simply previous versions of `doc`
 *
 * Every design change goes through `commit()`, which records history, re-runs the
 * simulation and rebuilds the React Flow nodes. Flipping a switch only re-runs the
 * simulation – incrementally, so a circuit that starts oscillating is caught.
 */
import {
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import { createStore, type StoreApi } from 'zustand/vanilla';
import {
  addComponent,
  connect as connectPins,
  findIO,
  findLoops,
  moveComponent,
  removeItems as removeFromDoc,
  rowNumber,
  setLabel as setLabelInDoc,
  setProps as setPropsInDoc,
  Simulator,
  type Bit,
  type CircuitDoc,
  type Position,
  type SettleReport,
  type Value,
} from '../sim';

export interface PartNodeData extends Record<string, unknown> {
  type: string;
  label?: string;
  locked: boolean;
  props: Record<string, unknown>;
}
export type PartNode = Node<PartNodeData, 'part'>;
export type WireEdge = Edge<Record<string, never>, 'wire'>;

/** Highlights from the last check: parts to outline and truth-table rows to mark. */
export interface Highlight {
  componentIds: ReadonlySet<string>;
  rows: ReadonlySet<number>;
}

const NO_HIGHLIGHT: Highlight = { componentIds: new Set(), rows: new Set() };
const HISTORY_LIMIT = 100;

export interface EditorState {
  doc: CircuitDoc;
  inputs: Record<string, Bit>;
  values: Record<string, Value>;
  report: SettleReport;
  /** Parts that sit on a loop (shown with a warning outline). */
  loops: ReadonlySet<string>;
  nodes: PartNode[];
  edges: WireEdge[];
  past: CircuitDoc[];
  future: CircuitDoc[];
  /**
   * Truth-table rows (by row number) the student has tried with the switches since the
   * circuit last changed. Changing the circuit starts the count again: the old tests no
   * longer say anything about the new circuit.
   */
  triedRows: ReadonlySet<number>;
  /** Goes up by one on every design change (not on moves); check results are tied to it. */
  designVersion: number;
  highlight: Highlight;
  /** A short message for the student, e.g. why a connection was refused. */
  notice: string | null;

  addPart(type: string, position: Position): string;
  connect(connection: Connection): void;
  onNodesChange(changes: NodeChange<PartNode>[]): void;
  onEdgesChange(changes: EdgeChange<WireEdge>[]): void;
  beginDrag(): void;
  endDrag(): void;
  removeItems(componentIds: string[], wireIds: string[]): void;
  removeSelected(): void;
  toggleSwitch(id: string): void;
  setInputs(values: Record<string, Bit>): void;
  setLabel(id: string, label: string): void;
  setProps(id: string, props: Record<string, unknown>): void;
  undo(): void;
  redo(): void;
  loadDoc(doc: CircuitDoc, options?: { keepHistory?: boolean }): void;
  setHighlight(highlight: { componentIds?: Iterable<string>; rows?: Iterable<number> }): void;
  setNotice(notice: string | null): void;
}

export interface EditorOptions {
  /** Called after every change to the design (used for autosave). */
  onDocChange?: (doc: CircuitDoc) => void;
}

export type EditorStore = StoreApi<EditorState>;

export function createEditorStore(
  initialDoc: CircuitDoc,
  options: EditorOptions = {},
): EditorStore {
  let sim = new Simulator(initialDoc, {});
  let dragOrigin: CircuitDoc | null = null;

  /** Values derived from running the simulation. */
  const simulated = () => ({
    values: sim.snapshot(),
    report: sim.lastReport,
  });

  /** Which truth-table row the current switch settings correspond to. */
  const currentRow = (doc: CircuitDoc, inputs: Record<string, Bit>) =>
    rowNumber(findIO(doc).inputs.map((p) => inputs[p.id] ?? 0));

  return createStore<EditorState>()((set, get) => {
    /** Re-simulate and rebuild the view after the design changed. */
    const rebuild = (doc: CircuitDoc) => {
      const { nodes, edges, designVersion } = get();
      // Forget settings of switches that no longer exist (ids can be reused later).
      const inputIds = new Set(findIO(doc).inputs.map((p) => p.id));
      const inputs = Object.fromEntries(
        Object.entries(get().inputs).filter(([id]) => inputIds.has(id)),
      );
      sim = new Simulator(doc, inputs);
      return {
        doc,
        inputs,
        ...simulated(),
        loops: findLoops(sim.circuit),
        nodes: buildNodes(doc, nodes),
        edges: buildEdges(doc, edges),
        triedRows: new Set([currentRow(doc, inputs)]),
        designVersion: designVersion + 1,
        highlight: NO_HIGHLIGHT,
      };
    };

    /** Apply a design change: record undo history, re-simulate, notify autosave. */
    const commit = (doc: CircuitDoc) => {
      const { doc: before, past } = get();
      if (doc === before) return;
      set({ ...rebuild(doc), past: [...past, before].slice(-HISTORY_LIMIT), future: [] });
      options.onDocChange?.(doc);
    };

    /** After switches change: re-read the simulation and note the row as tried. */
    const afterInputs = (inputs: Record<string, Bit>) => {
      const tried = new Set(get().triedRows);
      tried.add(currentRow(get().doc, inputs));
      set({ inputs, ...simulated(), triedRows: tried });
    };

    return {
      doc: initialDoc,
      inputs: {},
      ...simulated(),
      loops: findLoops(sim.circuit),
      nodes: buildNodes(initialDoc, []),
      edges: buildEdges(initialDoc, []),
      past: [],
      future: [],
      triedRows: new Set([0]),
      designVersion: 0,
      highlight: NO_HIGHLIGHT,
      notice: null,

      addPart(type, position) {
        const { doc, id } = addComponent(get().doc, type, position);
        commit(doc);
        return id;
      },

      connect(connection) {
        const { source, sourceHandle, target, targetHandle } = connection;
        if (!sourceHandle || !targetHandle) return;
        const result = connectPins(
          get().doc,
          { component: source, pin: sourceHandle },
          { component: target, pin: targetHandle },
        );
        if (result.ok) commit(result.doc);
        else set({ notice: result.reason });
      },

      onNodesChange(changes) {
        // Deletions go through removeItems() (via React Flow's onDelete) so they are undoable.
        const kept = changes.filter((c) => c.type !== 'remove');
        let doc = get().doc;
        for (const change of kept) {
          if (change.type === 'position' && change.position) {
            doc = moveComponent(doc, change.id, change.position);
          }
        }
        const nodes = applyNodeChanges(kept, get().nodes);
        if (doc !== get().doc && !dragOrigin) {
          // A move that isn't a drag (e.g. arrow keys): record it as its own undo step.
          set({ nodes, doc, past: [...get().past, get().doc].slice(-HISTORY_LIMIT), future: [] });
          options.onDocChange?.(doc);
        } else {
          set({ nodes, doc });
        }
      },

      onEdgesChange(changes) {
        const kept = changes.filter((c) => c.type !== 'remove');
        set({ edges: applyEdgeChanges(kept, get().edges) });
      },

      beginDrag() {
        dragOrigin = get().doc;
      },

      endDrag() {
        const origin = dragOrigin;
        dragOrigin = null;
        const { doc, past } = get();
        if (origin && origin !== doc) {
          // The whole drag becomes ONE undo step.
          set({ past: [...past, origin].slice(-HISTORY_LIMIT), future: [] });
          options.onDocChange?.(doc);
        }
      },

      removeItems(componentIds, wireIds) {
        commit(removeFromDoc(get().doc, componentIds, wireIds));
      },

      removeSelected() {
        const { nodes, edges } = get();
        get().removeItems(
          nodes.filter((n) => n.selected).map((n) => n.id),
          edges.filter((e) => e.selected).map((e) => e.id),
        );
      },

      toggleSwitch(id) {
        const bit: Bit = sim.inputBit(id) === 1 ? 0 : 1;
        sim.setInput(id, bit);
        afterInputs({ ...get().inputs, [id]: bit });
      },

      setInputs(values) {
        for (const [id, bit] of Object.entries(values)) sim.setInput(id, bit);
        afterInputs({ ...get().inputs, ...values });
      },

      setLabel(id, label) {
        commit(setLabelInDoc(get().doc, id, label));
      },

      setProps(id, props) {
        commit(setPropsInDoc(get().doc, id, props));
      },

      undo() {
        const { past, future, doc } = get();
        const previous = past.at(-1);
        if (!previous) return;
        set({ ...rebuild(previous), past: past.slice(0, -1), future: [doc, ...future] });
        options.onDocChange?.(previous);
      },

      redo() {
        const { past, future, doc } = get();
        const next = future[0];
        if (!next) return;
        set({ ...rebuild(next), past: [...past, doc], future: future.slice(1) });
        options.onDocChange?.(next);
      },

      loadDoc(doc, { keepHistory = false } = {}) {
        if (keepHistory) return commit(doc);
        set({ inputs: {} }); // a different circuit starts with every switch off
        set({ ...rebuild(doc), past: [], future: [] });
      },

      setHighlight({ componentIds = [], rows = [] }) {
        set({ highlight: { componentIds: new Set(componentIds), rows: new Set(rows) } });
      },

      setNotice(notice) {
        set({ notice });
      },
    };
  });
}

/** React Flow nodes for the doc, keeping each node's measured size and selection. */
function buildNodes(doc: CircuitDoc, previous: PartNode[]): PartNode[] {
  const old = new Map(previous.map((n) => [n.id, n]));
  return doc.components.map((c) => ({
    ...old.get(c.id),
    id: c.id,
    type: 'part',
    position: c.position,
    data: { type: c.type, label: c.label, locked: !!c.locked, props: c.props },
    draggable: !c.locked,
    deletable: !c.locked,
  }));
}

function buildEdges(doc: CircuitDoc, previous: WireEdge[]): WireEdge[] {
  const old = new Map(previous.map((e) => [e.id, e]));
  return doc.wires.map((w) => ({
    ...old.get(w.id),
    id: w.id,
    type: 'wire',
    source: w.from.component,
    sourceHandle: w.from.pin,
    target: w.to.component,
    targetHandle: w.to.pin,
  }));
}

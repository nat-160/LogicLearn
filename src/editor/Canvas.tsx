/**
 * The circuit canvas, built on React Flow.
 *
 * React Flow handles panning, zooming, dragging, selection and drawing connections. We
 * plug in our own part and wire drawings, and send every change to the editor store, which
 * keeps the circuit document (and so the simulation) up to date.
 *
 * Touch support: `connectOnClick` lets students tap one pin and then another to connect
 * them (no precise dragging needed), and `minZoom` keeps pin touch targets big enough.
 */
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  type Connection,
  type IsValidConnection,
} from '@xyflow/react';
import { useCallback } from 'react';
import { GRID_CELL, pinDirection } from '../sim';
import { useDisplay } from '../settings/display';
import { useEditor, useEditorStore } from './editorContext';
import { PartNodeComponent } from './nodes/PartNode';
import type { WireEdge } from './store';
import { WireEdgeComponent } from './WireEdge';

const nodeTypes = { part: PartNodeComponent };
const edgeTypes = { wire: WireEdgeComponent };

export function Canvas({ readOnly = false }: { readOnly?: boolean }) {
  const { theme } = useDisplay();
  const store = useEditorStore();
  const nodes = useEditor((s) => s.nodes);
  const edges = useEditor((s) => s.edges);
  const onNodesChange = useEditor((s) => s.onNodesChange);
  const onEdgesChange = useEditor((s) => s.onEdgesChange);
  const connect = useEditor((s) => s.connect);
  const beginDrag = useEditor((s) => s.beginDrag);
  const endDrag = useEditor((s) => s.endDrag);
  const removeItems = useEditor((s) => s.removeItems);

  // Only allow output → input connections between pins that exist.
  const isValidConnection = useCallback<IsValidConnection<WireEdge>>(
    (c) => {
      const doc = store.getState().doc;
      if (!c.sourceHandle || !c.targetHandle) return false;
      const a = pinDirection(doc, { component: c.source, pin: c.sourceHandle });
      const b = pinDirection(doc, { component: c.target, pin: c.targetHandle });
      return a !== undefined && b !== undefined && a !== b;
    },
    [store],
  );

  const onConnect = useCallback((c: Connection) => connect(c), [connect]);

  return (
    <div
      className="canvas"
      data-testid="canvas"
      role="region"
      aria-label="Circuit canvas"
      aria-describedby="canvas-help"
    >
      <p id="canvas-help" className="sr-only">
        Press Tab to move between parts; arrow keys move the selected part. To read the circuit,
        open "Circuit as text". To wire with a keyboard, use the Connections panel.
      </p>
      <ReactFlow
        colorMode={theme}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={beginDrag}
        onNodeDragStop={endDrag}
        onDelete={({ nodes: n, edges: e }) =>
          removeItems(
            n.map((x) => x.id),
            e.map((x) => x.id),
          )
        }
        isValidConnection={isValidConnection}
        connectOnClick
        snapToGrid
        snapGrid={[GRID_CELL, GRID_CELL]}
        nodeDragThreshold={4}
        nodeClickDistance={4}
        deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        minZoom={0.7}
        maxZoom={2}
        fitView
        fitViewOptions={{ padding: 0.25, maxZoom: 1.2 }}
        zoomOnDoubleClick={false}
      >
        <Background gap={GRID_CELL} />
        <Controls showInteractive={false} />
        <Panel position="top-center">
          <StatusBanner />
        </Panel>
      </ReactFlow>
    </div>
  );
}

/** Messages floating over the canvas: oscillation, loops, refused connections. */
function StatusBanner() {
  const settled = useEditor((s) => s.report.settled);
  const hasLoop = useEditor((s) => s.loops.size > 0);
  const notice = useEditor((s) => s.notice);
  const setNotice = useEditor((s) => s.setNotice);

  if (!settled) {
    return (
      <div className="banner banner-error" role="alert">
        This circuit never settles – the red parts keep flipping on and off.
      </div>
    );
  }
  if (notice) {
    return (
      <div className="banner banner-info" role="status">
        {notice}
        <button
          type="button"
          className="banner-close"
          onClick={() => setNotice(null)}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    );
  }
  if (hasLoop) {
    return (
      <div className="banner banner-warning" role="status">
        Part of this circuit loops back into itself (outlined in orange).
      </div>
    );
  }
  return null;
}

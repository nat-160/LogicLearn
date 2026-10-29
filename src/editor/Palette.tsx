/**
 * The parts palette. Two ways to add a part, so it works with a mouse AND a finger:
 *   - TAP (or click, or press Enter) a part: it appears in a free spot near the middle of
 *     the view.
 *   - DRAG a part onto the canvas: it appears where you drop it.
 *
 * Dragging uses pointer events rather than the browser's built-in drag-and-drop, which
 * does not work reliably with touch on iPad Safari.
 */
import { useReactFlow } from '@xyflow/react';
import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { announce } from '../a11y/announcer';
import { findComponent, getComponentDef, GRID_CELL } from '../sim';
import { partName } from './describe';
import { useEditor, useEditorStore } from './editorContext';
import { findFreeSpot, partGeometry } from './geometry';
import { PartIcon } from './nodes/shapes';
import { ALL_PARTS } from './parts';

const DRAG_START_DISTANCE = 6;

export function Palette({ types = ALL_PARTS }: { types?: string[] }) {
  return (
    <nav className="palette" aria-label="Parts">
      <h2 className="panel-title">Parts</h2>
      <p className="palette-tip">Tap to add, or drag onto the canvas.</p>
      <ul>
        {types.map((type) => (
          <li key={type}>
            <PaletteItem type={type} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function PaletteItem({ type }: { type: string }) {
  const store = useEditorStore();
  const addPart = useEditor((s) => s.addPart);
  const { screenToFlowPosition } = useReactFlow();
  const def = getComponentDef(type);
  const start = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);

  const snap = (v: number) => Math.round(v / GRID_CELL) * GRID_CELL;

  /** Tell screen reader users what was added and how to wire it. */
  const added = (id: string) => {
    const part = findComponent(store.getState().doc, id);
    if (part) announce(`Added ${partName(part)}. Wire it in the Connections panel.`);
  };

  /** Add the part in a free spot near the center of this editor's visible canvas. */
  const addNearCenter = (button: HTMLElement) => {
    const canvas = button.closest('.editor')?.querySelector('.react-flow')?.getBoundingClientRect();
    const center = canvas
      ? screenToFlowPosition({
          x: canvas.left + canvas.width / 2,
          y: canvas.top + canvas.height / 2,
        })
      : { x: 0, y: 0 };
    added(addPart(type, findFreeSpot(store.getState().doc, type, center)));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    start.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const moved = Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y);
    if (ghost || moved > DRAG_START_DISTANCE) setGhost({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const wasDrag = ghost !== null;
    start.current = null;
    setGhost(null);
    if (!wasDrag) return; // a plain tap: handled by onClick below
    suppressClick.current = true;
    const target = document.elementFromPoint(e.clientX, e.clientY);
    const sameEditor = target?.closest('.editor') === e.currentTarget.closest('.editor');
    if (!sameEditor || !target?.closest('.react-flow')) return; // dropped outside the canvas
    const g = partGeometry(type);
    const at = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    added(addPart(type, { x: snap(at.x - g.width / 2), y: snap(at.y - g.height / 2) }));
  };

  const onClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    addNearCenter(e.currentTarget);
  };

  return (
    <>
      <button
        type="button"
        className="palette-item"
        title={def.description}
        data-testid={`palette-${type}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
          setGhost(null);
        }}
        onClick={onClick}
      >
        <PartIcon type={type} />
        <span className="palette-name">
          {type === 'SWITCH' || type === 'LIGHT' ? def.name : type}
        </span>
      </button>
      {ghost && (
        <div className="palette-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden>
          <PartIcon type={type} />
        </div>
      )}
    </>
  );
}

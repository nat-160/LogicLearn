/**
 * How big each part is on screen and where its pins sit. This is view information, so it
 * lives in the editor (the simulator never needs to know where anything is drawn).
 *
 * Sizes are multiples of the 20px grid, and every pin sits ON a grid line, so wires
 * between parts placed on the grid come out straight. Pins are 40px apart so their touch
 * targets (36px, see app.css) never overlap.
 */
import { GRID_CELL, pinsOf, type CircuitDoc, type ComponentInstance, type Position } from '../sim';

export interface PartGeometry {
  width: number;
  height: number;
  /** Pin id → offset from the part's top-left corner. */
  pins: Record<string, { x: number; y: number; side: 'left' | 'right' }>;
}

export function partGeometry(type: string, props: Record<string, unknown> = {}): PartGeometry {
  const layout = pinsOf(type, props);
  if (type === 'SWITCH') {
    return { width: 60, height: 40, pins: { out: { x: 60, y: 20, side: 'right' } } };
  }
  if (type === 'LIGHT') {
    return { width: 40, height: 40, pins: { in: { x: 0, y: 20, side: 'left' } } };
  }
  if (type === 'NOT') {
    return {
      width: 60,
      height: 40,
      pins: { in0: { x: 0, y: 20, side: 'left' }, out: { x: 60, y: 20, side: 'right' } },
    };
  }
  // Gates: 40px of height per input. A 2-input gate is 80×80 with inputs at y = 20 and
  // 60 and its output at y = 40. (The drawn symbol is the 2-input one; 3- and 4-input
  // gates arrive with a later phase.)
  const n = layout.inputs.length;
  const height = 40 * n;
  const pins: PartGeometry['pins'] = { out: { x: 80, y: height / 2, side: 'right' } };
  layout.inputs.forEach((pin, i) => {
    pins[pin.id] = { x: 0, y: 20 + 40 * i, side: 'left' };
  });
  return { width: 80, height, pins };
}

function overlaps(a: Position, ga: PartGeometry, b: ComponentInstance): boolean {
  const gb = partGeometry(b.type, b.props);
  const margin = GRID_CELL;
  return (
    a.x < b.position.x + gb.width + margin &&
    a.x + ga.width + margin > b.position.x &&
    a.y < b.position.y + gb.height + margin &&
    a.y + ga.height + margin > b.position.y
  );
}

/**
 * The free spot nearest to `near` (snapped to the grid) where a new part of this type
 * fits without overlapping anything. Used when a part is added by tapping the palette,
 * so new parts don't pile up on top of each other.
 */
export function findFreeSpot(doc: CircuitDoc, type: string, near: Position): Position {
  const g = partGeometry(type);
  const snap = (v: number) => Math.round(v / GRID_CELL) * GRID_CELL;
  const start = { x: snap(near.x - g.width / 2), y: snap(near.y - g.height / 2) };
  const step = GRID_CELL * 2;
  // Search outward in growing square rings around the starting point.
  for (let ring = 0; ring < 30; ring++) {
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dy = -ring; dy <= ring; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
        const spot = { x: start.x + dx * step, y: start.y + dy * step };
        if (!doc.components.some((c) => overlaps(spot, g, c))) return spot;
      }
    }
  }
  return start;
}

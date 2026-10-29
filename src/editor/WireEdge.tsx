/**
 * How a wire is drawn. Its look depends on the value it carries – and never on color
 * alone, so it still reads for color-blind students:
 *   1 → bright and thick     0 → dark and thin     X (unknown) → gray and dashed
 *
 * Wires are drawn like a circuit diagram: across, down (or up) at the halfway point, and
 * across again, with slightly rounded corners. A wire that has to go backwards (target
 * to the left of the source) uses React Flow's step path, which routes around parts.
 */
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { memo } from 'react';
import { useEditor } from './editorContext';
import type { WireEdge } from './store';
import { wirePath } from './wirePath';

/** Gap (px) a forward wire needs; anything tighter is routed around instead. */
const MIN_FORWARD_GAP = 10;

function WireEdgeView(props: EdgeProps<WireEdge>) {
  const {
    source,
    sourceHandleId,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
  } = props;
  const value = useEditor((s) => s.values[`${source}.${sourceHandleId}`]);
  const path =
    targetX - sourceX >= MIN_FORWARD_GAP
      ? wirePath(sourceX, sourceY, targetX, targetY)
      : getSmoothStepPath({
          sourceX,
          sourceY,
          targetX,
          targetY,
          sourcePosition,
          targetPosition,
          borderRadius: 6,
        })[0];
  const state = value === 1 ? 'v1' : value === 0 ? 'v0' : 'vx';
  return (
    <BaseEdge
      id={props.id}
      path={path}
      className={`wire ${state} ${selected ? 'is-selected' : ''}`}
      interactionWidth={18}
    />
  );
}

export const WireEdgeComponent = memo(WireEdgeView);

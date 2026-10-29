/**
 * How a wire is drawn. Its look depends on the value it carries – and never on color
 * alone, so it still reads for color-blind students:
 *   1 → bright and thick     0 → dark and thin     X (unknown) → gray and dashed
 */
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { memo } from 'react';
import { useEditor } from './editorContext';
import type { WireEdge } from './store';

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
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    // Round the corners, but never by more than half the jog (avoids a squiggle).
    borderRadius: Math.min(6, Math.abs(targetY - sourceY) / 2),
  });
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

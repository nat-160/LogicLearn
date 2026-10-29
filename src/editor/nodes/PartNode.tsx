/**
 * How one part (gate, switch or light) is drawn on the canvas.
 *
 * Pins are React Flow "handles": outputs are sources, inputs are targets. A pin is drawn
 * as a small dot but has a large invisible touch target (see .pin in app.css) so it is
 * easy to hit with a finger. A part reads the simulation values for its own pins only,
 * so flipping a switch re-draws just the parts whose values changed.
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo, useContext } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { getComponentDef, type Value } from '../../sim';
import { BlindContext, useEditor } from '../editorContext';
import { partGeometry } from '../geometry';
import type { PartNode } from '../store';
import { GateShape } from './shapes';

const valueClass = (v: Value | undefined) => (v === 1 ? 'v1' : v === 0 ? 'v0' : 'vx');
const valueText = (v: Value | undefined) => (v === 1 ? '1' : v === 0 ? '0' : '?');

function PartNodeView({ id, data, selected }: NodeProps<PartNode>) {
  const def = getComponentDef(data.type);
  const geometry = partGeometry(data.type, data.props);
  const pinIds = Object.keys(geometry.pins);
  const values = useEditor(useShallow((s) => pinIds.map((pin) => s.values[`${id}.${pin}`])));
  const highlighted = useEditor((s) => s.highlight.componentIds.has(id));
  const inLoop = useEditor((s) => s.loops.has(id));
  const unstable = useEditor((s) => s.report.unstable.includes(id));
  const toggleSwitch = useEditor((s) => s.toggleSwitch);
  const blind = useContext(BlindContext);
  const valueOf = (pin: string) => values[pinIds.indexOf(pin)];

  const classes = [
    'part',
    `part-${data.type.toLowerCase()}`,
    selected && 'is-selected',
    highlighted && 'is-highlighted',
    inLoop && 'is-in-loop',
    unstable && 'is-unstable',
    data.locked && 'is-locked',
  ]
    .filter(Boolean)
    .join(' ');

  let body;
  if (data.type === 'SWITCH') {
    const on = valueOf('out') === 1;
    body = (
      <button
        type="button"
        className={`switch-body ${on ? 'on' : 'off'}`}
        aria-pressed={on}
        onClick={() => toggleSwitch(id)}
      >
        {/* Its name is "Switch A: off 0" – it includes the visible 0/1 (WCAG 2.5.3). */}
        <span className="sr-only">
          Switch {data.label ?? ''}: {on ? 'on' : 'off'}{' '}
        </span>
        <span className="switch-knob" aria-hidden />
        <span className="switch-value">{on ? '1' : '0'}</span>
      </button>
    );
  } else if (data.type === 'LIGHT') {
    const v = valueOf('in');
    body = (
      <div
        className={`light-body ${valueClass(v)} color-${String(data.props.color ?? 'yellow')}`}
        role="img"
        aria-label={`Light ${data.label ?? ''}: ${blind ? 'hidden until you check' : v === 1 ? 'on' : v === 0 ? 'off' : 'unknown'}`}
      >
        <span className="light-value">{valueText(v)}</span>
      </div>
    );
  } else {
    body = <GateShape type={data.type} />;
  }

  return (
    <div
      className={classes}
      style={{ width: geometry.width, height: geometry.height }}
      title={`${def.name}: ${def.description}`}
      data-testid={`part-${id}`}
      data-type={data.type}
    >
      {body}
      {data.label && <span className="part-label">{data.label}</span>}
      {pinIds.map((pin) => {
        const { y, side } = geometry.pins[pin];
        return (
          <Handle
            key={pin}
            id={pin}
            type={side === 'left' ? 'target' : 'source'}
            position={side === 'left' ? Position.Left : Position.Right}
            className={`pin ${valueClass(valueOf(pin))}`}
            style={{ top: y }}
            // Pins are for pointers; keyboard and screen reader users wire in the
            // "View and edit connections" panel, so the pins themselves carry no label.
            data-testid={`pin-${id}-${pin}`}
          />
        );
      })}
    </div>
  );
}

export const PartNodeComponent = memo(PartNodeView);

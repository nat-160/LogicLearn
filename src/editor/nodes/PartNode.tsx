/**
 * How one part (gate, switch, push button, light or display) is drawn on the canvas.
 *
 * Pins are React Flow "handles": outputs are sources, inputs are targets. A pin is drawn
 * as a small dot but has a large invisible touch target (see .pin in app.css) so it is
 * easy to hit with a finger. A part reads the simulation values for its own pins only,
 * so flipping a switch re-draws just the parts whose values changed.
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo, useContext, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { announce } from '../../a11y/announcer';
import { getComponentDef, LIGHT_COLORS, SEGMENTS, type Value } from '../../sim';
import { describeDisplay } from '../describe';
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
  } else if (data.type === 'PUSH_BUTTON') {
    body = <PushButtonBody id={id} label={data.label ?? ''} on={valueOf('out') === 1} />;
  } else if (data.type === 'LIGHT') {
    const v = valueOf('in');
    // Only the four known colors become a class name (files are checked on load too).
    const color = (LIGHT_COLORS as readonly unknown[]).includes(data.props.color)
      ? String(data.props.color)
      : 'yellow';
    const state = blind ? 'hidden until you check' : v === 1 ? 'on' : v === 0 ? 'off' : 'unknown';
    body = (
      <div
        className={`light-body ${valueClass(v)} color-${color}`}
        role="img"
        // Color is never the only cue, so a colored light says its color too.
        aria-label={`Light ${data.label ?? ''}: ${state}${color === 'yellow' ? '' : ` (${color})`}`}
      >
        <span className="light-value">{valueText(v)}</span>
      </div>
    );
  } else if (data.type === 'SEVEN_SEG') {
    body = (
      <SevenSegBody
        label={data.label ?? ''}
        segments={SEGMENTS.map((pin) => valueOf(pin))}
        blind={blind}
      />
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

/**
 * A push button: 1 only while held down.
 *  - Mouse, pen or finger: pressed on pointer-down, released on pointer-up (the pointer is
 *    captured, so sliding off the button still releases it).
 *  - Keyboard: held while Space or Enter is held. Key repeat is ignored, and the default
 *    action is prevented so no extra "click" follows.
 *  - Screen readers often send a single "click" instead of key presses, so a click that
 *    no pointer or key started latches the button down; the next one lets it go.
 * It is let go whenever focus leaves it or the page is hidden, so it can't get stuck.
 * `nodrag nokey` keep React Flow from dragging the node or panning on Space.
 */
function PushButtonBody({ id, label, on }: { id: string; label: string; on: boolean }) {
  const setInputs = useEditor((s) => s.setInputs);
  const set = (down: boolean) => setInputs({ [id]: down ? 1 : 0 });

  useEffect(() => {
    if (!on) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') setInputs({ [id]: 0 });
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [on, id, setInputs]);

  const isPressKey = (key: string) => key === ' ' || key === 'Enter';
  return (
    <button
      type="button"
      className={`button-body nodrag nokey ${on ? 'down' : 'up'}`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // No capture (e.g. a pointer the browser no longer tracks): still press.
        }
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
      onLostPointerCapture={() => set(false)}
      onKeyDown={(e) => {
        if (!isPressKey(e.key)) return;
        e.preventDefault();
        if (!e.repeat) set(true);
      }}
      onKeyUp={(e) => {
        if (!isPressKey(e.key)) return;
        e.preventDefault();
        set(false);
      }}
      onBlur={() => set(false)}
      onClick={(e) => {
        // A pointer press already did its work (detail counts real clicks). A click with no
        // pointer behind it comes from a screen reader: latch.
        if (e.detail !== 0) return;
        set(!on);
        announce(
          on
            ? `Push button ${label} let go.`
            : `Push button ${label} held down. Activate it again to let go.`,
        );
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Its name is "Push button P: up 0" – it includes the visible 0/1 (WCAG 2.5.3). */}
      <span className="sr-only">
        Push button {label}: {on ? 'held down' : 'up'}{' '}
      </span>
      <span className="button-cap" aria-hidden />
      <span className="switch-value">{on ? '1' : '0'}</span>
    </button>
  );
}

/** Where each segment sits in the 120×280 drawing (x, y, width, height). */
const SEGMENT_SHAPES: Record<string, [number, number, number, number]> = {
  a: [50, 52, 44, 12],
  b: [96, 66, 12, 70],
  c: [96, 144, 12, 70],
  d: [50, 216, 44, 12],
  e: [36, 144, 12, 70],
  f: [36, 66, 12, 70],
  g: [50, 134, 44, 12],
};

/**
 * A seven-segment display. A lit segment is filled; an unlit one is only outlined; an
 * unconnected one is dashed – so the digit never depends on color alone. Its name says
 * the digit shown ("Seven-segment display D: shows 2").
 */
function SevenSegBody({
  label,
  segments,
  blind,
}: {
  label: string;
  segments: (Value | undefined)[];
  blind: boolean;
}) {
  const state = blind ? 'hidden until you check' : describeDisplay(segments);
  return (
    <div
      className="seven-seg-body"
      role="img"
      aria-label={`Seven-segment display ${label}: ${state}`}
    >
      <svg viewBox="0 0 120 280" width={120} height={280} aria-hidden>
        <rect className="seg-face" x={28} y={40} width={88} height={200} rx={10} />
        {SEGMENTS.map((pin, i) => {
          const [x, y, w, h] = SEGMENT_SHAPES[pin];
          return (
            <g key={pin}>
              <rect
                className={`seg ${valueClass(segments[i])}`}
                x={x}
                y={y}
                width={w}
                height={h}
                rx={5}
              />
              <text className="seg-pin-label" x={14} y={24 + 40 * i}>
                {pin}
              </text>
            </g>
          );
        })}
      </svg>
      {blind && <span className="seg-hidden">?</span>}
    </div>
  );
}

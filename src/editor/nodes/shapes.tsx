/**
 * Gate symbols, drawn by hand as SVG in the standard US (ANSI/IEEE) "distinctive shape"
 * style used by IB and most US textbooks. A small circle (a "bubble") on the output means
 * NOT: NAND is an AND with a bubble, NOR is an OR with a bubble, and so on.
 *
 * Drawing coordinates match the part sizes in geometry.ts (2-input gates are 80×80, with
 * inputs at y = 20 and 60 and the output at y = 40).
 */
import type { ReactElement } from 'react';

const AND_BODY = 'M12,10 H35 A30,30 0 0 1 35,70 H12 Z';
const OR_BODY = 'M12,10 Q38,10 66,40 Q38,70 12,70 Q26,40 12,10 Z';
const XOR_EXTRA = 'M5,10 Q19,40 5,70';

/** Short lines from the edge of the part to the body, so wires meet the symbol. */
function stubs(endX: number): ReactElement {
  return (
    <g className="pin-stubs">
      <line x1={0} y1={20} x2={endX} y2={20} />
      <line x1={0} y1={60} x2={endX} y2={60} />
    </g>
  );
}

function bubble(cx: number, cy: number): ReactElement {
  return <circle className="bubble" cx={cx} cy={cy} r={4.5} />;
}

export function GateShape({ type }: { type: string }) {
  switch (type) {
    case 'AND':
    case 'NAND': {
      const negated = type === 'NAND';
      return (
        <svg className="gate-svg" viewBox="0 0 80 80" width={80} height={80} aria-hidden>
          {stubs(12)}
          <line className="pin-stub" x1={negated ? 74 : 65} y1={40} x2={80} y2={40} />
          <path className="gate-body" d={AND_BODY} />
          {negated && bubble(69.5, 40)}
        </svg>
      );
    }
    case 'OR':
    case 'NOR':
    case 'XOR':
    case 'XNOR': {
      const negated = type === 'NOR' || type === 'XNOR';
      const exclusive = type === 'XOR' || type === 'XNOR';
      return (
        <svg className="gate-svg" viewBox="0 0 80 80" width={80} height={80} aria-hidden>
          {stubs(exclusive ? 8 : 15)}
          <line className="pin-stub" x1={negated ? 75 : 66} y1={40} x2={80} y2={40} />
          {exclusive && <path className="gate-line" d={XOR_EXTRA} />}
          <path className="gate-body" d={OR_BODY} />
          {negated && bubble(70.5, 40)}
        </svg>
      );
    }
    case 'NOT':
      return (
        <svg className="gate-svg" viewBox="0 0 60 40" width={60} height={40} aria-hidden>
          <line className="pin-stub" x1={0} y1={20} x2={12} y2={20} />
          <line className="pin-stub" x1={53} y1={20} x2={60} y2={20} />
          <path className="gate-body" d="M12,4 L44,20 L12,36 Z" />
          {bubble(48.5, 20)}
        </svg>
      );
    default:
      return null;
  }
}

/** A small preview of a part for the palette. */
export function PartIcon({ type }: { type: string }) {
  if (type === 'SWITCH') {
    return (
      <svg viewBox="0 0 60 40" width={42} height={28} aria-hidden>
        <rect className="icon-switch" x={6} y={10} width={40} height={20} rx={10} />
        <circle className="icon-knob" cx={16} cy={20} r={7} />
        <line className="pin-stub" x1={46} y1={20} x2={60} y2={20} />
      </svg>
    );
  }
  if (type === 'LIGHT') {
    return (
      <svg viewBox="0 0 40 40" width={28} height={28} aria-hidden>
        <line className="pin-stub" x1={0} y1={20} x2={8} y2={20} />
        <circle className="icon-light" cx={22} cy={20} r={13} />
      </svg>
    );
  }
  return (
    <span className="palette-gate-icon">
      <GateShape type={type} />
    </span>
  );
}

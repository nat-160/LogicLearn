/**
 * Wire shapes, drawn like a circuit diagram: across, then down or up at the halfway
 * point, then across again.
 */

/** An orthogonal path from (sx, sy) to (tx, ty), turning at the midpoint. */
export function wirePath(sx: number, sy: number, tx: number, ty: number): string {
  const dy = ty - sy;
  if (Math.abs(dy) < 0.5) return `M${sx},${sy} H${tx}`;
  const mx = (sx + tx) / 2;
  // Round the corners, but never more than the room available (avoids squiggles).
  const r = Math.min(6, Math.abs(dy) / 2, (tx - sx) / 4);
  const s = Math.sign(dy);
  return [
    `M${sx},${sy}`,
    `H${mx - r}`,
    `Q${mx},${sy} ${mx},${sy + s * r}`,
    `V${ty - s * r}`,
    `Q${mx},${ty} ${mx + r},${ty}`,
    `H${tx}`,
  ].join(' ');
}

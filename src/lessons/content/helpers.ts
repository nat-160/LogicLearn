/**
 * Small helpers for writing lesson content (the index.ts file of each lesson).
 */
import { buildCircuit, type Bit } from '../../sim';

/** true/false (or 1/0) as a bit, for writing expected truth tables with rowsFrom(). */
export const b = (v: boolean | number): Bit => (v ? 1 : 0);

/**
 * Locked switches (left) and lights (right) that a build step starts with, placed so
 * their pins line up with a 2-input gate's pins (inputs 40px apart, output in between).
 * Positions are in grid cells (20px).
 *  - `colors`: a light color per output label, e.g. { S: 'green' };
 *  - `outputX`: how far right the lights sit (more room for bigger circuits).
 */
export const io = (
  inputs: string[],
  outputs: string[],
  { colors = {}, outputX = 20 }: { colors?: Record<string, string>; outputX?: number } = {},
) => [
  ...inputs.map((id, i) => ({
    id,
    type: 'SWITCH',
    at: [0, i * 4] as [number, number],
    locked: true,
  })),
  ...outputs.map((id, i) => ({
    id,
    type: 'LIGHT',
    at: [outputX, (inputs.length === 1 ? 0 : 1) + i * 4] as [number, number],
    locked: true,
    ...(colors[id] && { props: { color: colors[id] } }),
  })),
];

/** An explain-step example: one 2-input gate between locked switches A, B and light Y. */
export const gateExample = (name: string, type: string) =>
  buildCircuit({
    name,
    parts: [
      { id: 'A', type: 'SWITCH', at: [0, 0], locked: true },
      { id: 'B', type: 'SWITCH', at: [0, 4], locked: true },
      { id: 'g', type, at: [7, 0], locked: true },
      { id: 'Y', type: 'LIGHT', at: [14, 1], locked: true },
    ],
    wires: [
      ['A', 'g.in0'],
      ['B', 'g.in1'],
      ['g', 'Y'],
    ],
  });

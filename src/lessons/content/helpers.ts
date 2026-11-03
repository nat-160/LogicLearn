/**
 * Small helpers for writing lesson content (the index.ts file of each lesson).
 */
import type { Bit } from '../../sim';

/** true/false (or 1/0) as a bit, for writing expected truth tables with rowsFrom(). */
export const b = (v: boolean | number): Bit => (v ? 1 : 0);

/**
 * Locked switches (left) and lights (right) that a build step starts with, placed so
 * their pins line up with a 2-input gate's pins (inputs 40px apart, output in between).
 * Positions are in grid cells (20px).
 */
export const io = (inputs: string[], outputs: string[]) => [
  ...inputs.map((id, i) => ({
    id,
    type: 'SWITCH',
    at: [0, i * 4] as [number, number],
    locked: true,
  })),
  ...outputs.map((id, i) => ({
    id,
    type: 'LIGHT',
    at: [20, (inputs.length === 1 ? 0 : 1) + i * 4] as [number, number],
    locked: true,
  })),
];

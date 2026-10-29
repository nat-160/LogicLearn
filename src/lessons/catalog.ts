/**
 * Every lesson, in order, plus the planned lessons that aren't built yet (shown as
 * "coming soon" in the lesson list). The order follows docs/curriculum-outline.md.
 */
import { notAndLesson } from './content/not-and';
import type { Lesson } from './types';

export const LESSONS: Lesson[] = [notAndLesson];

export interface PlannedLesson {
  number: number;
  title: string;
}

/** Lessons from the curriculum outline that are not built yet. */
export const PLANNED_LESSONS: PlannedLesson[] = [
  { number: 0, title: 'Editor tour' },
  { number: 1, title: 'Signals: on/off, 0/1' },
  { number: 3, title: 'OR and XOR' },
  { number: 4, title: 'From circuit to truth table' },
  { number: 5, title: 'NAND and NOR' },
  { number: 6, title: 'XNOR, implication, and English → logic' },
  { number: 7, title: 'From truth table to circuit' },
  { number: 8, title: 'Useful circuits: adders' },
];

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

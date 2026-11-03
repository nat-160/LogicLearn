/**
 * Every lesson, in order, plus the planned lessons that aren't built yet (shown as
 * "coming soon" in the lesson list). The order follows docs/curriculum-outline.md.
 */
import { notAndLesson } from './content/not-and';
import { findSharedText, localizeLesson } from './lessonText';
import type { Lesson, LessonDef } from './types';

/** Every built lesson, in course order. Lessons open in this order (gating.ts). */
export const LESSON_DEFS: LessonDef[] = [notAndLesson];

/** The units, each with a title and summary in content/_shared/<locale>/unit-N.md. */
export const UNITS = [1, 2] as const;

export interface PlannedLesson {
  number: number;
  unit: number;
  title: string;
}

/** Lessons from the curriculum outline that are not built yet (English titles for now). */
export const PLANNED_LESSONS: PlannedLesson[] = [
  { number: 0, unit: 1, title: 'Editor tour' },
  { number: 1, unit: 1, title: 'Signals: on/off, 0/1' },
  { number: 3, unit: 1, title: 'OR and XOR' },
  { number: 4, unit: 1, title: 'From circuit to truth table' },
  { number: 5, unit: 2, title: 'NAND and NOR' },
  { number: 6, unit: 2, title: 'XNOR, implication, and English → logic' },
  { number: 7, unit: 2, title: 'From truth table to circuit' },
  { number: 8, unit: 2, title: 'Useful circuits: adders' },
];

/** A unit's title and one-line summary in the given language. */
export function unitText(unit: number, locale: string): { title: string; summary: string } {
  const text = findSharedText(`unit-${unit}`, locale);
  return { title: text?.title || `Unit ${unit}`, summary: text?.prose ?? '' };
}

const cache = new Map<string, Lesson[]>();

/** All lessons, with their text in the given language. */
export function getLessons(locale: string): Lesson[] {
  let lessons = cache.get(locale);
  if (!lessons) {
    lessons = LESSON_DEFS.map((def) => localizeLesson(def, locale));
    cache.set(locale, lessons);
  }
  return lessons;
}

export function findLesson(id: string, locale: string): Lesson | undefined {
  return getLessons(locale).find((l) => l.id === id);
}

/**
 * Every lesson, in order, plus the planned lessons that aren't built yet (shown as
 * "coming soon" in the lesson list). The order follows docs/curriculum-outline.md.
 */
import { notAndLesson } from './content/not-and';
import { localizeLesson } from './lessonText';
import type { Lesson, LessonDef } from './types';

export const LESSON_DEFS: LessonDef[] = [notAndLesson];

export interface PlannedLesson {
  number: number;
  title: string;
}

/** Lessons from the curriculum outline that are not built yet (English titles for now). */
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

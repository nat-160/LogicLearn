/**
 * Which lessons are open (lesson-level gating), and where a student should continue.
 *
 * Lessons open in order: a lesson opens once the lesson before it is complete. Some
 * escapes keep this from getting in the way:
 *  - An optional lesson (the editor tour) is always open and never required.
 *  - A lesson the student has already started (any step done) stays open, even if a new
 *    lesson is added before it later.
 *  - A unit's project opens when the unit's lessons are complete, but the next unit
 *    doesn't wait for the project: open-ended work shouldn't block progress.
 *  - The test version (dev branch) has an "Unlock all lessons" switch for testing.
 *    Teachers' bypass codes come in Phase 3.
 *
 * A lesson is complete when its last step is done.
 */
import { create } from 'zustand';
import { IS_TEST_VERSION } from '../app/site';
import { readLocal, storageKey, writeLocal } from '../storage/storage';
import { isStepDone, type ProgressMap } from './progress';
import type { Lesson } from './types';

export function isLessonComplete(steps: ProgressMap, lesson: Lesson): boolean {
  const last = lesson.steps[lesson.steps.length - 1];
  return !!last && isStepDone(steps, lesson.id, last.id);
}

function isLessonStarted(steps: ProgressMap, lesson: Lesson): boolean {
  return lesson.steps.some((s) => isStepDone(steps, lesson.id, s.id));
}

/** How a lesson is named on screen: "Lesson 3", or "Unit 1 project". */
export function lessonName(lesson: Pick<Lesson, 'kind' | 'number' | 'unit'>): string {
  return lesson.kind === 'project' ? `Unit ${lesson.unit} project` : `Lesson ${lesson.number}`;
}

const isRequiredLesson = (l: Lesson) => (l.kind ?? 'lesson') === 'lesson' && !l.optional;

/**
 * The lesson that must be complete before `lessons[index]` opens, or undefined if it
 * is open from the start. `lessons` is in course order (catalog.ts).
 */
export function prerequisite(lessons: readonly Lesson[], index: number): Lesson | undefined {
  const lesson = lessons[index];
  if (lesson.optional) return undefined;
  const earlier = lessons.slice(0, index).filter(isRequiredLesson);
  if (lesson.kind === 'project') {
    // The last lesson of the project's own unit.
    return earlier.filter((l) => l.unit === lesson.unit).at(-1);
  }
  return earlier.at(-1);
}

export function isLessonUnlocked(
  steps: ProgressMap,
  lessons: readonly Lesson[],
  index: number,
  unlockAll = false,
): boolean {
  const lesson = lessons[index];
  if (unlockAll || isLessonStarted(steps, lesson)) return true;
  const before = prerequisite(lessons, index);
  return !before || isLessonComplete(steps, before);
}

/**
 * Where "Continue" should go: the first open, required lesson that isn't complete, at its
 * first step that isn't done. Undefined when every required lesson is complete.
 */
export function nextStepFor(
  steps: ProgressMap,
  lessons: readonly Lesson[],
  unlockAll = false,
): { lesson: Lesson; index: number } | undefined {
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    if (!isRequiredLesson(lesson) || isLessonComplete(steps, lesson)) continue;
    if (!isLessonUnlocked(steps, lessons, i, unlockAll)) return undefined;
    const index = lesson.steps.findIndex((s) => !isStepDone(steps, lesson.id, s.id));
    return { lesson, index: Math.max(0, index) };
  }
  return undefined;
}

// --- "Unlock all lessons" (test version only) -----------------------------------------

const UNLOCK_KEY = storageKey('unlock-all');

interface UnlockAllState {
  /** Always false on the live site. */
  unlockAll: boolean;
  setUnlockAll(on: boolean): void;
}

export const useUnlockAll = create<UnlockAllState>()((set) => ({
  unlockAll: IS_TEST_VERSION && readLocal(UNLOCK_KEY) === '1',
  setUnlockAll: (on) => {
    if (!IS_TEST_VERSION) return;
    writeLocal(UNLOCK_KEY, on ? '1' : '0');
    set({ unlockAll: on });
  },
}));

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
 *  - A unit test-out (an optional quiz made of the unit's challenges) lets a student who
 *    already knows the material skip the unit: passing it counts the unit's lessons as
 *    done for opening later lessons. Unit 1's test-out is open from the start; later ones
 *    open after the unit before.
 *  - A teacher's unlock code opens one lesson for a student (codes.ts).
 *  - The test version (dev branch) has an "Unlock all lessons" switch for testing.
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

/** How a lesson is named on screen: "Lesson 3", "Unit 1 project" or "Unit 1 test-out". */
export function lessonName(lesson: Pick<Lesson, 'kind' | 'number' | 'unit'>): string {
  if (lesson.kind === 'project') return `Unit ${lesson.unit} project`;
  if (lesson.kind === 'test-out') return `Unit ${lesson.unit} test-out`;
  return `Lesson ${lesson.number}`;
}

const isRequiredLesson = (l: Lesson) => (l.kind ?? 'lesson') === 'lesson' && !l.optional;

/** Whether the student passed the test-out of `unit`. */
export function isUnitTestedOut(steps: ProgressMap, lessons: readonly Lesson[], unit: number) {
  return lessons.some(
    (l) => l.kind === 'test-out' && l.unit === unit && isLessonComplete(steps, l),
  );
}

/**
 * Whether a lesson counts as done for opening later lessons: complete, or (for a
 * required lesson) skipped by passing its unit's test-out.
 */
export function isLessonDone(steps: ProgressMap, lessons: readonly Lesson[], lesson: Lesson) {
  if (isLessonComplete(steps, lesson)) return true;
  return isRequiredLesson(lesson) && isUnitTestedOut(steps, lessons, lesson.unit);
}

const NO_CODES: ReadonlySet<string> = new Set();

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
  if (lesson.kind === 'test-out') {
    // The last lesson of the units before: Unit 1's test-out is open from the start.
    return earlier.filter((l) => l.unit < lesson.unit).at(-1);
  }
  return earlier.at(-1);
}

export function isLessonUnlocked(
  steps: ProgressMap,
  lessons: readonly Lesson[],
  index: number,
  unlockAll = false,
  /** Lessons opened with a teacher's unlock code. */
  unlocked: ReadonlySet<string> = NO_CODES,
): boolean {
  const lesson = lessons[index];
  if (unlockAll || unlocked.has(lesson.id) || isLessonStarted(steps, lesson)) return true;
  const before = prerequisite(lessons, index);
  return !before || isLessonDone(steps, lessons, before);
}

/**
 * Where "Continue" should go: the first open, required lesson that isn't complete, at its
 * first step that isn't done. Undefined when every required lesson is complete.
 */
export function nextStepFor(
  steps: ProgressMap,
  lessons: readonly Lesson[],
  unlockAll = false,
  unlocked: ReadonlySet<string> = NO_CODES,
): { lesson: Lesson; index: number } | undefined {
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    if (!isRequiredLesson(lesson) || isLessonDone(steps, lessons, lesson)) continue;
    if (!isLessonUnlocked(steps, lessons, i, unlockAll, unlocked)) return undefined;
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

// --- Lessons opened with a teacher's unlock code ------------------------------------------

const UNLOCKED_KEY = storageKey('unlocked');

function loadUnlocked(): Set<string> {
  try {
    const raw: unknown = JSON.parse(readLocal(UNLOCKED_KEY) ?? '[]');
    // Saved data is untrusted: keep only short lesson ids.
    return new Set(
      Array.isArray(raw)
        ? raw.filter((id): id is string => typeof id === 'string' && /^[a-z0-9-]{1,64}$/.test(id))
        : [],
    );
  } catch {
    return new Set();
  }
}

interface UnlockedState {
  unlocked: ReadonlySet<string>;
  unlock(lessonId: string): void;
}

export const useUnlocked = create<UnlockedState>()((set, get) => ({
  unlocked: loadUnlocked(),
  unlock: (lessonId) => {
    const unlocked = new Set(get().unlocked).add(lessonId);
    writeLocal(UNLOCKED_KEY, JSON.stringify([...unlocked]));
    set({ unlocked });
  },
}));

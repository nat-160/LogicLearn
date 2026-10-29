/**
 * Lesson progress, saved in this browser. It holds no personal information – only which
 * steps are done, how many check attempts and hints were used, which truth-table rows
 * were tried, and when. Later phases use the same records for test-outs, teacher
 * completion codes and the opt-in beta export.
 */
import { create } from 'zustand';
import { readLocal, storageKey, writeLocal } from '../storage/storage';
import type { Lesson } from './types';

export interface StepProgress {
  done: boolean;
  /** How many times Check was pressed. */
  attempts: number;
  hintsUsed: number;
  /** Truth-table row numbers tried with the switches. */
  triedRows: number[];
  firstSeen: string;
  lastSeen: string;
}

const KEY = storageKey('progress:v1');

type ProgressMap = Record<string, StepProgress>;

function load(): ProgressMap {
  try {
    const parsed: unknown = JSON.parse(readLocal(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as ProgressMap)
      : {};
  } catch {
    return {};
  }
}

export const stepKey = (lessonId: string, stepId: string) => `${lessonId}/${stepId}`;

interface ProgressState {
  steps: ProgressMap;
  /** Note that a step was opened. */
  visit(lessonId: string, stepId: string): void;
  recordAttempt(
    lessonId: string,
    stepId: string,
    passed: boolean,
    triedRows: Iterable<number>,
  ): void;
  recordHint(lessonId: string, stepId: string): void;
  complete(lessonId: string, stepId: string): void;
  resetLesson(lesson: Lesson): void;
}

export const useProgress = create<ProgressState>()((set, get) => {
  /**
   * Change one step's record. Progress is re-read from storage first, so another open tab's
   * progress is merged in rather than overwritten. A step that is done stays done.
   */
  const update = (key: string, change: (old: StepProgress) => Partial<StepProgress>) => {
    const now = new Date().toISOString();
    const saved = { ...get().steps, ...load() };
    const old: StepProgress = saved[key] ?? {
      done: false,
      attempts: 0,
      hintsUsed: 0,
      triedRows: [],
      firstSeen: now,
      lastSeen: now,
    };
    const next = { ...old, ...change(old), lastSeen: now };
    next.done = old.done || next.done;
    const steps = { ...saved, [key]: next };
    set({ steps });
    writeLocal(KEY, JSON.stringify(steps));
  };

  // Follow progress made in other tabs.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === KEY) set({ steps: load() });
    });
  }

  return {
    steps: load(),
    visit: (lessonId, stepId) => update(stepKey(lessonId, stepId), () => ({})),
    recordAttempt: (lessonId, stepId, passed, triedRows) =>
      update(stepKey(lessonId, stepId), (old) => ({
        attempts: old.attempts + 1,
        done: old.done || passed,
        triedRows: [...new Set([...old.triedRows, ...triedRows])].sort((a, b) => a - b),
      })),
    recordHint: (lessonId, stepId) =>
      update(stepKey(lessonId, stepId), (old) => ({ hintsUsed: old.hintsUsed + 1 })),
    complete: (lessonId, stepId) => update(stepKey(lessonId, stepId), () => ({ done: true })),
    resetLesson: (lesson) => {
      const steps = { ...get().steps, ...load() };
      for (const step of lesson.steps) delete steps[stepKey(lesson.id, step.id)];
      set({ steps });
      writeLocal(KEY, JSON.stringify(steps));
    },
  };
});

export function isStepDone(steps: ProgressMap, lessonId: string, stepId: string): boolean {
  return steps[stepKey(lessonId, stepId)]?.done ?? false;
}

/** Steps unlock in order: a step is open once every step before it is done. */
export function isStepUnlocked(steps: ProgressMap, lesson: Lesson, index: number): boolean {
  return lesson.steps.slice(0, index).every((s) => isStepDone(steps, lesson.id, s.id));
}

export function lessonProgress(
  steps: ProgressMap,
  lesson: Lesson,
): { done: number; total: number } {
  return {
    done: lesson.steps.filter((s) => isStepDone(steps, lesson.id, s.id)).length,
    total: lesson.steps.length,
  };
}

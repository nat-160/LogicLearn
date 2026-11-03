/**
 * Practice steps (types.ts PracticeDef): which one to offer after a failed check, and
 * which lesson step to go back to afterwards.
 */
import { isStepDone, type ProgressMap } from './progress';
import type { Lesson, Practice } from './types';

/** Failed checks on a step before practice is offered whatever the mistake was. */
export const PRACTICE_AFTER_FAILURES = 3;

/**
 * The practice to offer on `stepId` after a failed check: one made for the recognized
 * mistake, or – after a few failed checks – any practice the step offers.
 */
export function findPractice(
  lesson: Lesson,
  stepId: string,
  misconceptionId: string | undefined,
  failures: number,
): Practice | undefined {
  const offered = lesson.practice.filter((p) => p.from.includes(stepId));
  const matching = misconceptionId && offered.find((p) => p.for.includes(misconceptionId));
  if (matching) return matching;
  return failures >= PRACTICE_AFTER_FAILURES ? offered[0] : undefined;
}

/** The lesson step (index) to go back to: the first step offering it that isn't done. */
export function practiceReturnIndex(
  lesson: Lesson,
  practice: Practice,
  steps: ProgressMap,
): number {
  const from = lesson.steps
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => practice.from.includes(s.id));
  const open = from.find(({ s }) => !isStepDone(steps, lesson.id, s.id));
  return (open ?? from[0])?.i ?? 0;
}

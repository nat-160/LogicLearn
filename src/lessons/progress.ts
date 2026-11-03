/**
 * Lesson progress, saved in this browser. It holds no personal information – only which
 * steps are done, how many check attempts and hints were used, which truth-table rows
 * were tried, and when. Later phases use the same records for test-outs, teacher
 * completion codes and the opt-in beta export.
 *
 * Saved progress is untrusted data (it may be old, edited, or come from a file), so it is
 * always rebuilt field by field by parseProgress(). Two copies of progress (another tab, an
 * imported file) are combined by mergeProgress(), which never undoes progress: a step that
 * is done stays done, counts only go up, and tried rows are added together.
 */
import { create } from 'zustand';
import { readLocal, storageKey, writeLocal } from '../storage/storage';
import type { Lesson } from './types';

export interface StepProgress {
  done: boolean;
  /** How many times Check was pressed. */
  attempts: number;
  /** The highest hint revealed (1 = the first hint), so hints stay shown after a reload. */
  hintsUsed: number;
  /** Truth-table row numbers tried with the switches. */
  triedRows: number[];
  /** ISO timestamps; may be empty in old or hand-made records. */
  firstSeen: string;
  lastSeen: string;
}

const KEY = storageKey('progress:v1');

export type ProgressMap = Record<string, StepProgress>;

// Limits for loaded data, so a damaged or hostile file can't fill memory or the screen.
const MAX_STEPS = 1000;
const MAX_COUNT = 1_000_000;
const MAX_ROW = 1023; // the checker handles up to 10 inputs
const MAX_TEXT = 40;
const STEP_KEY = /^[a-z0-9][a-z0-9-]{0,63}\/[a-z0-9][a-z0-9-]{0,63}$/;

/** Whether `key` looks like "lesson-id/step-id". */
export const isStepKey = (key: string) => STEP_KEY.test(key);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A whole number in range, the default when missing, or undefined when it's invalid. */
function count(v: unknown, fallback = 0): number | undefined {
  if (v === undefined) return fallback;
  return Number.isInteger(v) && (v as number) >= 0 && (v as number) <= MAX_COUNT
    ? (v as number)
    : undefined;
}

function text(v: unknown): string | undefined {
  if (v === undefined) return '';
  return typeof v === 'string' && v.length <= MAX_TEXT ? v : undefined;
}

/** One step's record rebuilt from checked fields, or undefined if it is malformed. */
function parseStep(raw: unknown): StepProgress | undefined {
  if (!isRecord(raw)) return undefined;
  const done = raw.done === undefined ? false : raw.done;
  const attempts = count(raw.attempts);
  const hintsUsed = count(raw.hintsUsed);
  const firstSeen = text(raw.firstSeen);
  const lastSeen = text(raw.lastSeen);
  const rows = raw.triedRows === undefined ? [] : raw.triedRows;
  if (
    typeof done !== 'boolean' ||
    attempts === undefined ||
    hintsUsed === undefined ||
    firstSeen === undefined ||
    lastSeen === undefined ||
    !Array.isArray(rows) ||
    rows.length > MAX_ROW + 1 ||
    !rows.every((r) => Number.isInteger(r) && r >= 0 && r <= MAX_ROW)
  ) {
    return undefined;
  }
  return {
    done,
    attempts,
    hintsUsed,
    triedRows: [...new Set(rows as number[])].sort((a, b) => a - b),
    firstSeen,
    lastSeen,
  };
}

/**
 * Progress rebuilt from untrusted data (localStorage, another tab, a file). Malformed
 * steps are dropped and the rest is kept; unknown fields are ignored.
 */
export function parseProgress(raw: unknown): ProgressMap {
  const out: ProgressMap = {};
  if (!isRecord(raw)) return out;
  for (const [key, value] of Object.entries(raw).slice(0, MAX_STEPS)) {
    if (!STEP_KEY.test(key)) continue;
    const step = parseStep(value);
    if (step) out[key] = step;
  }
  return out;
}

/** The earlier (or later) of two timestamps, ignoring empty ones. */
const earliest = (a: string, b: string) => (!a ? b : !b ? a : a < b ? a : b);
const latest = (a: string, b: string) => (a > b ? a : b);

/** Two records of the same step combined, without undoing any progress. */
export function mergeStep(a: StepProgress, b: StepProgress): StepProgress {
  return {
    done: a.done || b.done,
    attempts: Math.max(a.attempts, b.attempts),
    hintsUsed: Math.max(a.hintsUsed, b.hintsUsed),
    triedRows: [...new Set([...a.triedRows, ...b.triedRows])].sort((x, y) => x - y),
    firstSeen: earliest(a.firstSeen, b.firstSeen),
    lastSeen: latest(a.lastSeen, b.lastSeen),
  };
}

/** Two copies of progress combined, step by step (see mergeStep). */
export function mergeProgress(a: ProgressMap, b: ProgressMap): ProgressMap {
  const out: ProgressMap = { ...a };
  for (const [key, step] of Object.entries(b)) {
    out[key] = out[key] ? mergeStep(out[key], step) : step;
  }
  return out;
}

function load(): ProgressMap {
  try {
    return parseProgress(JSON.parse(readLocal(KEY) ?? '{}'));
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
  /** Note that hint number `level` (1, 2, …) was revealed. */
  revealHint(lessonId: string, stepId: string, level: number): void;
  complete(lessonId: string, stepId: string): void;
  resetLesson(lesson: Lesson): void;
  /** Add progress from elsewhere (an imported file), never undoing any progress. */
  mergeIn(incoming: ProgressMap): void;
}

export const useProgress = create<ProgressState>()((set, get) => {
  /**
   * Change one step's record. Progress is re-read from storage first, so another open tab's
   * progress is merged in rather than overwritten. A step that is done stays done.
   */
  const update = (key: string, change: (old: StepProgress) => Partial<StepProgress>) => {
    const now = new Date().toISOString();
    const saved = mergeProgress(get().steps, load());
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
      if (e.key === KEY) set({ steps: mergeProgress(get().steps, load()) });
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
    revealHint: (lessonId, stepId, level) =>
      update(stepKey(lessonId, stepId), (old) => ({
        hintsUsed: Math.max(old.hintsUsed, level),
      })),
    complete: (lessonId, stepId) => update(stepKey(lessonId, stepId), () => ({ done: true })),
    mergeIn: (incoming) => {
      const steps = mergeProgress(mergeProgress(get().steps, load()), incoming);
      set({ steps });
      writeLocal(KEY, JSON.stringify(steps));
    },
    resetLesson: (lesson) => {
      const steps = mergeProgress(get().steps, load());
      for (const step of lesson.steps) delete steps[stepKey(lesson.id, step.id)];
      set({ steps });
      writeLocal(KEY, JSON.stringify(steps));
    },
  };
});

export function isStepDone(steps: ProgressMap, lessonId: string, stepId: string): boolean {
  return steps[stepKey(lessonId, stepId)]?.done ?? false;
}

/**
 * Steps unlock in order: a step is open once every step before it is done. Once the
 * lesson's last step is done, every step stays open – so a step added to a lesson later
 * never locks a student out of a lesson they already finished.
 */
export function isStepUnlocked(steps: ProgressMap, lesson: Lesson, index: number): boolean {
  const last = lesson.steps[lesson.steps.length - 1];
  if (last && isStepDone(steps, lesson.id, last.id)) return true;
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

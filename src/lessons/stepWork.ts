/**
 * A student's saved work on a lesson step (the circuit they are building), kept in this
 * browser so a reload doesn't lose it.
 *
 * Saved work is stored with a fingerprint of the step's starter parts. If the lesson is
 * updated later (its locked parts change), old work no longer fits the task and is
 * ignored, so the student starts from the new starter instead of getting stuck.
 */
import { loadCircuit, type CircuitDoc } from '../sim';
import { listLocalKeys, readLocal, storageKey, writeLocal } from '../storage/storage';
import { parseSavedWork, type SavedWork } from './progressFile';
import { stepKey } from './progress';

/** Where a step's work is saved: "logiclearn:work:<lesson>/<step>". */
export function workKey(lessonId: string, stepId: string): string {
  return storageKey(`work:${stepKey(lessonId, stepId)}`);
}

const WORK_PREFIX = 'work:';

/** Every saved circuit in this browser, by "lesson/step" (for the progress file). */
export function readAllWork(): Record<string, SavedWork> {
  const out: Record<string, SavedWork> = {};
  for (const name of listLocalKeys(WORK_PREFIX)) {
    try {
      const saved = parseSavedWork(JSON.parse(readLocal(storageKey(name)) ?? 'null'));
      if (saved) out[name.slice(WORK_PREFIX.length)] = saved;
    } catch {
      // A damaged save is left out of the file.
    }
  }
  return out;
}

/** Whether this browser has a saved circuit for "lesson/step". */
export function hasWork(key: string): boolean {
  return readLocal(storageKey(`${WORK_PREFIX}${key}`)) !== null;
}

/** Save a circuit for "lesson/step" (when loading a progress file). */
export function writeWork(key: string, saved: SavedWork): void {
  writeLocal(storageKey(`${WORK_PREFIX}${key}`), JSON.stringify(saved));
}

export function starterFingerprint(starter: CircuitDoc): string {
  return starter.components
    .filter((c) => c.locked)
    .map((c) => `${c.id}:${c.type}:${c.label ?? ''}`)
    .join('|');
}

export function saveWork(key: string, starter: CircuitDoc, doc: CircuitDoc): void {
  writeLocal(key, JSON.stringify({ starter: starterFingerprint(starter), doc }));
}

export function loadWork(key: string, starter: CircuitDoc): CircuitDoc | null {
  try {
    const saved: unknown = JSON.parse(readLocal(key) ?? 'null');
    if (!saved || typeof saved !== 'object') return null;
    const { starter: fingerprint, doc } = saved as { starter?: unknown; doc?: unknown };
    if (fingerprint !== starterFingerprint(starter)) return null;
    const result = loadCircuit(doc);
    return result.ok ? result.doc : null;
  } catch {
    return null;
  }
}

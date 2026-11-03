/**
 * A student's saved work on a lesson step (the circuit they are building), kept in this
 * browser so a reload doesn't lose it.
 *
 * Saved work is stored with a fingerprint of the step's starter parts. If the lesson is
 * updated later (its locked parts change), old work no longer fits the task and is
 * ignored, so the student starts from the new starter instead of getting stuck.
 */
import { loadCircuit, type CircuitDoc } from '../sim';
import { readLocal, storageKey, writeLocal } from '../storage/storage';
import { stepKey } from './progress';

/** Where a step's work is saved: "logiclearn:work:<lesson>/<step>". */
export function workKey(lessonId: string, stepId: string): string {
  return storageKey(`work:${stepKey(lessonId, stepId)}`);
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

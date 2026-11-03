/**
 * "Save my progress to a file" and "Load progress from a file".
 *
 * Progress lives only in this browser, and browsers can erase it: Safari after 7 days
 * without a visit, shared or guest-mode Chromebooks when the session ends. A progress file
 * lets a student keep it, or move it to another computer. The file holds:
 *
 *   - steps: the same records as the progress store (no personal information), and
 *   - work:  the circuits saved on lesson steps, so unfinished work moves too.
 *
 * Loading a file never undoes progress (mergeProgress) and never overwrites a circuit
 * this browser already has. Files are untrusted: every part is checked as it is loaded.
 * The site's storage prefix is never written, so files from the live site and the test
 * version can be loaded into either.
 */
import { loadCircuit, type CircuitDoc } from '../sim';
import { isStepKey, mergeProgress, parseProgress, type ProgressMap } from './progress';

export const PROGRESS_FORMAT = 'logiclearn-progress';
export const PROGRESS_FILE_VERSION = 1;

/** A step's saved circuit, as stored by stepWork.ts. */
export interface SavedWork {
  /** Fingerprint of the step's starter parts (stepWork.ts starterFingerprint). */
  starter: string;
  doc: CircuitDoc;
}

export interface ProgressFile {
  format: typeof PROGRESS_FORMAT;
  version: typeof PROGRESS_FILE_VERSION;
  exportedAt: string;
  site: 'live' | 'dev';
  steps: ProgressMap;
  /** Saved circuits by "lesson/step". */
  work: Record<string, SavedWork>;
}

export function buildProgressFile(
  steps: ProgressMap,
  work: Record<string, SavedWork>,
  site: 'live' | 'dev',
  now = new Date(),
): ProgressFile {
  return {
    format: PROGRESS_FORMAT,
    version: PROGRESS_FILE_VERSION,
    exportedAt: now.toISOString(),
    site,
    steps,
    work,
  };
}

/** The file name offered when saving, e.g. "logiclearn-progress-2026-11-04.json". */
export function progressFileName(site: 'live' | 'dev', now = new Date()): string {
  const date = now.toISOString().slice(0, 10);
  return `logiclearn-progress${site === 'dev' ? '-test-version' : ''}-${date}.json`;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** A saved circuit from untrusted data, or undefined if it isn't valid. */
export function parseSavedWork(raw: unknown): SavedWork | undefined {
  if (!isRecord(raw) || typeof raw.starter !== 'string' || raw.starter.length > 5000) {
    return undefined;
  }
  const result = loadCircuit(raw.doc);
  return result.ok ? { starter: raw.starter, doc: result.doc } : undefined;
}

export type ParsedProgressFile =
  { ok: true; steps: ProgressMap; work: Record<string, SavedWork> } | { ok: false; error: string };

/** Read a progress file's text. Damaged steps and circuits are skipped, not fatal. */
export function parseProgressFile(text: string): ParsedProgressFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't a LogicLearn progress file." };
  }
  if (!isRecord(raw) || raw.format !== PROGRESS_FORMAT) {
    return { ok: false, error: "That file isn't a LogicLearn progress file." };
  }
  if (typeof raw.version !== 'number' || raw.version > PROGRESS_FILE_VERSION) {
    return {
      ok: false,
      error: 'That file was made by a newer version of LogicLearn. Reload the page and try again.',
    };
  }
  const work: Record<string, SavedWork> = {};
  if (isRecord(raw.work)) {
    for (const [key, value] of Object.entries(raw.work).slice(0, 1000)) {
      const saved = isStepKey(key) ? parseSavedWork(value) : undefined;
      if (saved) work[key] = saved;
    }
  }
  return { ok: true, steps: parseProgress(raw.steps), work };
}

export interface ImportReport {
  /** Steps this browser had no record of. */
  added: number;
  /** Steps whose record changed (e.g. a step became done). */
  updated: number;
  /** Saved circuits copied in, because this browser had none for that step. */
  restored: number;
  /** Saved circuits skipped, because this browser already has work on that step. */
  kept: number;
}

/**
 * What loading a file would do: the merged progress, the circuits to copy in, and a
 * report for the student. `hasLocalWork(key)` says whether this browser already has a
 * circuit saved for a step.
 */
export function planImport(
  local: ProgressMap,
  incoming: { steps: ProgressMap; work: Record<string, SavedWork> },
  hasLocalWork: (stepKey: string) => boolean,
): { steps: ProgressMap; restore: Record<string, SavedWork>; report: ImportReport } {
  const steps = mergeProgress(local, incoming.steps);
  const report: ImportReport = { added: 0, updated: 0, restored: 0, kept: 0 };
  for (const key of Object.keys(incoming.steps)) {
    if (!local[key]) report.added++;
    else if (JSON.stringify(local[key]) !== JSON.stringify(steps[key])) report.updated++;
  }
  const restore: Record<string, SavedWork> = {};
  for (const [key, saved] of Object.entries(incoming.work)) {
    if (hasLocalWork(key)) report.kept++;
    else {
      restore[key] = saved;
      report.restored++;
    }
  }
  return { steps, restore, report };
}

/** The report in a sentence, e.g. "Loaded: 3 steps added, 1 updated, 2 circuits restored." */
export function describeImport(report: ImportReport): string {
  const parts = [`${report.added} ${report.added === 1 ? 'step' : 'steps'} added`];
  parts.push(`${report.updated} updated`);
  if (report.restored)
    parts.push(
      `${report.restored} saved ${report.restored === 1 ? 'circuit' : 'circuits'} restored`,
    );
  if (report.kept) {
    const what = report.kept === 1 ? 'saved circuit' : 'saved circuits';
    parts.push(`${report.kept} ${what} not replaced (this browser already had work there)`);
  }
  return `Progress loaded: ${parts.join(', ')}.`;
}

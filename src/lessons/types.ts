/**
 * What a lesson is made of.
 *
 * A lesson is a list of steps, following the course structure: direct instruction
 * ("explain"), then guided construction ("guided": build with a starter circuit and a
 * limited set of parts), then a mastery check ("challenge": less help, sometimes in
 * predict-first mode). Remediation and project steps arrive in Phase 2.
 *
 * Lesson TEXT lives in Markdown files next to each lesson (content/<lesson>/<step>.md) so
 * it can be written and edited without touching code. Everything else – circuits, checks,
 * hints – is TypeScript, so the computer can test it (see lessons.test.ts).
 */
import type { CheckSpec, CircuitDoc } from '../sim';

interface BaseStep {
  /** Stable id, used to save progress. Don't rename once published. */
  id: string;
  title: string;
  /** Markdown text shown in the lesson panel (imported with Vite's `?raw`). */
  prose: string;
}

export interface ExplainStep extends BaseStep {
  kind: 'explain';
  /** An example circuit to explore. Students can flip its switches but not edit it. */
  example?: CircuitDoc;
}

export interface BuildStep extends BaseStep {
  kind: 'guided' | 'challenge';
  /** What the student starts with. Lesson-provided parts are usually `locked`. */
  starter: CircuitDoc;
  /** A correct answer. The tests check that it passes `spec` (and that the starter fails). */
  solution: CircuitDoc;
  spec: CheckSpec;
  /** Part types the student may add. */
  palette: string[];
  /** Revealed one at a time when the student asks. */
  hints: string[];
  /**
   * false = "predict first": lights and wires don't show their values until the student
   * presses Check, so the task can't be solved by flipping switches until it looks right.
   */
  liveOutputs?: boolean;
  /** Whether the truth table is shown while building. 'predict' arrives in Phase 2. */
  truthTable?: 'live' | 'hidden';
}

export type Step = ExplainStep | BuildStep;

export interface Lesson {
  id: string;
  number: number;
  title: string;
  /** One sentence for the lesson list. */
  summary: string;
  /** Curriculum standards covered, e.g. "IB A1.2.3". */
  standards: string[];
  steps: Step[];
}

export function isBuildStep(step: Step): step is BuildStep {
  return step.kind === 'guided' || step.kind === 'challenge';
}

/** Markdown files whose first line is this marker still have placeholder text. */
export const DRAFT_MARKER = '<!-- draft -->';

/**
 * What a lesson is made of.
 *
 * A lesson is a list of steps, following the course structure: direct instruction
 * ("explain"), then guided construction ("guided": build with a starter circuit and a
 * limited set of parts), then a mastery check ("challenge": less help, sometimes in
 * predict-first mode). Remediation and project steps arrive in Phase 2.
 *
 * A lesson comes in two halves:
 *  - its DEFINITION (`LessonDef`, in content/<lesson>/index.ts): ids, circuits, checks,
 *    parts lists – everything that is the same in every language, and that the tests check;
 *  - its TEXT, one folder per language (content/<lesson>/<locale>/*.md): titles, the step
 *    text and hints, written in Markdown so they can be edited without touching code.
 * `localizeLesson()` (lessonText.ts) joins the two into a `Lesson` for the chosen language.
 */
import type { CheckSpec, CircuitDoc } from '../sim';

interface BaseStepDef {
  /** Stable id, used to save progress and to name the step's text file. Don't rename. */
  id: string;
}

export interface ExplainStepDef extends BaseStepDef {
  kind: 'explain';
  /** An example circuit to explore. Students can flip its switches but not edit it. */
  example?: CircuitDoc;
}

export interface BuildStepDef extends BaseStepDef {
  kind: 'guided' | 'challenge';
  /** What the student starts with. Lesson-provided parts are usually `locked`. */
  starter: CircuitDoc;
  /** A correct answer. The tests check that it passes `spec` (and that the starter fails). */
  solution: CircuitDoc;
  spec: CheckSpec;
  /** Part types the student may add. */
  palette: string[];
  /**
   * false = "predict first": lights and wires don't show their values until the student
   * presses Check, so the task can't be solved by flipping switches until it looks right.
   */
  liveOutputs?: boolean;
  /** Whether the truth table is shown while building. 'predict' arrives in Phase 2. */
  truthTable?: 'live' | 'hidden';
}

export type StepDef = ExplainStepDef | BuildStepDef;

export interface LessonDef {
  id: string;
  number: number;
  /** Curriculum standards covered, e.g. "IB A1.2.3". */
  standards: string[];
  steps: StepDef[];
}

/** A step's text in one language, read from its Markdown file. */
export interface StepText {
  title: string;
  /** Markdown shown in the lesson panel. */
  prose: string;
  /** Revealed one at a time when the student asks (Markdown, one line each). */
  hints: string[];
  /** Still placeholder text (the file starts with the draft marker). */
  draft: boolean;
  /** The language this text is actually in (it may have fallen back to en-US). */
  locale: string;
}

export type ExplainStep = ExplainStepDef & StepText;
export type BuildStep = BuildStepDef & StepText;
export type Step = ExplainStep | BuildStep;

/** A lesson with its text in one language: what the lesson screens use. */
export interface Lesson extends Omit<LessonDef, 'steps'> {
  title: string;
  /** One sentence for the lesson list. */
  summary: string;
  locale: string;
  steps: Step[];
}

export function isBuildStep<T extends StepDef>(step: T): step is T & BuildStepDef {
  return step.kind === 'guided' || step.kind === 'challenge';
}

/**
 * The two markers in lesson text files (written `<!-- draft -->` and `<!-- hints -->`),
 * forgiving small slips such as "<!--hints-->" or "<!-- Hints -->".
 *  - A file whose first line is the draft marker still has placeholder text.
 *  - In a step file, the list after the hints marker is the step's hints.
 */
export const DRAFT_PATTERN = /^<!--\s*draft\s*-->/i;
export const HINTS_PATTERN = /<!--\s*hints\s*-->/i;

/**
 * What a lesson is made of.
 *
 * A lesson is a list of steps, following the course structure: direct instruction
 * ("explain"), then guided construction ("guided": build with a starter circuit and a
 * limited set of parts), then a mastery check ("challenge": less help, sometimes in
 * predict-first mode). "predict" steps ask for a circuit's whole truth table before the
 * circuit shows its values.
 *
 * A lesson comes in two halves:
 *  - its DEFINITION (`LessonDef`, in content/<lesson>/index.ts): ids, circuits, checks,
 *    parts lists – everything that is the same in every language, and that the tests check;
 *  - its TEXT, one folder per language (content/<lesson>/<locale>/*.md): titles, the step
 *    text and hints, written in Markdown so they can be edited without touching code.
 * `localizeLesson()` (lessonText.ts) joins the two into a `Lesson` for the chosen language.
 */
import type { CheckRow, CheckSpec, CircuitDoc, Criterion } from '../sim';

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
  /** Whether the truth table is shown while building. */
  truthTable?: 'live' | 'hidden';
}

/**
 * Predict the truth table of a given circuit, then see the real one (predict → observe →
 * explain). The circuit is read-only and its values stay hidden until the student
 * submits a prediction for every row.
 *  - level 'guided': any complete prediction finishes the step; the answers are shown.
 *  - level 'challenge': every row must be right. After a miss the wrong rows are shown and
 *    the student tries the next circuit in `circuits`, so the answer can't be copied.
 */
export interface PredictStepDef extends BaseStepDef {
  kind: 'predict';
  level: 'guided' | 'challenge';
  /** Every part locked. A challenge needs at least two circuits with different tables. */
  circuits: CircuitDoc[];
}

/**
 * One choice in an open project ("door alarm", "voting machine"). Its "rule" is the truth
 * table the circuit must follow:
 *  - 'student': the brief fixes some rows and the student decides the rest – their own
 *    rule, which is then graded like any other;
 *  - 'fixed': the brief gives the whole table.
 * The grader (src/sim/grader.ts) checks the circuit against the rule and `criteria`.
 * Its words are in <locale>/<brief id>.md.
 */
export interface ProjectBriefDef {
  /** Stable id: names the text file and the saved work. Don't rename. */
  id: string;
  starter: CircuitDoc;
  palette: string[];
  /** Input and output labels, in truth-table (label) order. */
  inputs: string[];
  outputs: string[];
  rule: { kind: 'student'; given: CheckRow[] } | { kind: 'fixed'; rows: CheckRow[] };
  criteria: Criterion[];
  constraints?: CheckSpec['constraints'];
  /** A complete rule and a circuit that passes it (tests; the teacher answer key later). */
  example: { rule: CheckRow[]; solution: CircuitDoc };
}

/** An open project: choose a brief, write (or read) its rule, build, and get a checklist. */
export interface ProjectStepDef extends BaseStepDef {
  kind: 'project';
  briefs: ProjectBriefDef[];
}

export type StepDef = ExplainStepDef | BuildStepDef | PredictStepDef | ProjectStepDef;

export interface LessonDef {
  id: string;
  number: number;
  /** The unit the lesson belongs to (docs/curriculum-outline.md). */
  unit: number;
  /**
   * 'lesson' (the default) or 'project' (a unit's open project). Projects open when their
   * unit's lessons are done, and never block the next unit.
   */
  kind?: 'lesson' | 'project';
  /** An optional lesson (the editor tour): always open, and never required. */
  optional?: boolean;
  /** Gate types this lesson teaches, for the gate reminder card. */
  introduces?: string[];
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
export type PredictStep = PredictStepDef & StepText;
export type ProjectBrief = ProjectBriefDef & StepText;
export type ProjectStep = Omit<ProjectStepDef, 'briefs'> & StepText & { briefs: ProjectBrief[] };
export type Step = ExplainStep | BuildStep | PredictStep | ProjectStep;

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

export function isPredictStep<T extends StepDef>(step: T): step is T & PredictStepDef {
  return step.kind === 'predict';
}

/** Works for a step definition (ProjectStepDef) and a localized step (ProjectStep). */
export function isProjectStep<T extends StepDef | Step>(
  step: T,
): step is Extract<T, { kind: 'project' }> {
  return step.kind === 'project';
}

/**
 * The two markers in lesson text files (written `<!-- draft -->` and `<!-- hints -->`),
 * forgiving small slips such as "<!--hints-->" or "<!-- Hints -->".
 *  - A file whose first line is the draft marker still has placeholder text.
 *  - In a step file, the list after the hints marker is the step's hints.
 */
export const DRAFT_PATTERN = /^<!--\s*draft\s*-->/i;
export const HINTS_PATTERN = /<!--\s*hints\s*-->/i;

/**
 * An open project: the student chooses a brief, writes the brief's rule (the truth table
 * the circuit must follow – some rows given, the rest their own choice), builds the
 * circuit, and presses "Check my project" for a checklist from the grader
 * (src/sim/grader.ts): what is done, and what is not yet.
 *
 * Each brief keeps its own circuit and rule, saved together in this browser (and in
 * progress files). The step is done when every criterion of the chosen brief passes.
 */
import { useEffect, useMemo, useState } from 'react';
import { debounce } from '../app/debounce';
import { useEditor, useEditorStore } from '../editor/editorContext';
import { Editor } from '../editor/Editor';
import { Inspector } from '../editor/Inspector';
import { PredictTable } from '../editor/PredictTable';
import { createEditorStore } from '../editor/store';
import { TruthTablePanel } from '../editor/TruthTablePanel';
import { useCheck } from '../editor/useCheck';
import { INTERFACE_LOCALE } from '../i18n/locales';
import {
  allInputRows,
  grade,
  gradeRule,
  rowNumber,
  type Bit,
  type CheckRow,
  type CheckSpec,
  type CircuitDoc,
  type CriterionResult,
  type GradeSpec,
  type Prediction,
} from '../sim';
import { criterionText } from './criterionText';
import { HintLadder } from './HintLadder';
import { LessonGateReference } from './LessonGateReference';
import { Markdown } from './Markdown';
import { goNext } from './navigation';
import { isStepDone, useProgress } from './progress';
import { stepSpeech, textLang } from './stepSpeech';
import { StepNav } from './StepNav';
import { StepText } from './StepText';
import {
  loadProjectWork,
  loadStepState,
  saveProjectWork,
  saveStepState,
  workKey,
} from './stepWork';
import type { Lesson, ProjectBrief, ProjectStep } from './types';
import { useHintLadder } from './useHintLadder';
import { useTell } from './useTell';

export function ProjectStepView({
  lesson,
  step,
  index,
}: {
  lesson: Lesson;
  step: ProjectStep;
  index: number;
}) {
  const visit = useProgress((s) => s.visit);
  const [briefId, setBriefId] = useState(() => {
    const saved = loadStepState('brief', lesson.id, step.id);
    return step.briefs.some((b) => b.id === saved) ? (saved as string) : step.briefs[0].id;
  });
  const brief = step.briefs.find((b) => b.id === briefId) ?? step.briefs[0];
  useEffect(() => visit(lesson.id, step.id), [visit, lesson.id, step.id]);
  useEffect(
    () => saveStepState('brief', lesson.id, step.id, brief.id),
    [lesson.id, step.id, brief.id],
  );

  return (
    <BriefView
      key={brief.id}
      lesson={lesson}
      step={step}
      index={index}
      brief={brief}
      onChooseBrief={setBriefId}
    />
  );
}

/** The rule's cells fixed by the brief, [row][output] (null = the student's to choose). */
function givenCells(brief: ProjectBrief): Prediction[][] {
  const rows = brief.rule.kind === 'student' ? brief.rule.given : brief.rule.rows;
  const byRow = new Map(rows.map((r) => [rowNumber(r.inputs), r.outputs]));
  return allInputRows(brief.inputs.length).map((bits) => {
    const outputs = byRow.get(rowNumber(bits));
    return brief.outputs.map((_, o) => outputs?.[o] ?? null);
  });
}

/** The rule as checker rows, or null while some cells are still empty. */
function ruleRows(brief: ProjectBrief, cells: Prediction[][]): CheckRow[] | null {
  if (cells.some((row) => row.some((c) => c === null))) return null;
  return allInputRows(brief.inputs.length).map((inputs, r) => ({
    inputs,
    outputs: cells[r] as Bit[],
  }));
}

function BriefView({
  lesson,
  step,
  index,
  brief,
  onChooseBrief,
}: {
  lesson: Lesson;
  step: ProjectStep;
  index: number;
  brief: ProjectBrief;
  onChooseBrief: (id: string) => void;
}) {
  const key = workKey(lesson.id, `${step.id}--${brief.id}`);
  const given = useMemo(() => givenCells(brief), [brief]);
  const saved = useMemo(() => loadProjectWork(key, brief.starter), [key, brief.starter]);
  const [cells, setCells] = useState<Prediction[][]>(() => {
    const rule = saved?.rule;
    const fits =
      rule?.length === given.length && rule.every((row, r) => row.length === given[r].length);
    // Given cells always come from the brief, even if an old save says otherwise.
    return fits ? given.map((row, r) => row.map((c, o) => c ?? rule[r][o])) : given;
  });
  // The circuit is saved as it changes; the rule already saved with it is kept.
  const autosave = useMemo(
    () =>
      debounce(
        (doc: CircuitDoc) =>
          saveProjectWork(key, brief.starter, doc, loadProjectWork(key, brief.starter)?.rule),
        300,
      ),
    [key, brief.starter],
  );
  const store = useMemo(
    () => createEditorStore(saved?.doc ?? brief.starter, { onDocChange: autosave }),
    [saved, brief.starter, autosave],
  );
  useEffect(() => {
    window.addEventListener('pagehide', autosave.flush);
    return () => {
      autosave.flush();
      window.removeEventListener('pagehide', autosave.flush);
    };
  }, [autosave]);

  const onChangeRule = (row: number, output: number, bit: Bit) => {
    const next = cells.map((r, i) => (i === row ? r.map((c, o) => (o === output ? bit : c)) : r));
    setCells(next);
    saveProjectWork(key, brief.starter, store.getState().doc, next);
  };

  const rule = ruleRows(brief, cells);
  const gradeSpec: GradeSpec | null = rule && {
    inputs: brief.inputs,
    outputs: brief.outputs,
    rule,
    criteria: brief.criteria,
    ...(brief.constraints && { constraints: brief.constraints }),
  };
  const checkSpec: CheckSpec | undefined = rule
    ? { inputs: brief.inputs, outputs: brief.outputs, expected: rule }
    : undefined;

  return (
    <Editor
      store={store}
      palette={brief.palette}
      lead={
        <ProjectPanel
          lesson={lesson}
          step={step}
          index={index}
          brief={brief}
          onChooseBrief={onChooseBrief}
          gradeSpec={gradeSpec}
          checkSpec={checkSpec}
          emptyCells={cells.flat().filter((c) => c === null).length}
          ruleVersion={cells}
        />
      }
      side={
        <>
          <Inspector />
          <RulePanel
            brief={brief}
            cells={cells}
            given={given}
            onChange={onChangeRule}
            gradeSpec={gradeSpec}
          />
          <TruthTablePanel spec={checkSpec} />
        </>
      }
    />
  );
}

/** "Your rule": the brief's truth table, with the open rows for the student to fill in. */
function RulePanel({
  brief,
  cells,
  given,
  onChange,
  gradeSpec,
}: {
  brief: ProjectBrief;
  cells: Prediction[][];
  given: Prediction[][];
  onChange: (row: number, output: number, bit: Bit) => void;
  gradeSpec: GradeSpec | null;
}) {
  const inputs = useEditor((s) => s.inputs);
  const doc = useEditor((s) => s.doc);
  const fixed = brief.rule.kind === 'fixed';
  // The highlighted row follows the switches, when they carry the brief's labels.
  const ids = brief.inputs.map((label) => doc.components.find((c) => c.label === label)?.id);
  const currentRow = ids.every(Boolean) ? rowNumber(ids.map((id) => inputs[id!] ?? 0)) : undefined;
  const ruleChecks = gradeSpec ? gradeRule(gradeSpec) : [];
  return (
    <section className="panel" aria-labelledby="rule-title">
      <h2 id="rule-title" className="panel-title">
        {fixed ? 'The rule' : 'Your rule'}
      </h2>
      {!fixed && (
        <p className="small muted">
          The brief fills in some rows. You decide the rest: choose 0 or 1 for each.
        </p>
      )}
      <PredictTable
        id={`rule-${brief.id}`}
        caption={`The rule for ${brief.title}. Inputs: ${brief.inputs.join(', ')}. Outputs: ${brief.outputs.join(', ')}.`}
        inputs={brief.inputs}
        outputs={brief.outputs}
        rows={allInputRows(brief.inputs.length)}
        cells={cells}
        given={given}
        onChange={onChange}
        currentRow={currentRow}
      />
      {ruleChecks.length > 0 && <CriteriaList results={ruleChecks} />}
    </section>
  );
}

function CriteriaList({ results }: { results: CriterionResult[] }) {
  return (
    <ul className="criteria" data-testid="criteria">
      {results.map((r, i) => (
        <li key={i} className={r.pass ? 'criterion-done' : 'criterion-todo'}>
          <span aria-hidden>{r.pass ? '✓ ' : '✗ '}</span>
          <strong>{r.pass ? 'Done:' : 'Not yet:'}</strong> {criterionText(r)}
        </li>
      ))}
    </ul>
  );
}

/** Instructions, the brief, hints, and "Check my project". Lives inside the editor. */
function ProjectPanel({
  lesson,
  step,
  index,
  brief,
  onChooseBrief,
  gradeSpec,
  checkSpec,
  emptyCells,
  ruleVersion,
}: {
  lesson: Lesson;
  step: ProjectStep;
  index: number;
  brief: ProjectBrief;
  onChooseBrief: (id: string) => void;
  gradeSpec: GradeSpec | null;
  checkSpec: CheckSpec | undefined;
  emptyCells: number;
  ruleVersion: unknown;
}) {
  const { run } = useCheck();
  const designVersion = useEditor((s) => s.designVersion);
  const store = useEditorStore();
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const done = useProgress((s) => isStepDone(s.steps, lesson.id, step.id));
  const hints = useHintLadder(lesson, { ...brief, id: `${step.id}--${brief.id}` });
  const tell = useTell();
  const [outcome, setOutcome] = useState<{
    version: number;
    rule: unknown;
    results: CriterionResult[];
    errors: string[];
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const isLast = index === lesson.steps.length - 1;
  // Results describe one version of the circuit and rule; any change hides them.
  const shown =
    outcome && outcome.version === designVersion && outcome.rule === ruleVersion ? outcome : null;

  const onCheck = () => {
    if (!gradeSpec || !checkSpec) {
      const text = `Your rule isn't finished: ${emptyCells} ${emptyCells === 1 ? 'row still needs' : 'rows still need'} a 0 or 1 (in "Your rule").`;
      setMessage(text);
      tell('result', text, INTERFACE_LOCALE);
      return;
    }
    setMessage(null);
    run(checkSpec); // marks wrong rows and parts
    const result = grade(store.getState().doc, gradeSpec);
    setOutcome({
      version: designVersion,
      rule: ruleVersion,
      results: result.criteria,
      errors: result.check.diagnostics.filter((d) => d.severity === 'error').map((d) => d.message),
    });
    recordAttempt(lesson.id, step.id, { pass: result.pass });
    const doneCount = result.criteria.filter((c) => c.pass).length;
    const firstTodo = result.criteria.find((c) => !c.pass);
    tell(
      'result',
      result.pass
        ? 'Project complete! Every item on the checklist is done.'
        : `${doneCount} of ${result.criteria.length} done. Not yet: ${criterionText(firstTodo!)}`,
      INTERFACE_LOCALE,
    );
  };

  return (
    <div className="lesson-panel">
      <StepNav lesson={lesson} index={index} />
      <StepText
        step={step}
        tag="Project"
        speech={() => `${stepSpeech(step, 0, null)} ${brief.title}.`}
      />
      {step.briefs.length > 1 && (
        <fieldset className="brief-choice">
          <legend>Choose your project</legend>
          {step.briefs.map((b) => (
            <label key={b.id} className="brief-option">
              <input
                type="radio"
                name="brief"
                checked={b.id === brief.id}
                onChange={() => onChooseBrief(b.id)}
                data-testid={`brief-${b.id}`}
              />
              <span lang={textLang(b)}>{b.title}</span>
            </label>
          ))}
        </fieldset>
      )}
      <section className="brief" aria-labelledby="brief-title" lang={textLang(brief)}>
        <h2 id="brief-title">{brief.title}</h2>
        <Markdown source={brief.prose} draft={brief.draft} />
      </section>
      <HintLadder step={brief} shown={hints.shown} onShow={hints.show} stuck={hints.stuck} />
      <LessonGateReference lessonId={lesson.id} />
      <div className="lesson-actions">
        <button type="button" className="primary" onClick={onCheck} data-testid="check-project">
          Check my project
        </button>
      </div>
      {message && (
        <p className="predict-message" data-testid="project-message">
          {message}
        </p>
      )}
      {shown && (
        <div className="project-result" data-testid="project-result">
          <CriteriaList results={shown.results} />
          {shown.errors.length > 0 && (
            <ul className="diagnostics">
              {shown.errors.map((e, i) => (
                <li key={i} className="diag-error">
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {done && (
        <button
          type="button"
          className="primary next"
          onClick={() => goNext(lesson, index)}
          data-testid="next-step"
        >
          {isLast ? 'Finish project ✔' : 'Next step →'}
        </button>
      )}
    </div>
  );
}

/**
 * One step of a lesson: instructions on the left, the editor in the middle, the truth
 * table on the right.
 *
 *  - Explain steps show an example circuit the student can explore (flip switches) but
 *    not edit, and a Continue button.
 *  - Build steps (guided / challenge) give a starter circuit and a limited parts list.
 *    "Check" runs the checker; hints are revealed one at a time; the next step unlocks
 *    when the check passes.
 *  - Predict-first steps (liveOutputs: false) hide wire and light values until the first
 *    Check, so the student has to reason instead of flipping switches until it works.
 *
 * Work on a build step is saved in this browser, so a reload doesn't lose it.
 */
import { useEffect, useMemo, useState } from 'react';
import { debounce } from '../app/debounce';
import { lessonHref, navigate } from '../app/routes';
import { CheckResultView } from '../editor/CheckPanel';
import { useCheck } from '../editor/useCheck';
import { Editor } from '../editor/Editor';
import { useEditor } from '../editor/editorContext';
import { Inspector } from '../editor/Inspector';
import { createEditorStore } from '../editor/store';
import { TruthTablePanel } from '../editor/TruthTablePanel';
import { loadCircuit, type CircuitDoc } from '../sim';
import { readLocal, writeLocal } from '../storage/storage';
import { findLesson } from './catalog';
import { Markdown } from './Markdown';
import { isStepDone, isStepUnlocked, stepKey, useProgress } from './progress';
import { isBuildStep, type BuildStep, type ExplainStep, type Lesson } from './types';

export function LessonPage({ lessonId, step }: { lessonId: string; step: number }) {
  const lesson = findLesson(lessonId);
  const steps = useProgress((s) => s.steps);
  if (!lesson) {
    return (
      <div className="page narrow">
        <h1>Lesson not found</h1>
        <a href="#/lessons">See all lessons</a>
      </div>
    );
  }
  const index = Math.min(step, lesson.steps.length) - 1;
  if (!isStepUnlocked(steps, lesson, index)) {
    const firstOpen = lesson.steps.findIndex((s) => !isStepDone(steps, lesson.id, s.id));
    return (
      <div className="page narrow">
        <h1>Not unlocked yet</h1>
        <p>Finish the earlier steps of this lesson first.</p>
        <a className="button primary" href={lessonHref(lesson.id, firstOpen + 1)}>
          Go to step {firstOpen + 1}
        </a>
      </div>
    );
  }
  const current = lesson.steps[index];
  return isBuildStep(current) ? (
    <BuildStepView lesson={lesson} step={current} index={index} />
  ) : (
    <ExplainStepView lesson={lesson} step={current} index={index} />
  );
}

/** Lesson title and a dot for each step: done ✓, current, or locked. */
function StepNav({ lesson, index }: { lesson: Lesson; index: number }) {
  const steps = useProgress((s) => s.steps);
  return (
    <header className="lesson-header">
      <p className="lesson-kicker">
        Lesson {lesson.number}: {lesson.title}
      </p>
      <ol className="step-dots" aria-label="Steps">
        {lesson.steps.map((s, i) => {
          const done = isStepDone(steps, lesson.id, s.id);
          const open = isStepUnlocked(steps, lesson, i);
          const label = `Step ${i + 1}: ${s.title}${done ? ' (done)' : open ? '' : ' (locked)'}`;
          return (
            <li key={s.id}>
              {open ? (
                <a
                  href={lessonHref(lesson.id, i + 1)}
                  className={`step-dot ${done ? 'done' : ''} ${i === index ? 'current' : ''}`}
                  aria-label={label}
                  aria-current={i === index ? 'step' : undefined}
                  title={label}
                >
                  {done ? '✓' : i + 1}
                </a>
              ) : (
                <span className="step-dot locked" aria-label={label} title={label}>
                  {i + 1}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </header>
  );
}

function goNext(lesson: Lesson, index: number) {
  if (index + 1 < lesson.steps.length) navigate(lessonHref(lesson.id, index + 2));
  else navigate('#/lessons');
}

function ExplainStepView({
  lesson,
  step,
  index,
}: {
  lesson: Lesson;
  step: ExplainStep;
  index: number;
}) {
  const visit = useProgress((s) => s.visit);
  const complete = useProgress((s) => s.complete);
  const store = useMemo(() => (step.example ? createEditorStore(step.example) : null), [step]);
  useEffect(() => visit(lesson.id, step.id), [visit, lesson.id, step.id]);

  const panel = (
    <div className="lesson-panel">
      <StepNav lesson={lesson} index={index} />
      <h1 className="step-title">{step.title}</h1>
      <Markdown source={step.prose} />
      <button
        type="button"
        className="primary"
        onClick={() => {
          complete(lesson.id, step.id);
          goNext(lesson, index);
        }}
        data-testid="continue"
      >
        Continue →
      </button>
    </div>
  );

  if (!store) return <div className="lesson-text-only">{panel}</div>;
  return <Editor store={store} readOnly lead={panel} side={<TruthTablePanel />} />;
}

function BuildStepView({
  lesson,
  step,
  index,
}: {
  lesson: Lesson;
  step: BuildStep;
  index: number;
}) {
  const workKey = `logiclearn:work:${stepKey(lesson.id, step.id)}`;
  const visit = useProgress((s) => s.visit);
  const [checked, setChecked] = useState(false);
  // Predict-first: values stay hidden until the first Check.
  const blind = step.liveOutputs === false && !checked;
  const showTable = !blind && (step.truthTable !== 'hidden' || checked);

  const autosave = useMemo(
    () => debounce((doc: CircuitDoc) => saveWork(workKey, step.starter, doc), 300),
    [workKey, step.starter],
  );
  const store = useMemo(
    () =>
      createEditorStore(loadWork(workKey, step.starter) ?? step.starter, {
        onDocChange: autosave,
      }),
    [workKey, step.starter, autosave],
  );
  useEffect(() => visit(lesson.id, step.id), [visit, lesson.id, step.id]);
  useEffect(() => {
    window.addEventListener('pagehide', autosave.flush);
    return () => {
      autosave.flush();
      window.removeEventListener('pagehide', autosave.flush);
    };
  }, [autosave]);

  return (
    <Editor
      store={store}
      palette={step.palette}
      blind={blind}
      lead={
        <BuildPanel
          lesson={lesson}
          step={step}
          index={index}
          onChecked={() => setChecked(true)}
          onStartOver={() => {
            store.getState().loadDoc(step.starter, { keepHistory: true });
            setChecked(false);
          }}
        />
      }
      side={
        <>
          <Inspector />
          {showTable ? (
            <TruthTablePanel spec={step.spec} />
          ) : (
            <section className="panel">
              <h2 className="panel-title">Truth table</h2>
              <p className="muted">
                Hidden for this challenge – predict each row, then press Check.
              </p>
            </section>
          )}
        </>
      }
    />
  );
}

/**
 * Saved work is stored with a fingerprint of the step's starter parts. If the lesson is
 * updated later (its locked parts change), old work no longer fits the task and is
 * ignored, so the student starts from the new starter instead of getting stuck.
 */
function starterFingerprint(starter: CircuitDoc): string {
  return starter.components
    .filter((c) => c.locked)
    .map((c) => `${c.id}:${c.type}:${c.label ?? ''}`)
    .join('|');
}

function saveWork(key: string, starter: CircuitDoc, doc: CircuitDoc): void {
  writeLocal(key, JSON.stringify({ starter: starterFingerprint(starter), doc }));
}

function loadWork(key: string, starter: CircuitDoc): CircuitDoc | null {
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

/** Instructions, hints and the Check button for a build step. Lives inside the editor. */
function BuildPanel({
  lesson,
  step,
  index,
  onChecked,
  onStartOver,
}: {
  lesson: Lesson;
  step: BuildStep;
  index: number;
  onChecked: () => void;
  onStartOver: () => void;
}) {
  const { result, run } = useCheck();
  const triedRows = useEditor((s) => s.triedRows);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const recordHint = useProgress((s) => s.recordHint);
  const done = useProgress((s) => isStepDone(s.steps, lesson.id, step.id));
  const [hintsShown, setHintsShown] = useState(0);
  const isLast = index === lesson.steps.length - 1;

  const onCheck = () => {
    const r = run(step.spec);
    recordAttempt(lesson.id, step.id, r.pass, triedRows);
    onChecked();
  };

  return (
    <div className="lesson-panel">
      <StepNav lesson={lesson} index={index} />
      <h1 className="step-title">
        {step.title}
        {step.kind === 'challenge' && <span className="tag">Challenge</span>}
      </h1>
      <Markdown source={step.prose} />

      {step.hints.length > 0 && (
        <div className="hints">
          {step.hints.slice(0, hintsShown).map((hint, i) => (
            <p key={i} className="hint">
              💡 {hint}
            </p>
          ))}
          {hintsShown < step.hints.length && (
            <button
              type="button"
              onClick={() => {
                setHintsShown(hintsShown + 1);
                recordHint(lesson.id, step.id);
              }}
              data-testid="hint-button"
            >
              Show a hint ({hintsShown + 1} of {step.hints.length})
            </button>
          )}
        </div>
      )}

      <div className="lesson-actions">
        <button type="button" className="primary" onClick={onCheck} data-testid="check-button">
          Check
        </button>
        <button
          type="button"
          onClick={onStartOver}
          title="Go back to the starting circuit (you can undo this)"
        >
          Start over
        </button>
      </div>
      {result && <CheckResultView result={result} />}
      {done && (
        <button
          type="button"
          className="primary next"
          onClick={() => goNext(lesson, index)}
          data-testid="next-step"
        >
          {isLast ? 'Finish lesson ✔' : 'Next step →'}
        </button>
      )}
    </div>
  );
}

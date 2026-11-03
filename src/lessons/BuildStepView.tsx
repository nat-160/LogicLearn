/**
 * A build step (guided or challenge): a starter circuit and a limited parts list.
 * "Check" runs the checker; hints are revealed one at a time; the next step unlocks when
 * the check passes.
 *
 * Predict-first steps (liveOutputs: false) hide wire and light values until the first
 * Check, so the student has to reason instead of flipping switches until it works.
 *
 * Work is saved in this browser (stepWork.ts), so a reload doesn't lose it.
 */
import { useEffect, useMemo, useState } from 'react';
import { debounce } from '../app/debounce';
import { CheckResultView } from '../editor/CheckPanel';
import { summarizeCheck } from '../editor/checkSummary';
import { useCheck } from '../editor/useCheck';
import { Editor } from '../editor/Editor';
import { useEditor } from '../editor/editorContext';
import { Inspector } from '../editor/Inspector';
import { createEditorStore } from '../editor/store';
import { TruthTablePanel } from '../editor/TruthTablePanel';
import { INTERFACE_LOCALE } from '../i18n/locales';
import type { CircuitDoc } from '../sim';
import { HintLadder } from './HintLadder';
import { LessonGateReference } from './LessonGateReference';
import { goNext } from './navigation';
import { isStepDone, useProgress } from './progress';
import { stepSpeech } from './stepSpeech';
import { StepNav } from './StepNav';
import { StepText } from './StepText';
import { loadWork, saveWork, workKey } from './stepWork';
import type { BuildStep, Lesson } from './types';
import { useHintLadder } from './useHintLadder';
import { useTell } from './useTell';

export function BuildStepView({
  lesson,
  step,
  index,
}: {
  lesson: Lesson;
  step: BuildStep;
  index: number;
}) {
  const key = workKey(lesson.id, step.id);
  const visit = useProgress((s) => s.visit);
  const done = useProgress((s) => isStepDone(s.steps, lesson.id, step.id));
  const [checked, setChecked] = useState(false);
  // Predict-first: values stay hidden until the first Check (or for good once the step
  // is done, e.g. when coming back to it after a reload).
  const blind = step.liveOutputs === false && !checked && !done;
  const showTable = !blind && (step.truthTable !== 'hidden' || checked);

  const autosave = useMemo(
    () => debounce((doc: CircuitDoc) => saveWork(key, step.starter, doc), 300),
    [key, step.starter],
  );
  const store = useMemo(
    () =>
      createEditorStore(loadWork(key, step.starter) ?? step.starter, {
        onDocChange: autosave,
      }),
    [key, step.starter, autosave],
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
  const done = useProgress((s) => isStepDone(s.steps, lesson.id, step.id));
  const hints = useHintLadder(lesson, step);
  const isLast = index === lesson.steps.length - 1;
  const tell = useTell();

  const onCheck = () => {
    const r = run(step.spec);
    recordAttempt(lesson.id, step.id, { pass: r.pass, triedRows });
    onChecked();
    tell('result', summarizeCheck(r), INTERFACE_LOCALE);
  };

  return (
    <div className="lesson-panel">
      <StepNav lesson={lesson} index={index} />
      <StepText
        step={step}
        tag={step.kind === 'challenge' ? 'Challenge' : undefined}
        speech={() => stepSpeech(step, hints.shown, result)}
      />

      <HintLadder step={step} shown={hints.shown} onShow={hints.show} stuck={hints.stuck} />
      <LessonGateReference lessonId={lesson.id} />

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

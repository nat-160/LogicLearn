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
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { inlineMarkdownToSpeech } from '../narration/plainText';
import type { CircuitDoc } from '../sim';
import { HintLadder } from './HintLadder';
import { LessonGateReference } from './LessonGateReference';
import { goNext } from './navigation';
import { isStepDone, stepKey, useProgress } from './progress';
import { stuckText } from './sharedMessages';
import { stepSpeech } from './stepSpeech';
import { StepNav } from './StepNav';
import { StepText } from './StepText';
import { loadWork, saveWork, workKey } from './stepWork';
import type { BuildStep, Lesson } from './types';
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
  const revealHint = useProgress((s) => s.revealHint);
  const done = useProgress((s) => isStepDone(s.steps, lesson.id, step.id));
  const attempts = useProgress((s) => s.steps[stepKey(lesson.id, step.id)]?.attempts ?? 0);
  // Hints revealed before (saved with the step's progress) stay revealed.
  const [hintsShown, setHintsShown] = useState(() =>
    Math.min(
      useProgress.getState().steps[stepKey(lesson.id, step.id)]?.hintsUsed ?? 0,
      step.hints.length,
    ),
  );
  const isLast = index === lesson.steps.length - 1;
  const tell = useTell();

  // After two failed checks without a hint, point to the hints (announced once).
  const stuck = !done && attempts >= 2 && hintsShown === 0 && step.hints.length > 0;
  const wasStuck = useRef(stuck);
  useEffect(() => {
    if (stuck && !wasStuck.current) tell('stuck', stuckText(step.locale), step.locale);
    wasStuck.current = stuck;
  }, [stuck, step.locale, tell]);

  const onCheck = () => {
    const r = run(step.spec);
    recordAttempt(lesson.id, step.id, r.pass, triedRows);
    onChecked();
    tell('result', summarizeCheck(r), INTERFACE_LOCALE);
  };

  const showHint = () => {
    const next = hintsShown + 1;
    setHintsShown(next);
    revealHint(lesson.id, step.id, next);
    tell('hint', `Hint ${next}: ${inlineMarkdownToSpeech(step.hints[next - 1])}`, step.locale);
  };

  return (
    <div className="lesson-panel">
      <StepNav lesson={lesson} index={index} />
      <StepText
        step={step}
        tag={step.kind === 'challenge' ? 'Challenge' : undefined}
        speech={() => stepSpeech(step, hintsShown, result)}
      />

      <HintLadder step={step} shown={hintsShown} onShow={showHint} stuck={stuck} />
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

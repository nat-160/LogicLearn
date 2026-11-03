/**
 * An explain step: text, and usually an example circuit the student can explore (flip
 * switches) but not edit, then a Continue button.
 */
import { useEffect, useMemo } from 'react';
import { Editor } from '../editor/Editor';
import { createEditorStore } from '../editor/store';
import { TruthTablePanel } from '../editor/TruthTablePanel';
import { goNext } from './navigation';
import { useProgress } from './progress';
import { stepSpeech } from './stepSpeech';
import { StepNav } from './StepNav';
import { StepText } from './StepText';
import type { ExplainStep, Lesson } from './types';

export function ExplainStepView({
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
      <StepText step={step} speech={() => stepSpeech(step, 0, null)} />
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

/**
 * One step of a lesson: instructions on the left, the editor in the middle, the truth
 * table on the right. This file picks the view for the step in the address; each kind of
 * step has its own file:
 *
 *  - ExplainStepView: text and an example circuit to explore, then Continue.
 *  - BuildStepView:   build a circuit, Check it, hints one at a time.
 *
 * Accessibility: every step has a "Read aloud" button (and can be read automatically,
 * see Settings); check results and revealed hints are announced to screen readers; and
 * the page heading receives focus when the step changes (App.tsx).
 */
import { lessonHref } from '../app/routes';
import { useLocale } from '../settings/display';
import { BuildStepView } from './BuildStepView';
import { getLessons } from './catalog';
import { ExplainStepView } from './ExplainStepView';
import { isLessonUnlocked, nextStepFor, prerequisite, useUnlockAll } from './gating';
import { isStepDone, isStepUnlocked, useProgress } from './progress';
import { isBuildStep } from './types';

export function LessonPage({ lessonId, step }: { lessonId: string; step: number }) {
  const lessons = getLessons(useLocale());
  const lessonIndex = lessons.findIndex((l) => l.id === lessonId);
  const lesson = lessons[lessonIndex];
  const steps = useProgress((s) => s.steps);
  const unlockAll = useUnlockAll((s) => s.unlockAll);
  if (!lesson) {
    return (
      <div className="page narrow">
        <h1>Lesson not found</h1>
        <a href="#/lessons">See all lessons</a>
      </div>
    );
  }
  if (!isLessonUnlocked(steps, lessons, lessonIndex, unlockAll)) {
    // Lessons open in order (gating.ts). Point to the lesson to do first.
    const before = prerequisite(lessons, lessonIndex);
    const next = nextStepFor(steps, lessons, unlockAll);
    return (
      <div className="page narrow">
        <h1>Not unlocked yet</h1>
        <p>
          {before
            ? `Lesson ${lesson.number} opens when you finish Lesson ${before.number}: ${before.title}.`
            : 'This lesson opens when you finish the lessons before it.'}
        </p>
        {next && (
          <a className="button primary" href={lessonHref(next.lesson.id, next.index + 1)}>
            Go to Lesson {next.lesson.number}
          </a>
        )}
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

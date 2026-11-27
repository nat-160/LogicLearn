/**
 * The pieces that differ between a numbered lesson step and a practice step:
 *  - the header (step dots, or "Practice" with a link back);
 *  - the button at the end ("Next step", or "Back to the step");
 *  - the offer of a practice step after a failed check.
 */
import { lessonHref, practiceHref } from '../app/routes';
import { lessonName } from './gating';
import { goNext } from './navigation';
import { StepNav } from './StepNav';
import type { Lesson, Practice } from './types';

/** Set when a build or predict step is shown as practice: the step to return to. */
export interface PracticePlace {
  returnIndex: number;
}

export function StepHeader({
  lesson,
  index,
  practice,
}: {
  lesson: Lesson;
  index: number;
  practice?: PracticePlace;
}) {
  if (!practice) return <StepNav lesson={lesson} index={index} />;
  const back = lesson.steps[practice.returnIndex];
  return (
    <header className="lesson-header">
      <p className="lesson-kicker">
        {lessonName(lesson)}: {lesson.title} – practice
      </p>
      <a href={lessonHref(lesson.id, practice.returnIndex + 1)} data-testid="practice-back">
        ← Back to step {practice.returnIndex + 1}: {back?.title}
      </a>
    </header>
  );
}

export function NextStepButton({
  lesson,
  index,
  practice,
}: {
  lesson: Lesson;
  index: number;
  practice?: PracticePlace;
}) {
  if (practice) {
    return (
      <a
        className="button primary next"
        href={lessonHref(lesson.id, practice.returnIndex + 1)}
        data-testid="next-step"
      >
        Back to step {practice.returnIndex + 1} →
      </a>
    );
  }
  const isLast = index === lesson.steps.length - 1;
  return (
    <button
      type="button"
      className="primary next"
      onClick={() => goNext(lesson, index)}
      data-testid="next-step"
    >
      {isLast ? 'Finish lesson ✔' : 'Next step →'}
    </button>
  );
}

/** "Practice this idea first" – a link, never required. */
export function PracticeOffer({ lesson, practice }: { lesson: Lesson; practice: Practice }) {
  return (
    <p className="practice-offer" data-testid="practice-offer">
      Want a short practice on this first?{' '}
      <a href={practiceHref(lesson.id, practice.practiceId)}>Practice: {practice.title}</a>
    </p>
  );
}

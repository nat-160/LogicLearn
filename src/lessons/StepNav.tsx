/** Lesson title and a dot for each step: done ✓, current, or locked. */
import { lessonHref } from '../app/routes';
import { lessonName, useUnlockAll } from './gating';
import { isStepDone, isStepUnlocked, useProgress } from './progress';
import type { Lesson } from './types';

export function StepNav({ lesson, index }: { lesson: Lesson; index: number }) {
  const steps = useProgress((s) => s.steps);
  const unlockAll = useUnlockAll((s) => s.unlockAll);
  return (
    <header className="lesson-header">
      <p className="lesson-kicker">
        {lessonName(lesson)}: {lesson.title}
      </p>
      <ol className="step-dots" aria-label="Steps">
        {lesson.steps.map((s, i) => {
          const done = isStepDone(steps, lesson.id, s.id);
          const open = isStepUnlocked(steps, lesson, i, unlockAll);
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
                // A plain <span> can't have an aria-label, so the full text is hidden text.
                <span className="step-dot locked" title={label}>
                  <span aria-hidden>{i + 1}</span>
                  <span className="sr-only">{label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </header>
  );
}

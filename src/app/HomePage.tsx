/**
 * The home page. Its main button starts the first lesson, or continues where the student
 * left off (gating.ts nextStepFor).
 */
import { getLessons } from '../lessons/catalog';
import { isLessonComplete, lessonName, nextStepFor, useUnlockAll } from '../lessons/gating';
import { useProgress } from '../lessons/progress';
import { useLocale } from '../settings/display';
import { lessonHref } from './routes';

export function HomePage() {
  const steps = useProgress((s) => s.steps);
  const unlockAll = useUnlockAll((s) => s.unlockAll);
  const lessons = getLessons(useLocale());
  const next = nextStepFor(steps, lessons, unlockAll);
  const started = Object.values(steps).some((s) => s.done);
  const tour = lessons.find((l) => l.optional);

  return (
    <div className="page home">
      <section className="hero">
        <h1>Build the logic inside computers.</h1>
        <p className="lead">
          Drag gates onto the canvas, wire them up, and flip switches to see your circuit think.
          Lessons guide you step by step, and check your work as you go.
        </p>
        <div className="hero-actions">
          {next ? (
            <a
              className="button primary"
              href={lessonHref(next.lesson.id, next.index + 1)}
              data-testid="continue-lesson"
            >
              {started
                ? `Continue: ${lessonName(next.lesson)} – ${next.lesson.steps[next.index].title}`
                : `Start ${lessonName(next.lesson)}: ${next.lesson.title}`}
            </a>
          ) : (
            <a className="button primary" href="#/lessons" data-testid="continue-lesson">
              Review the lessons
            </a>
          )}
          <a className="button" href="#/sandbox">
            Open the sandbox
          </a>
        </div>
        {tour && !isLessonComplete(steps, tour) && (
          <p>
            New here? <a href={lessonHref(tour.id)}>Take the editor tour</a>
          </p>
        )}
        <p className="muted small">
          Works in any modern browser. No account needed – your work stays on this device.
        </p>
      </section>
    </div>
  );
}

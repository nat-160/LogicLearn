/**
 * The celebration when a lesson (or a unit project) is finished: a badge, what the
 * student can now do, and where to go next.
 *
 * It celebrates what was learned rather than handing out points or streaks (rewards for
 * their own sake can crowd out interest in the subject). The burst of dots plays only
 * when the device allows motion, and never flashes. The chime plays only when the
 * student turned on "Sound effects" in the Accessibility settings. Focus moves to the
 * heading, so screen readers announce "Lesson 3 complete!".
 */
import { useEffect, useRef } from 'react';
import { lessonHref } from '../app/routes';
import { playChime } from '../app/sounds';
import { usePreferences } from '../settings/preferences';
import { isLessonComplete, lessonName, nextStepFor, useUnlockAll, useUnlocked } from './gating';
import { useProgress } from './progress';
import type { Lesson } from './types';

export function CompletePage({ lesson, lessons }: { lesson: Lesson; lessons: readonly Lesson[] }) {
  const steps = useProgress((s) => s.steps);
  const unlockAll = useUnlockAll((s) => s.unlockAll);
  const unlocked = useUnlocked((s) => s.unlocked);
  const sounds = usePreferences((s) => s.sounds);
  const complete = isLessonComplete(steps, lesson);
  const name = lessonName(lesson);

  // One chime when the page opens (not again if the setting is changed here).
  const chimed = useRef(false);
  useEffect(() => {
    if (complete && sounds && !chimed.current) {
      chimed.current = true;
      playChime();
    }
  }, [complete, sounds]);

  if (!complete) {
    return (
      <div className="page narrow">
        <h1>Not finished yet</h1>
        <p>Finish every step of {name} to see this page.</p>
        <a className="button primary" href={lessonHref(lesson.id)}>
          Go to {name}
        </a>
      </div>
    );
  }

  const next = nextStepFor(steps, lessons, unlockAll, unlocked);
  const unitLessons = lessons.filter(
    (l) => l.unit === lesson.unit && (l.kind ?? 'lesson') === 'lesson' && !l.optional,
  );
  const unitDone =
    unitLessons.at(-1)?.id === lesson.id && unitLessons.every((l) => isLessonComplete(steps, l));
  const project = lessons.find((l) => l.kind === 'project' && l.unit === lesson.unit);
  const gates = lesson.introduces ?? [];

  return (
    <div className="page narrow celebration" data-testid="celebration">
      <div className="celebration-art">
        <span className="burst" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={`burst-dot dot-${i}`} />
          ))}
        </span>
        <Badge
          label={`Badge: ${name} complete`}
          mark={lesson.kind === 'project' ? '★' : String(lesson.number)}
        />
      </div>
      <h1>{name} complete!</h1>
      <p className="celebration-title">{lesson.title}</p>
      {gates.length > 0 && (
        <p>
          You can now build with {gates.length === 1 ? 'the ' : ''}
          <strong>{gates.join(' and ')}</strong> {gates.length === 1 ? 'gate' : 'gates'}.
        </p>
      )}
      {lesson.summary && <p className="muted">{lesson.summary}</p>}
      {lesson.kind === 'test-out' && (
        <p className="unit-complete" data-testid="unit-complete">
          <strong>You tested out of Unit {lesson.unit}.</strong> Its lessons count as done, so you
          can go straight on – and its project is open.
        </p>
      )}
      {unitDone && (
        <p className="unit-complete" data-testid="unit-complete">
          <strong>Unit {lesson.unit} complete!</strong>
          {project && ` The ${lessonName(project)} is open: design a circuit of your own.`}
        </p>
      )}
      <div className="button-row">
        {next && (
          <a
            className="button primary"
            href={lessonHref(next.lesson.id, next.index + 1)}
            data-testid="celebration-next"
          >
            Next: {lessonName(next.lesson)} – {next.lesson.title}
          </a>
        )}
        <a className="button" href="#/lessons">
          Back to lessons
        </a>
      </div>
      <p className="small muted">
        Your progress is saved in this browser. Now and then, save it to a file from the Lessons
        page, so it can&apos;t be lost.
      </p>
    </div>
  );
}

/** A round badge with the lesson's number (or a star for a project), drawn from theme colors. */
function Badge({ label, mark }: { label: string; mark: string }) {
  return (
    <svg
      className="badge"
      viewBox="0 0 120 140"
      width={120}
      height={140}
      role="img"
      aria-label={label}
    >
      <path className="badge-ribbon" d="M38 96 L28 136 L46 126 L56 138 L60 104 Z" />
      <path className="badge-ribbon" d="M82 96 L92 136 L74 126 L64 138 L60 104 Z" />
      <circle className="badge-ring" cx={60} cy={58} r={50} />
      <circle className="badge-inner" cx={60} cy={58} r={38} />
      <text className="badge-mark" x={60} y={58} textAnchor="middle" dominantBaseline="central">
        {mark}
      </text>
    </svg>
  );
}

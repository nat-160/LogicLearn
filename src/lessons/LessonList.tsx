/**
 * The lesson list, grouped by unit. Lessons open in order (gating.ts): a locked lesson
 * says which lesson to finish first. Lessons that aren't built yet show "Coming soon".
 */
import { lessonHref } from '../app/routes';
import { IS_TEST_VERSION } from '../app/site';
import { useLocale } from '../settings/display';
import { getLessons, PLANNED_LESSONS, UNITS, unitText } from './catalog';
import { isLessonUnlocked, lessonName, prerequisite, useUnlockAll } from './gating';
import { lessonProgress, useProgress } from './progress';
import { ProgressActions } from './ProgressActions';
import type { Lesson } from './types';

type Entry =
  | { kind: 'built'; number: number; lesson: Lesson; index: number }
  | { kind: 'planned'; number: number; title: string };

export function LessonList() {
  const steps = useProgress((s) => s.steps);
  const unlockAll = useUnlockAll((s) => s.unlockAll);
  const locale = useLocale();
  const lessons = getLessons(locale);

  return (
    <div className="page">
      <h1>Lessons</h1>
      <ProgressActions />
      {IS_TEST_VERSION && <UnlockAllSwitch />}
      {UNITS.map((unit) => {
        const { title, summary } = unitText(unit, locale);
        const entries: Entry[] = [
          ...lessons
            .map((lesson, index) => ({
              kind: 'built' as const,
              number: lesson.number,
              lesson,
              index,
            }))
            .filter((e) => e.lesson.unit === unit),
          ...PLANNED_LESSONS.filter((p) => p.unit === unit).map((p) => ({
            kind: 'planned' as const,
            number: p.number,
            title: p.title,
          })),
        ].sort((a, b) => a.number - b.number);
        return (
          <section key={unit} className="unit" aria-labelledby={`unit-${unit}-title`}>
            <h2 id={`unit-${unit}-title`}>{title}</h2>
            {summary && <p className="muted">{summary}</p>}
            <ol className="lesson-list">
              {entries.map((entry) => {
                if (entry.kind === 'planned') {
                  return (
                    <li key={`planned-${entry.number}`} className="lesson-card is-planned">
                      <span className="lesson-number">{entry.number}</span>
                      <span className="lesson-text">
                        <strong>{entry.title}</strong>
                        <span className="muted">Coming soon</span>
                      </span>
                    </li>
                  );
                }
                const { lesson, index } = entry;
                if (!isLessonUnlocked(steps, lessons, index, unlockAll)) {
                  const before = prerequisite(lessons, index);
                  return (
                    <li key={lesson.id} className="lesson-card is-locked">
                      <LessonNumber lesson={lesson} />
                      <span className="lesson-text">
                        <LessonKind lesson={lesson} />
                        <strong>{lesson.title}</strong>
                        <span className="muted">{lesson.summary}</span>
                      </span>
                      <span className="lesson-progress">
                        <span aria-hidden>🔒 </span>
                        {before ? `Finish ${lessonName(before)} first` : 'Locked'}
                      </span>
                    </li>
                  );
                }
                const { done, total } = lessonProgress(steps, lesson);
                return (
                  <li key={lesson.id} className="lesson-card">
                    <a href={lessonHref(lesson.id)}>
                      <LessonNumber lesson={lesson} />
                      <span className="lesson-text">
                        <LessonKind lesson={lesson} />
                        <strong>{lesson.title}</strong>
                        <span className="muted">{lesson.summary}</span>
                      </span>
                      <span className="lesson-progress">
                        {done === total ? (
                          <>
                            <span aria-hidden>✔ </span>Done
                          </>
                        ) : (
                          `${done} of ${total} steps`
                        )}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

/** Test version only: open every lesson, so testers can jump anywhere. */
function UnlockAllSwitch() {
  const unlockAll = useUnlockAll((s) => s.unlockAll);
  const setUnlockAll = useUnlockAll((s) => s.setUnlockAll);
  return (
    <label className="unlock-all">
      <input
        type="checkbox"
        checked={unlockAll}
        onChange={(e) => setUnlockAll(e.target.checked)}
        data-testid="unlock-all"
      />{' '}
      Unlock all lessons (test version only)
    </label>
  );
}

/** A lesson's number badge; a unit project gets a star instead. */
function LessonNumber({ lesson }: { lesson: Lesson }) {
  if (lesson.kind === 'project') {
    return (
      <span className="lesson-number" aria-hidden>
        ★
      </span>
    );
  }
  return <span className="lesson-number">{lesson.number}</span>;
}

/** "Unit 1 project" above a project's title (lessons need no tag: their number says it). */
function LessonKind({ lesson }: { lesson: Lesson }) {
  if (lesson.kind !== 'project') return null;
  return <span className="lesson-kind">{lessonName(lesson)}</span>;
}

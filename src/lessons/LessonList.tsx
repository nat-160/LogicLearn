import { lessonHref } from '../app/routes';
import { useLocale } from '../settings/display';
import { getLessons, PLANNED_LESSONS } from './catalog';
import { lessonProgress, useProgress } from './progress';
import type { Lesson } from './types';

export function LessonList() {
  const steps = useProgress((s) => s.steps);
  const lessons = getLessons(useLocale());
  type Entry = { number: number; lesson?: Lesson; title: string };
  const entries: Entry[] = [
    ...lessons.map((lesson) => ({ number: lesson.number, lesson, title: lesson.title })),
    ...PLANNED_LESSONS.map((planned) => ({ number: planned.number, title: planned.title })),
  ].sort((a, b) => a.number - b.number);

  return (
    <div className="page">
      <h1>Lessons</h1>
      <ol className="lesson-list">
        {entries.map((entry) => {
          if (entry.lesson) {
            const { lesson } = entry;
            const { done, total } = lessonProgress(steps, lesson);
            return (
              <li key={lesson.id} className="lesson-card">
                <a href={lessonHref(lesson.id)}>
                  <span className="lesson-number">{lesson.number}</span>
                  <span className="lesson-text">
                    <strong>{lesson.title}</strong>
                    <span className="muted">{lesson.summary}</span>
                  </span>
                  <span className="lesson-progress" aria-label={`${done} of ${total} steps done`}>
                    {done === total ? '✔ Done' : `${done}/${total}`}
                  </span>
                </a>
              </li>
            );
          }
          return (
            <li key={`planned-${entry.number}`} className="lesson-card is-planned">
              <span className="lesson-number">{entry.number}</span>
              <span className="lesson-text">
                <strong>{entry.title}</strong>
                <span className="muted">Coming soon</span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

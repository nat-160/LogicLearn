/**
 * "My progress report": a printable page a student can hand to a teacher – which lessons,
 * projects and test-outs are done, with a completion code the teacher can check in the
 * teacher view (codes.ts). The name field is only for printing: it is never saved.
 */
import { useEffect, useState } from 'react';
import { useLocale } from '../settings/display';
import { getLessons } from './catalog';
import { canUseCodes, completionCode, dayNumber, NO_CODES_MESSAGE } from './codes';
import { isLessonComplete, isUnitTestedOut, lessonName } from './gating';
import { isStepDone, lessonProgress, stepKey, useProgress, type ProgressMap } from './progress';
import type { Lesson } from './types';

/** A lesson's status in words. */
function status(steps: ProgressMap, lessons: readonly Lesson[], lesson: Lesson): string {
  // Finished means the last step is done, as everywhere else (gating.ts).
  if (isLessonComplete(steps, lesson)) return 'Done';
  const { done, total } = lessonProgress(steps, lesson);
  const required = (lesson.kind ?? 'lesson') === 'lesson' && !lesson.optional;
  if (required && isUnitTestedOut(steps, lessons, lesson.unit)) {
    return 'Tested out';
  }
  return done === 0 ? 'Not started' : `${done} of ${total} steps`;
}

/** The latest activity on any of the lesson's steps, as a date ("" if none). */
function lastActivity(steps: ProgressMap, lesson: Lesson): string {
  const times = lesson.steps
    .map((s) => steps[stepKey(lesson.id, s.id)]?.lastSeen ?? '')
    .filter(Boolean)
    .sort();
  const latest = times.at(-1);
  return latest ? new Date(latest).toLocaleDateString() : '';
}

export function ReportPage() {
  const steps = useProgress((s) => s.steps);
  const lessons = getLessons(useLocale());
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const today = new Date();
  const practiceDone = lessons
    .flatMap((l) => l.practice.map((p) => isStepDone(steps, l.id, p.id)))
    .filter(Boolean).length;

  useEffect(() => {
    if (!canUseCodes()) return;
    const finished = lessons.flatMap((l, i) => (isLessonComplete(steps, l) ? [i] : []));
    let current = true;
    void completionCode({ finished, day: dayNumber(new Date()) }).then((c) => {
      if (current) setCode(c);
    });
    return () => {
      current = false;
    };
  }, [steps, lessons]);

  return (
    <div className="page report">
      <h1>My progress report</h1>
      <p className="no-print">
        Print this page (or save it as a PDF) to show your teacher what you have finished.
      </p>
      <label className="field report-name">
        <span>Your name (for printing only – it isn&apos;t saved)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
      </label>
      {name && <p className="print-only">{name}</p>}
      <p>Date: {today.toLocaleDateString()}</p>
      <table className="report-table" data-testid="report-table">
        <caption className="sr-only">Lessons, projects and test-outs, with their status</caption>
        <thead>
          <tr>
            <th scope="col">Lesson</th>
            <th scope="col">Status</th>
            <th scope="col">Last activity</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((lesson) => (
            <tr key={lesson.id}>
              <th scope="row">
                {lessonName(lesson)}: {lesson.title}
              </th>
              <td>{status(steps, lessons, lesson)}</td>
              <td>{lastActivity(steps, lesson)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>Practice steps finished: {practiceDone}</p>
      <p className="completion-code">
        Completion code:{' '}
        <strong data-testid="completion-code">
          {canUseCodes() ? code || '…' : NO_CODES_MESSAGE}
        </strong>
      </p>
      <p className="small muted">
        Your teacher can check this code in the teacher view. It shows which lessons are finished
        and when the code was made – not your work, and nothing about you.
      </p>
      <button type="button" className="primary no-print" onClick={() => window.print()}>
        Print or save as PDF
      </button>
    </div>
  );
}

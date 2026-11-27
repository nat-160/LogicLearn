/** Moving between lesson steps. */
import { lessonHref, lessonViewHref, navigate } from '../app/routes';
import type { Lesson } from './types';

/** Go to the step after `index`, or to the celebration after the last one. */
export function goNext(lesson: Lesson, index: number): void {
  if (index + 1 < lesson.steps.length) navigate(lessonHref(lesson.id, index + 2));
  else navigate(lessonViewHref(lesson.id, 'complete'));
}

/** Moving between lesson steps. */
import { lessonHref, navigate } from '../app/routes';
import type { Lesson } from './types';

/** Go to the step after `index`, or back to the lesson list after the last one. */
export function goNext(lesson: Lesson, index: number): void {
  if (index + 1 < lesson.steps.length) navigate(lessonHref(lesson.id, index + 2));
  else navigate('#/lessons');
}

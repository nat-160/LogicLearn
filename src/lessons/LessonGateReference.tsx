/** The gate reminder card for a lesson: the gates taught up to and including this one. */
import { useLocale } from '../settings/display';
import { getLessons, introducedGates } from './catalog';
import { GateReference } from './GateReference';

export function LessonGateReference({ lessonId }: { lessonId: string }) {
  const lessons = getLessons(useLocale());
  const index = lessons.findIndex((l) => l.id === lessonId);
  return <GateReference gates={index < 0 ? [] : introducedGates(lessons, index)} />;
}

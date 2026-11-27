/**
 * The Unit 1 test-out: an optional quiz for students who already know gates and truth
 * tables. Passing it counts Unit 1's lessons as done (gating.ts), so the student can go
 * straight on to Unit 2 and the Unit 1 project.
 *
 * It reuses the unit's challenges under new step ids, so a test-out never marks the
 * lessons' own steps as done. No hints, practice or walkthroughs: it's a test.
 */
import type { LessonDef } from '../../types';
import { reuseStep } from '../helpers';
import { circuitToTableLesson } from '../circuit-to-table';
import { notAndLesson } from '../not-and';
import { orXorLesson } from '../or-xor';

export const testOut1Lesson: LessonDef = {
  id: 'test-out-1',
  number: 0.5, // before Lesson 1 in the list; shown as "Unit 1 test-out"
  unit: 1,
  kind: 'test-out',
  standards: ['IB A1.2.3', 'IB A1.2.4', 'IB A1.2.5'],
  steps: [
    reuseStep(notAndLesson, 'challenge', 'and-not'),
    reuseStep(orXorLesson, 'exactly-one', 'exactly-one'),
    reuseStep(circuitToTableLesson, 'challenge', 'predict-table'),
  ],
};

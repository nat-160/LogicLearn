/**
 * The Unit 2 test-out: an optional quiz that lets a student skip Unit 2's lessons. It
 * opens after Unit 1. Like the Unit 1 test-out, it reuses the unit's challenges under
 * new step ids, with no hints.
 */
import type { LessonDef } from '../../types';
import { reuseStep } from '../helpers';
import { nandNorLesson } from '../nand-nor';
import { tableToCircuitLesson } from '../table-to-circuit';
import { xnorIfThenLesson } from '../xnor-if-then';

export const testOut2Lesson: LessonDef = {
  id: 'test-out-2',
  number: 4.9, // first in Unit 2's list; shown as "Unit 2 test-out"
  unit: 2,
  kind: 'test-out',
  standards: ['IB A1.2.3', 'IB A1.2.4', 'IB A1.2.5'],
  steps: [
    reuseStep(nandNorLesson, 'neither', 'neither'),
    reuseStep(xnorIfThenLesson, 'three-rules', 'three-rules'),
    reuseStep(tableToCircuitLesson, 'any-table', 'any-table'),
  ],
};

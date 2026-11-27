import { isLessonDone, isLessonUnlocked, lessonName, nextStepFor, prerequisite } from './gating';
import type { ProgressMap, StepProgress } from './progress';
import type { Lesson } from './types';

const lesson = (id: string, unit: number, extra: Partial<Lesson> = {}): Lesson => ({
  id,
  number: 0,
  unit,
  standards: [],
  practice: [],
  title: id,
  summary: '',
  locale: 'en-US',
  steps: ['a', 'b', 'c'].map((s) => ({
    id: s,
    kind: 'explain',
    title: s,
    prose: '',
    hints: [],
    draft: false,
    locale: 'en-US',
  })),
  ...extra,
});

const tour = lesson('tour', 1, { optional: true });
const one = lesson('one', 1);
const two = lesson('two', 1);
const project = lesson('project-1', 1, { kind: 'project' });
const three = lesson('three', 2);
const lessons = [tour, one, two, project, three];

const done: StepProgress = {
  done: true,
  attempts: 1,
  hintsUsed: 0,
  triedRows: [],
  firstSeen: '',
  lastSeen: '',
};
const progress = (...keys: string[]): ProgressMap => Object.fromEntries(keys.map((k) => [k, done]));
const open = (steps: ProgressMap) =>
  lessons.map((l, i) => (isLessonUnlocked(steps, lessons, i) ? l.id : '-'));

describe('lesson gating', () => {
  it('opens the tour and the first lesson in a fresh browser', () => {
    expect(open({})).toEqual(['tour', 'one', '-', '-', '-']);
  });

  it('opens the next lesson once the previous one is complete (its last step done)', () => {
    expect(open(progress('one/a', 'one/b'))).toEqual(['tour', 'one', '-', '-', '-']);
    expect(open(progress('one/c'))).toEqual(['tour', 'one', 'two', '-', '-']);
  });

  it("opens the unit's project after its last lesson, and doesn't make the next unit wait for it", () => {
    expect(prerequisite(lessons, 3)?.id).toBe('two');
    expect(prerequisite(lessons, 4)?.id).toBe('two');
    expect(open(progress('one/c', 'two/c'))).toEqual(['tour', 'one', 'two', 'project-1', 'three']);
  });

  it('never requires the optional tour', () => {
    expect(prerequisite(lessons, 1)).toBeUndefined();
  });

  it('keeps a started lesson open, even if a lesson is added before it later', () => {
    expect(open(progress('two/a'))).toEqual(['tour', 'one', 'two', '-', '-']);
  });

  it('names lessons by number and projects by unit', () => {
    expect(lessonName({ ...two, number: 2 })).toBe('Lesson 2');
    expect(lessonName(project)).toBe('Unit 1 project');
  });

  it('opens everything with "unlock all" (test version)', () => {
    expect(lessons.every((_, i) => isLessonUnlocked({}, lessons, i, true))).toBe(true);
  });
});

describe('nextStepFor', () => {
  it('starts at the first required lesson', () => {
    expect(nextStepFor({}, lessons)).toMatchObject({ lesson: { id: 'one' }, index: 0 });
  });

  it('continues at the first step not done yet', () => {
    expect(nextStepFor(progress('one/a'), lessons)).toMatchObject({
      lesson: { id: 'one' },
      index: 1,
    });
  });

  it('skips complete lessons and projects, and ends when everything is done', () => {
    expect(nextStepFor(progress('one/c'), lessons)).toMatchObject({ lesson: { id: 'two' } });
    expect(nextStepFor(progress('one/c', 'two/c', 'three/c'), lessons)).toBeUndefined();
  });
});

describe('test-outs and unlock codes', () => {
  const testOut1 = lesson('test-out-1', 1, { kind: 'test-out' });
  const testOut2 = lesson('test-out-2', 2, { kind: 'test-out' });
  const four = lesson('four', 2);
  const course = [tour, testOut1, one, two, project, testOut2, three, four];
  const openIn = (steps: ProgressMap, unlocked: ReadonlySet<string> = new Set()) =>
    course.map((l, i) => (isLessonUnlocked(steps, course, i, false, unlocked) ? l.id : '-'));

  it("opens Unit 1's test-out from the start, and Unit 2's after Unit 1", () => {
    expect(openIn({})).toEqual(['tour', 'test-out-1', 'one', '-', '-', '-', '-', '-']);
    expect(openIn(progress('one/c', 'two/c'))).toEqual([
      'tour',
      'test-out-1',
      'one',
      'two',
      'project-1',
      'test-out-2',
      'three',
      '-',
    ]);
  });

  it("passing a test-out counts the unit's lessons as done, without marking their steps", () => {
    const passed = progress('test-out-1/c');
    expect(isLessonDone(passed, course, two)).toBe(true);
    expect(openIn(passed)).toEqual([
      'tour',
      'test-out-1',
      'one',
      'two',
      'project-1',
      'test-out-2',
      'three',
      '-',
    ]);
    expect(nextStepFor(passed, course)?.lesson.id).toBe('three');
    expect(passed['two/c']).toBeUndefined();
  });

  it('opens a lesson unlocked with a code, and names test-outs', () => {
    expect(openIn({}, new Set(['three']))[6]).toBe('three');
    expect(lessonName(testOut2)).toBe('Unit 2 test-out');
  });
});

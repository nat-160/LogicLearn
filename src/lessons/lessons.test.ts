/**
 * Content tests: every lesson must be solvable, and not already solved.
 *
 * For every build step: the reference solution PASSES the step's check, the starter
 * circuit FAILS it, the solution keeps the starter's locked parts, and the solution only
 * uses parts the student is allowed to add. This catches lesson-authoring mistakes before
 * a student does.
 */
import { check, findComponentDef } from '../sim';
import { LESSONS } from './catalog';
import { isBuildStep } from './types';

describe.each(LESSONS.map((l) => [l.id, l] as const))('lesson %s', (_id, lesson) => {
  it('has unique step ids and some text in every step', () => {
    const ids = lesson.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const step of lesson.steps) expect(step.prose.trim().length).toBeGreaterThan(20);
  });

  for (const step of lesson.steps.filter(isBuildStep)) {
    describe(`step "${step.id}"`, () => {
      it('reference solution passes the check', () => {
        const result = check(step.solution, step.spec);
        expect(result.diagnostics.filter((d) => d.severity === 'error')).toEqual([]);
        expect(result.pass).toBe(true);
      });

      it('starter circuit does not already pass', () => {
        expect(check(step.starter, step.spec).pass).toBe(false);
      });

      it('solution keeps every locked starter part', () => {
        const locked = step.starter.components.filter((c) => c.locked).map((c) => c.id);
        const solutionIds = new Set(step.solution.components.map((c) => c.id));
        for (const id of locked) expect(solutionIds.has(id)).toBe(true);
      });

      it('solution only adds parts from the palette', () => {
        const starterIds = new Set(step.starter.components.map((c) => c.id));
        const added = step.solution.components.filter((c) => !starterIds.has(c.id));
        for (const part of added) {
          expect(findComponentDef(part.type)).toBeDefined();
          expect(step.palette).toContain(part.type);
        }
      });
    });
  }
});

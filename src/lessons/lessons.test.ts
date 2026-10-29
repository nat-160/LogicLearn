/**
 * Content tests: every lesson must be solvable, not already solved, and fully written in
 * the default language (en-US).
 *
 * For every build step: the reference solution PASSES the step's check, the starter
 * circuit FAILS it, the solution keeps the starter's locked parts, and the solution only
 * uses parts the student is allowed to add. This catches lesson-authoring mistakes before
 * a student does.
 */
import { DEFAULT_LOCALE, LOCALES } from '../i18n/locales';
import { check, findComponentDef } from '../sim';
import { LESSON_DEFS } from './catalog';
import { findLessonFile, listLessonFiles, localizeLesson } from './lessonText';
import { isBuildStep } from './types';

describe.each(LESSON_DEFS.map((l) => [l.id, l] as const))('lesson %s', (_id, def) => {
  const lesson = localizeLesson(def, DEFAULT_LOCALE);

  it('has unique step ids', () => {
    const ids = def.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it(`has complete ${DEFAULT_LOCALE} text: a title and summary, and a title and text for every step`, () => {
    expect(findLessonFile(def.id, DEFAULT_LOCALE, 'lesson')?.locale).toBe(DEFAULT_LOCALE);
    expect(lesson.title).not.toBe(def.id);
    expect(lesson.summary.length).toBeGreaterThan(10);
    for (const step of def.steps) {
      expect(findLessonFile(def.id, DEFAULT_LOCALE, step.id)?.locale, step.id).toBe(DEFAULT_LOCALE);
    }
    for (const step of lesson.steps) {
      expect(step.title, step.id).not.toBe(step.id);
      expect(step.prose.trim().length, step.id).toBeGreaterThan(20);
    }
  });

  it('every translation gives each step as many hints as en-US does', () => {
    for (const { code } of LOCALES.filter((l) => l.code !== DEFAULT_LOCALE)) {
      const translated = localizeLesson(def, code);
      translated.steps.forEach((step, i) => {
        if (step.locale !== code) return; // not translated yet: shows the en-US text
        expect(step.hints.length, `${code}/${step.id}.md`).toBe(lesson.steps[i].hints.length);
      });
    }
  });

  it('every text file belongs to a step (no misspelled file names)', () => {
    const names = new Set(['lesson', ...def.steps.map((s) => s.id)]);
    for (const file of listLessonFiles().filter((f) => f.lesson === def.id)) {
      expect(names.has(file.name), `${file.locale}/${file.name}.md`).toBe(true);
      expect(
        LOCALES.some((l) => l.code === file.locale),
        `${file.locale} is not in src/i18n/locales.ts`,
      ).toBe(true);
    }
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

      it('has at least one hint', () => {
        expect(step.hints.length).toBeGreaterThan(0);
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

      it('predict-first steps also hide the truth table', () => {
        if (step.liveOutputs === false) expect(step.truthTable).toBe('hidden');
      });
    });
  }
});

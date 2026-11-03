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
import {
  check,
  computeTruthTable,
  findComponentDef,
  findIO,
  GATE_TYPES,
  type CircuitDoc,
} from '../sim';

function tableOf(circuit: CircuitDoc) {
  const result = computeTruthTable(circuit);
  if (!result.ok) throw new Error(`${circuit.name}: too many inputs`);
  return result.table;
}
import { LESSON_DEFS, UNITS } from './catalog';
import {
  findLessonFile,
  findSharedText,
  listLessonFiles,
  localizeLesson,
  SHARED_FOLDER,
} from './lessonText';
import { isBuildStep, isPredictStep } from './types';

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

  for (const step of lesson.steps.filter(isPredictStep)) {
    describe(`predict step "${step.id}"`, () => {
      it('has circuits to predict (a challenge: at least two, with different tables)', () => {
        expect(step.circuits.length).toBeGreaterThanOrEqual(step.level === 'challenge' ? 2 : 1);
        const tables = step.circuits.map((c) => JSON.stringify(tableOf(c).rows));
        expect(new Set(tables).size).toBe(tables.length);
      });

      it('only predicts circuits that are fully locked, small, settled and connected', () => {
        for (const circuit of step.circuits) {
          expect(
            circuit.components.every((c) => c.locked),
            circuit.name,
          ).toBe(true);
          const table = tableOf(circuit);
          expect(table.inputs.length).toBeLessThanOrEqual(6);
          expect(table.outputs.length).toBeGreaterThan(0);
          for (const row of table.rows) {
            expect(row.settled).toBe(true);
            expect(row.outputs, circuit.name).not.toContain('X');
          }
        }
      });

      it('has at least one hint', () => {
        expect(step.hints.length).toBeGreaterThan(0);
      });
    });
  }

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

      it('has enough hints (guided: at least 2, challenge: at least 1)', () => {
        expect(step.hints.length).toBeGreaterThanOrEqual(step.kind === 'guided' ? 2 : 1);
      });

      it("lists the spec's inputs and outputs in the order the truth table shows them", () => {
        // The truth table sorts switches and lights by label; the "wanted" column and the
        // tried-rows count only line up when the spec uses the same order.
        const { inputs, outputs } = findIO(step.solution);
        expect(step.spec.inputs).toEqual(inputs.map((p) => p.label));
        expect(step.spec.outputs).toEqual(outputs.map((p) => p.label));
      });

      it('only offers parts that exist', () => {
        for (const type of step.palette) expect(findComponentDef(type), type).toBeDefined();
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

/** Names a file in content/_shared/<locale>/ may have (see lessonText.ts). */
const SHARED_NAMES = [/^unit-\d+$/, /^gate-[A-Z]+$/, /^nudge-stuck$/, /^predict-reveal$/];

/** Shared files every build needs in en-US. */
const REQUIRED_SHARED = [...GATE_TYPES.map((t) => `gate-${t}`), 'nudge-stuck', 'predict-reveal'];

describe('lessons and units', () => {
  it('lessons have unique ids, and each belongs to a unit', () => {
    const ids = LESSON_DEFS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const def of LESSON_DEFS) expect(UNITS, def.id).toContain(def.unit);
  });

  it(`every unit has a title and summary in ${DEFAULT_LOCALE}`, () => {
    for (const unit of UNITS) {
      const text = findSharedText(`unit-${unit}`, DEFAULT_LOCALE);
      expect(text?.locale, `unit-${unit}.md`).toBe(DEFAULT_LOCALE);
      expect(text?.title).toMatch(/\S/);
      expect(text?.prose).toMatch(/\S/);
    }
  });

  it(`has every required shared text in ${DEFAULT_LOCALE} (gate reminder, messages)`, () => {
    for (const name of REQUIRED_SHARED) {
      const text = findSharedText(name, DEFAULT_LOCALE);
      expect(text?.locale, `${name}.md`).toBe(DEFAULT_LOCALE);
      expect(text?.title, `${name}.md`).toMatch(/\S/);
    }
  });

  it('lessons only introduce real gates', () => {
    for (const def of LESSON_DEFS) {
      for (const type of def.introduces ?? []) expect(GATE_TYPES, def.id).toContain(type);
    }
  });

  it('every shared text file has a known name and language', () => {
    for (const file of listLessonFiles().filter((f) => f.lesson === SHARED_FOLDER)) {
      expect(
        SHARED_NAMES.some((name) => name.test(file.name)),
        `${file.locale}/${file.name}.md`,
      ).toBe(true);
      expect(LOCALES.some((l) => l.code === file.locale)).toBe(true);
    }
  });
});

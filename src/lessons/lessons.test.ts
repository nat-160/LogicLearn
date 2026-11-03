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
  grade,
  gradeRule,
  MISCONCEPTION_IDS,
  rowNumber,
  rowsFromRules,
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
import { isBuildStep, isPredictStep, isProjectStep } from './types';

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
    const briefIds = def.steps.flatMap((s) => (isProjectStep(s) ? s.briefs.map((b) => b.id) : []));
    const names = new Set(['lesson', ...def.steps.map((s) => s.id), ...briefIds]);
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

  for (const step of lesson.steps.filter(isProjectStep)) {
    describe.each(step.briefs.map((b) => [b.id, b] as const))(
      `project step "${step.id}", brief %s`,
      (briefId, brief) => {
        const spec = {
          inputs: brief.inputs,
          outputs: brief.outputs,
          rule: brief.example.rule,
          criteria: brief.criteria,
          ...(brief.constraints && { constraints: brief.constraints }),
        };

        it(`has ${DEFAULT_LOCALE} text with at least one hint`, () => {
          expect(findLessonFile(def.id, DEFAULT_LOCALE, briefId)?.locale).toBe(DEFAULT_LOCALE);
          expect(brief.title).not.toBe(briefId);
          expect(brief.prose.trim().length).toBeGreaterThan(20);
          expect(brief.hints.length).toBeGreaterThanOrEqual(1);
        });

        it('lists its inputs and outputs in the order the truth table shows them', () => {
          const { inputs, outputs } = findIO(brief.starter);
          expect(brief.inputs).toEqual(inputs.map((p) => p.label));
          expect(brief.outputs).toEqual(outputs.map((p) => p.label));
        });

        it('gives rows that exist, once each, and (for a student rule) leaves some open', () => {
          const rows = brief.rule.kind === 'student' ? brief.rule.given : brief.rule.rows;
          const numbers = rows.map((r) => rowNumber(r.inputs));
          expect(new Set(numbers).size).toBe(numbers.length);
          for (const r of rows) {
            expect(r.inputs).toHaveLength(brief.inputs.length);
            expect(r.outputs).toHaveLength(brief.outputs.length);
          }
          const total = 2 ** brief.inputs.length;
          if (brief.rule.kind === 'student') expect(rows.length).toBeLessThan(total);
          else expect(rows.length).toBe(total);
        });

        it("has an example rule that keeps the brief's rows and passes the rule checks", () => {
          expect(brief.example.rule).toHaveLength(2 ** brief.inputs.length);
          expect(gradeRule(spec).filter((c) => !c.pass)).toEqual([]);
        });

        it('has an example solution that passes every criterion', () => {
          const result = grade(brief.example.solution, spec);
          expect(result.criteria.filter((c) => !c.pass)).toEqual([]);
          expect(result.pass).toBe(true);
        });

        it('starter circuit does not already pass', () => {
          expect(grade(brief.starter, spec).pass).toBe(false);
        });

        it('only offers parts that exist, and the example only adds parts from the palette', () => {
          for (const type of brief.palette) expect(findComponentDef(type), type).toBeDefined();
          const starterIds = new Set(brief.starter.components.map((c) => c.id));
          for (const part of brief.example.solution.components) {
            if (!starterIds.has(part.id)) expect(brief.palette).toContain(part.type);
          }
          for (const part of brief.starter.components.filter((c) => c.locked)) {
            expect(brief.example.solution.components.map((c) => c.id)).toContain(part.id);
          }
        });
      },
    );
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

      it('lists rules (if any) that make exactly the expected rows', () => {
        if (!step.spec.rules) return;
        expect(step.spec.outputs).toHaveLength(1);
        expect(rowsFromRules(step.spec.inputs, step.spec.rules)).toEqual(step.spec.expected);
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
const SHARED_NAMES = [
  /^unit-\d+$/,
  /^gate-[A-Z]+$/,
  /^misconception-[a-z-]+$/,
  /^nudge-(stuck|untried-rows)$/,
  /^predict-reveal$/,
];

/** The {placeholders} each shared text may use (others would show up unfilled). */
const PLACEHOLDERS: [RegExp, string[]][] = [
  [/^misconception-/, ['output', 'input', 'rule']],
  [/^nudge-untried-rows$/, ['tried', 'total']],
];

/** Shared files every build needs in en-US. */
const REQUIRED_SHARED = [
  ...GATE_TYPES.map((t) => `gate-${t}`),
  ...MISCONCEPTION_IDS.map((id) => `misconception-${id}`),
  'nudge-stuck',
  'nudge-untried-rows',
  'predict-reveal',
];

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

  it('shared texts only use the placeholders that are filled in', () => {
    for (const file of listLessonFiles().filter((f) => f.lesson === SHARED_FOLDER)) {
      const text = findSharedText(file.name, file.locale);
      const used = [
        ...`${text?.title} ${text?.prose} ${text?.hints.join(' ')}`.matchAll(/\{([a-z]+)\}/g),
      ].map((m) => m[1]);
      const allowed = PLACEHOLDERS.find(([name]) => name.test(file.name))?.[1] ?? [];
      for (const name of used) expect(allowed, `${file.locale}/${file.name}.md`).toContain(name);
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

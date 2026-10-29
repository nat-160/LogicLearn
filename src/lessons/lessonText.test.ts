import { resolveLocale } from '../i18n/locales';
import { findLessonFile, localizeLesson, parseLessonInfo, parseStepText } from './lessonText';
import type { LessonDef } from './types';

describe('parseStepText', () => {
  it('splits a step file into title, text and hints', () => {
    const md = [
      '<!-- draft -->',
      '',
      '# Build it: NOT',
      '',
      '- Do the thing.',
      '',
      '<!-- hints -->',
      '',
      '- First hint',
      '  continues here.',
      '- Second **hint**',
    ].join('\n');
    expect(parseStepText(md)).toEqual({
      title: 'Build it: NOT',
      prose: '- Do the thing.',
      hints: ['First hint continues here.', 'Second **hint**'],
      draft: true,
    });
  });

  it('works without a draft marker or hints', () => {
    expect(parseStepText('# Title\n\nText.')).toEqual({
      title: 'Title',
      prose: 'Text.',
      hints: [],
      draft: false,
    });
  });
});

describe('parseLessonInfo', () => {
  it('reads the title and summary', () => {
    expect(parseLessonInfo('# NOT and AND\n\nMeet two gates.\n')).toEqual({
      title: 'NOT and AND',
      summary: 'Meet two gates.',
    });
  });
});

describe('languages', () => {
  // A pretend translation: Spanish has the lesson title and one step, but not the other.
  const files = {
    './content/demo/en-US/lesson.md': '# Gates\n\nTwo gates.',
    './content/demo/en-US/one.md': '# One\n\nEnglish one.',
    './content/demo/en-US/two.md': '# Two\n\nEnglish two.',
    './content/demo/es-US/lesson.md': '# Compuertas\n\nDos compuertas.',
    './content/demo/es-US/one.md': '# Uno\n\nUno en español.',
  };
  const def: LessonDef = {
    id: 'demo',
    number: 1,
    standards: [],
    steps: [
      { id: 'one', kind: 'explain' },
      { id: 'two', kind: 'explain' },
    ],
  };

  it('uses the translation where it exists and falls back to en-US file by file', () => {
    const lesson = localizeLesson(def, 'es-US', files);
    expect(lesson.title).toBe('Compuertas');
    expect(lesson.steps.map((s) => [s.title, s.locale])).toEqual([
      ['Uno', 'es-US'],
      ['Two', 'en-US'],
    ]);
  });

  it('finds the default-language file when the language has none', () => {
    expect(findLessonFile('demo', 'fr-FR', 'one', files)?.locale).toBe('en-US');
  });

  it('resolves a browser language to a supported one', () => {
    const available = [
      { code: 'en-US', name: 'English (US)' },
      { code: 'es-US', name: 'Español (EE. UU.)' },
    ];
    expect(resolveLocale('es-MX', available)).toBe('es-US');
    expect(resolveLocale('es_us', available)).toBe('es-US');
    expect(resolveLocale('fr-FR', available)).toBe('en-US');
    expect(resolveLocale(null, available)).toBe('en-US');
  });
});

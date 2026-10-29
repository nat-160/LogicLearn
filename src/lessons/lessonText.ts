/**
 * Lesson text: reading the Markdown files, and choosing the right language.
 *
 * Files live in content/<lesson>/<locale>/:
 *
 *   lesson.md         # Lesson title
 *                     One-sentence summary for the lesson list.
 *
 *   <step-id>.md      <!-- draft -->            ← optional: still placeholder text
 *                     # Step title
 *                     The step's text (Markdown).
 *                     <!-- hints -->            ← optional: the hints, one list item each
 *                     - First hint
 *                     - Second hint
 *
 * The markers are HTML comments, so they read the same in every language. If a file is
 * missing (or still empty) in the student's language, the en-US file is used instead,
 * file by file, so a half-finished translation never shows an empty step.
 */
import { DEFAULT_LOCALE } from '../i18n/locales';
import {
  DRAFT_PATTERN,
  HINTS_PATTERN,
  type Lesson,
  type LessonDef,
  type Step,
  type StepText,
} from './types';

/** Every lesson text file, bundled at build time: "./content/<lesson>/<locale>/<name>.md". */
const FILES = import.meta.glob('./content/*/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export type LessonFiles = Readonly<Record<string, string>>;

function filePath(lessonId: string, locale: string, name: string): string {
  return `./content/${lessonId}/${locale}/${name}.md`;
}

/** A file in the requested language, or in the default language if it isn't translated. */
export function findLessonFile(
  lessonId: string,
  locale: string,
  name: string,
  files: LessonFiles = FILES,
): { text: string; locale: string } | undefined {
  for (const candidate of [locale, DEFAULT_LOCALE]) {
    const text = files[filePath(lessonId, candidate, name)];
    if (text !== undefined) return { text, locale: candidate };
  }
  return undefined;
}

/** Split a step's Markdown into title, text and hints. */
export function parseStepText(markdown: string): Omit<StepText, 'locale'> {
  let text = markdown.replace(/\r\n/g, '\n').trim();
  const draftMarker = DRAFT_PATTERN.exec(text);
  if (draftMarker) text = text.slice(draftMarker[0].length).trim();

  let hints: string[] = [];
  const hintsMarker = HINTS_PATTERN.exec(text);
  if (hintsMarker) {
    hints = parseListItems(text.slice(hintsMarker.index + hintsMarker[0].length));
    text = text.slice(0, hintsMarker.index).trim();
  }

  let title = '';
  const heading = text.match(/^# (.+)$/m);
  if (heading) {
    title = heading[1].trim();
    text = text.replace(heading[0], '').trim();
  }
  return { title, prose: text, hints, draft: !!draftMarker };
}

/** "- one\n  continued\n- two" → ["one continued", "two"]; numbered lists work too. */
function parseListItems(markdown: string): string[] {
  const items: string[] = [];
  for (const line of markdown.split('\n')) {
    const bullet = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (bullet) items.push(bullet[1].trim());
    else if (line.trim() && items.length) items[items.length - 1] += ` ${line.trim()}`;
  }
  return items;
}

/** "# Title\n\nSummary…" → { title, summary } */
export function parseLessonInfo(markdown: string): { title: string; summary: string } {
  const text = markdown.replace(/\r\n/g, '\n').trim().replace(DRAFT_PATTERN, '').trim();
  const heading = text.match(/^# (.+)$/m);
  return {
    title: heading ? heading[1].trim() : '',
    summary: (heading ? text.replace(heading[0], '') : text).trim(),
  };
}

/**
 * A step's text in the requested language, or in the default language if that file is
 * missing or has no text yet (a translation that was started but not written).
 */
function findStepText(
  lessonId: string,
  locale: string,
  stepId: string,
  files: LessonFiles,
): StepText | undefined {
  for (const candidate of [locale, DEFAULT_LOCALE]) {
    const file = files[filePath(lessonId, candidate, stepId)];
    if (file === undefined) continue;
    const text = parseStepText(file);
    if (text.title || text.prose) return { ...text, locale: candidate };
  }
  return undefined;
}

/** Join a lesson definition with its text in the given language. */
export function localizeLesson(def: LessonDef, locale: string, files: LessonFiles = FILES): Lesson {
  const info = findLessonFile(def.id, locale, 'lesson', files);
  const { title, summary } = parseLessonInfo(info?.text ?? '');
  const steps = def.steps.map((stepDef): Step => {
    const text = findStepText(def.id, locale, stepDef.id, files) ?? {
      title: '',
      prose: '',
      hints: [],
      draft: false,
      locale,
    };
    return { ...stepDef, ...text, title: text.title || stepDef.id };
  });
  return { ...def, title: title || def.id, summary, locale: info?.locale ?? locale, steps };
}

/** The names of every text file, by lesson and locale (for the content tests). */
export function listLessonFiles(
  files: LessonFiles = FILES,
): { lesson: string; locale: string; name: string }[] {
  return Object.keys(files).map((path) => {
    const [, , lesson, locale, file] = path.split('/');
    return { lesson, locale, name: file.replace(/\.md$/, '') };
  });
}

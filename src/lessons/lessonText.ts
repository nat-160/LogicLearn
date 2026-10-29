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
 *                     <!-- hints -->            ← optional: the hints, one bullet each
 *                     - First hint
 *                     - Second hint
 *
 * The markers are HTML comments, so they read the same in every language. If a file is
 * missing in the student's language, the en-US file is used instead (file by file), so a
 * half-finished translation never shows an empty step.
 */
import { DEFAULT_LOCALE } from '../i18n/locales';
import {
  DRAFT_MARKER,
  HINTS_MARKER,
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
  const draft = text.startsWith(DRAFT_MARKER);
  if (draft) text = text.slice(DRAFT_MARKER.length).trim();

  let hints: string[] = [];
  const hintsAt = text.indexOf(HINTS_MARKER);
  if (hintsAt >= 0) {
    hints = parseBullets(text.slice(hintsAt + HINTS_MARKER.length));
    text = text.slice(0, hintsAt).trim();
  }

  let title = '';
  const heading = text.match(/^# (.+)$/m);
  if (heading) {
    title = heading[1].trim();
    text = text.replace(heading[0], '').trim();
  }
  return { title, prose: text, hints, draft };
}

/** "- one\n  continued\n- two" → ["one continued", "two"] */
function parseBullets(markdown: string): string[] {
  const items: string[] = [];
  for (const line of markdown.split('\n')) {
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) items.push(bullet[1].trim());
    else if (line.trim() && items.length) items[items.length - 1] += ` ${line.trim()}`;
  }
  return items;
}

/** "# Title\n\nSummary…" → { title, summary } */
export function parseLessonInfo(markdown: string): { title: string; summary: string } {
  const text = markdown.replace(/\r\n/g, '\n').replace(DRAFT_MARKER, '').trim();
  const heading = text.match(/^# (.+)$/m);
  return {
    title: heading ? heading[1].trim() : '',
    summary: (heading ? text.replace(heading[0], '') : text).trim(),
  };
}

/** Join a lesson definition with its text in the given language. */
export function localizeLesson(def: LessonDef, locale: string, files: LessonFiles = FILES): Lesson {
  const info = findLessonFile(def.id, locale, 'lesson', files);
  const { title, summary } = parseLessonInfo(info?.text ?? '');
  const steps = def.steps.map((stepDef): Step => {
    const file = findLessonFile(def.id, locale, stepDef.id, files);
    const text = parseStepText(file?.text ?? '');
    return { ...stepDef, ...text, title: text.title || stepDef.id, locale: file?.locale ?? locale };
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

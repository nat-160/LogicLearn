/**
 * The words for a recognized misconception, from content/_shared/<locale>/
 * misconception-<id>.md (title = what the circuit does, first hint = the question to
 * ask), so the course author can edit and translate them. The simulator's own English
 * text is the fallback.
 *
 * {output}, {input} and {rule} are filled in. A swap found in one rule of a word problem
 * gets "Rule 2: " in front; one found in one output of several gets "Output S: ", unless
 * the text already names {output}.
 */
import type { Misconception } from '../sim';
import { fillPlaceholders, findSharedText } from './lessonText';

export interface MisconceptionWords {
  summary: string;
  hint: string;
}

export function misconceptionText(m: Misconception, locale: string): MisconceptionWords {
  const text = findSharedText(`misconception-${m.id}`, locale);
  if (!text?.title || !text.hints[0]) return { summary: m.summary, hint: m.hint };
  const params = Object.fromEntries(
    Object.entries(m.params ?? {}).filter(([, v]) => v !== undefined),
  ) as Record<string, string | number>;
  let summary = fillPlaceholders(text.title, params);
  if (m.params?.rule !== undefined) summary = `Rule ${m.params.rule}: ${summary}`;
  else if (m.params?.output !== undefined && !text.title.includes('{output}')) {
    summary = `Output ${m.params.output}: ${summary}`;
  }
  return { summary, hint: fillPlaceholders(text.hints[0], params) };
}

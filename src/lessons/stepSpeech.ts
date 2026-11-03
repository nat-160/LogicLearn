/** What a lesson step sounds like when read aloud, and which language its text is in. */
import { INTERFACE_LOCALE } from '../i18n/locales';
import { inlineMarkdownToSpeech, markdownToSpeech } from '../narration/plainText';
import { summarizeCheck, type MisconceptionWordsFor } from '../editor/checkSummary';
import type { CheckResult } from '../sim';

/**
 * Everything a step's text (or a project brief's) should sound like when read aloud:
 * title, text, the hints revealed so far, and the last check result – in the same words
 * as on screen (`words`: the lesson's misconception text).
 */
export function stepSpeech(
  step: { title: string; prose: string; hints: string[] },
  hintsShown: number,
  result: CheckResult | null,
  words?: MisconceptionWordsFor,
): string {
  // A pause after the title, unless it already ends in one ("What is a logic gate?").
  const title = /[.!?:]$/.test(step.title) ? step.title : `${step.title}.`;
  const parts = [title, markdownToSpeech(step.prose)];
  step.hints.slice(0, hintsShown).forEach((hint, i) => {
    parts.push(`Hint ${i + 1}: ${inlineMarkdownToSpeech(hint)}`);
  });
  if (result) parts.push(summarizeCheck(result, words));
  return parts.join(' ');
}

/**
 * The `lang` to put on a step's own text: only needed when it differs from the interface
 * language (which is the page's lang).
 */
export function textLang(step: { locale: string }): string | undefined {
  return step.locale !== INTERFACE_LOCALE ? step.locale : undefined;
}

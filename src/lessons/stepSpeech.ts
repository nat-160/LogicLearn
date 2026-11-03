/** What a lesson step sounds like when read aloud, and which language its text is in. */
import { summarizeCheck } from '../editor/checkSummary';
import { INTERFACE_LOCALE } from '../i18n/locales';
import { inlineMarkdownToSpeech, markdownToSpeech } from '../narration/plainText';
import type { CheckResult } from '../sim';
import type { Step } from './types';

/** Everything a step's text should sound like when read aloud. */
export function stepSpeech(step: Step, hintsShown: number, result: CheckResult | null): string {
  // A pause after the title, unless it already ends in one ("What is a logic gate?").
  const title = /[.!?:]$/.test(step.title) ? step.title : `${step.title}.`;
  const parts = [title, markdownToSpeech(step.prose)];
  step.hints.slice(0, hintsShown).forEach((hint, i) => {
    parts.push(`Hint ${i + 1}: ${inlineMarkdownToSpeech(hint)}`);
  });
  if (result) parts.push(summarizeCheck(result));
  return parts.join(' ');
}

/**
 * The `lang` to put on a step's own text: only needed when it differs from the interface
 * language (which is the page's lang).
 */
export function textLang(step: { locale: string }): string | undefined {
  return step.locale !== INTERFACE_LOCALE ? step.locale : undefined;
}

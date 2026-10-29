/**
 * Turning lesson Markdown into text that sounds right when read aloud.
 *
 * Each paragraph, list item, heading and table row becomes its own sentence (a full stop
 * is added where there is none), so the voice pauses between them instead of running
 * "a NOT gate outputs the opposite A NOT A 0 1" together. Table rows are read cell by
 * cell: "A, NOT A. 0, 1. 1, 0."
 */
import { marked } from 'marked';

const BLOCKS = 'p, li, h1, h2, h3, h4, tr, blockquote, pre';

function sentence(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return /[.!?:;]$/.test(t) ? t : `${t}.`;
}

/** Spoken form of some HTML (lesson text, already rendered by `marked`). */
export function htmlToSpeech(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const parts: string[] = [];
  // Only the innermost blocks, so a list item's nested list isn't read twice.
  for (const el of doc.body.querySelectorAll<HTMLElement>(BLOCKS)) {
    if (el.tagName === 'TR') {
      const cells = [...el.querySelectorAll('th, td')].map((c) => c.textContent?.trim() ?? '');
      parts.push(sentence(cells.join(', ')));
      continue;
    }
    if (el.closest('tr')) continue;
    const copy = el.cloneNode(true) as HTMLElement;
    copy.querySelectorAll(BLOCKS).forEach((child) => child.remove());
    parts.push(sentence(copy.textContent ?? ''));
  }
  return parts.filter(Boolean).join(' ');
}

export function markdownToSpeech(markdown: string): string {
  return htmlToSpeech(marked.parse(markdown, { async: false }));
}

export function inlineMarkdownToSpeech(markdown: string): string {
  return htmlToSpeech(`<p>${marked.parseInline(markdown, { async: false })}</p>`);
}

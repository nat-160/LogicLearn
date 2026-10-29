/**
 * Renders lesson text written in Markdown. Lesson files are part of the app (written by
 * the course author, bundled at build time), not user input, so rendering their HTML is
 * safe. Never pass student-typed text to these components.
 *
 * `lang` marks text that is in a different language from the page (e.g. an untranslated
 * step shown in English on a Spanish page), so screen readers and read-aloud tools
 * pronounce it correctly.
 */
import { marked } from 'marked';
import { useMemo } from 'react';

export function Markdown({
  source,
  draft = false,
  lang,
}: {
  source: string;
  draft?: boolean;
  lang?: string;
}) {
  const html = useMemo(() => marked.parse(source, { async: false }), [source]);
  return (
    <div className="prose" lang={lang}>
      {draft && (
        <p
          className="draft-badge"
          title="Placeholder text: the final lesson text is still being written"
        >
          Draft text
        </p>
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

/** One line of Markdown (bold, italics, code) without a surrounding paragraph – for hints. */
export function MarkdownInline({ source }: { source: string }) {
  const html = useMemo(() => marked.parseInline(source, { async: false }), [source]);
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

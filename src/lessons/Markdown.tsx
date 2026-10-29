/**
 * Renders lesson text written in Markdown. Lesson files are part of the app (written by
 * the course author, bundled at build time), not user input, so rendering their HTML is
 * safe. Never pass student-typed text to this component.
 */
import { marked } from 'marked';
import { useMemo } from 'react';
import { DRAFT_MARKER } from './types';

export function Markdown({ source }: { source: string }) {
  const html = useMemo(
    () => marked.parse(source.replace(DRAFT_MARKER, ''), { async: false }),
    [source],
  );
  const draft = source.trimStart().startsWith(DRAFT_MARKER);
  return (
    <div className="prose">
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

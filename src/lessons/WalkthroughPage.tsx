/**
 * A lesson's walkthrough: a short explanation of its idea, shown on a circuit one frame
 * at a time. Each frame sets the switches (so wires and lights show the values) and can
 * point at parts, and its caption says why the circuit does what it does.
 *
 * The student moves with Back and Next – nothing advances on its own, so there is always
 * time to read (and no motion to stop). Each new caption is announced to screen readers
 * and, with "Read each lesson step aloud" on, read out.
 */
import { useEffect, useMemo, useState } from 'react';
import { lessonHref } from '../app/routes';
import { Editor } from '../editor/Editor';
import { createEditorStore } from '../editor/store';
import { TruthTablePanel } from '../editor/TruthTablePanel';
import { inputsForRow } from '../editor/useCheck';
import { inlineMarkdownToSpeech, markdownToSpeech } from '../narration/plainText';
import { ReadAloudButton } from '../narration/ReadAloud';
import type { Bit } from '../sim';
import { lessonName } from './gating';
import { Markdown, MarkdownInline } from './Markdown';
import { isStepDone, useProgress } from './progress';
import { textLang } from './stepSpeech';
import type { Lesson, Walkthrough } from './types';
import { useTell } from './useTell';

export function WalkthroughPage({ lesson }: { lesson: Lesson }) {
  const walkthrough = lesson.walkthrough;
  if (!walkthrough) {
    return (
      <div className="page narrow">
        <h1>No walkthrough for this lesson</h1>
        <a href={lessonHref(lesson.id)}>Back to the lesson</a>
      </div>
    );
  }
  return <WalkthroughView lesson={lesson} walkthrough={walkthrough} />;
}

function WalkthroughView({ lesson, walkthrough }: { lesson: Lesson; walkthrough: Walkthrough }) {
  const store = useMemo(() => createEditorStore(walkthrough.circuit), [walkthrough.circuit]);
  const [frame, setFrame] = useState(0);
  const steps = useProgress((s) => s.steps);
  const tell = useTell();
  const total = walkthrough.frames.length;
  const caption = walkthrough.captions[frame] ?? '';
  const lang = textLang(walkthrough);
  // Back to the first step of the lesson that isn't done yet (where help was needed).
  const open = lesson.steps.findIndex((s) => !isStepDone(steps, lesson.id, s.id));
  const backIndex = open < 0 ? 0 : open;

  // Show the frame on the circuit: its switch settings, and the parts it points at.
  useEffect(() => {
    const { inputs, highlight = [] } = walkthrough.frames[frame];
    const { doc, setInputs, setHighlight } = store.getState();
    const labels = Object.keys(inputs);
    setInputs(
      inputsForRow(
        doc,
        labels,
        labels.map((l) => inputs[l] as Bit),
      ),
    );
    setHighlight({ componentIds: highlight, tone: 'pointer' });
  }, [frame, store, walkthrough.frames]);

  const go = (next: number) => {
    setFrame(next);
    tell(
      'walkthrough',
      `Frame ${next + 1} of ${total}. ${inlineMarkdownToSpeech(walkthrough.captions[next] ?? '')}`,
      walkthrough.locale,
    );
  };

  const panel = (
    <div className="lesson-panel walkthrough">
      <header className="lesson-header">
        <p className="lesson-kicker">
          {lessonName(lesson)}: {lesson.title} – walkthrough
        </p>
        <a href={lessonHref(lesson.id, backIndex + 1)} data-testid="walkthrough-back">
          ← Back to step {backIndex + 1}
        </a>
      </header>
      <h1 className="step-title">
        <span lang={lang}>{walkthrough.title}</span>
        <span className="tag">Walkthrough</span>
      </h1>
      <ReadAloudButton
        id="walkthrough-frame"
        getText={() =>
          `${walkthrough.title}. ${markdownToSpeech(walkthrough.intro)} Frame ${frame + 1} of ${total}. ${inlineMarkdownToSpeech(caption)}`
        }
        label="Read this aloud"
        lang={walkthrough.locale}
      />
      <Markdown source={walkthrough.intro} draft={walkthrough.draft} lang={lang} />
      <section className="walkthrough-frame" aria-labelledby="frame-count">
        <p id="frame-count" className="frame-count" data-testid="frame-count">
          Frame {frame + 1} of {total}
        </p>
        <p className="frame-caption" data-testid="frame-caption">
          <MarkdownInline source={caption} lang={lang} />
        </p>
      </section>
      {/* aria-disabled (not disabled) keeps a button focusable, so keyboard focus
          doesn't drop to the page when the first or last frame is reached. */}
      <div className="lesson-actions">
        <button
          type="button"
          onClick={() => frame > 0 && go(frame - 1)}
          aria-disabled={frame === 0}
        >
          ← Back
        </button>
        <button
          type="button"
          className="primary"
          onClick={() => frame < total - 1 && go(frame + 1)}
          aria-disabled={frame === total - 1}
          data-testid="frame-next"
        >
          Next →
        </button>
      </div>
      {frame === total - 1 && (
        <a
          className="button primary next"
          href={lessonHref(lesson.id, backIndex + 1)}
          data-testid="walkthrough-done"
        >
          Back to step {backIndex + 1} →
        </a>
      )}
    </div>
  );

  return <Editor store={store} readOnly lead={panel} side={<TruthTablePanel />} />;
}

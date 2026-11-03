/**
 * A step's heading, Read aloud button and text. With "Read each lesson step aloud" on in
 * Settings, the text is read as soon as the step opens.
 */
import { useEffect } from 'react';
import { ReadAloudButton } from '../narration/ReadAloud';
import { useSpeaker, useStopSpeakingOnUnmount } from '../narration/useSpeaker';
import { usePreferences } from '../settings/preferences';
import { Markdown } from './Markdown';
import { textLang } from './stepSpeech';
import type { Step } from './types';

export function StepText({
  step,
  tag,
  speech,
}: {
  step: Step;
  tag?: string;
  /** The full text to read aloud (title, text, hints, result). */
  speech: () => string;
}) {
  const autoRead = usePreferences((s) => s.autoRead);
  const { supported, speak } = useSpeaker();
  const lang = textLang(step);
  useStopSpeakingOnUnmount();

  useEffect(() => {
    if (autoRead && supported) speak('step', speech(), step.locale);
    // Only when the step opens, not on every change to its hints or result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  return (
    <>
      <h1 className="step-title">
        <span lang={lang}>{step.title}</span>
        {tag && <span className="tag">{tag}</span>}
      </h1>
      <ReadAloudButton id="step" getText={speech} label="Read this step aloud" lang={step.locale} />
      <Markdown source={step.prose} draft={step.draft} lang={lang} />
    </>
  );
}

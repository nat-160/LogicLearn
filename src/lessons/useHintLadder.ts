/**
 * The state behind HintLadder: how many hints are revealed (restored from progress), what
 * happens when another is revealed, and whether to show the "Stuck? A hint is ready" note
 * (after two failed checks without a hint – announced once).
 */
import { useEffect, useRef, useState } from 'react';
import { inlineMarkdownToSpeech } from '../narration/plainText';
import { isStepDone, stepKey, useProgress } from './progress';
import { stuckText } from './sharedMessages';
import type { Lesson } from './types';
import { useTell } from './useTell';

/** `step` can be a step, or a project brief with its own id ("build--door-alarm"). */
export function useHintLadder(
  lesson: Lesson,
  step: { id: string; hints: string[]; locale: string },
) {
  const key = stepKey(lesson.id, step.id);
  const revealHint = useProgress((s) => s.revealHint);
  const done = useProgress((s) => isStepDone(s.steps, lesson.id, step.id));
  const attempts = useProgress((s) => s.steps[key]?.attempts ?? 0);
  const [shown, setShown] = useState(() =>
    Math.min(useProgress.getState().steps[key]?.hintsUsed ?? 0, step.hints.length),
  );
  const tell = useTell();

  const show = () => {
    const next = shown + 1;
    setShown(next);
    revealHint(lesson.id, step.id, next);
    tell('hint', `Hint ${next}: ${inlineMarkdownToSpeech(step.hints[next - 1])}`, step.locale);
  };

  const stuck = !done && attempts >= 2 && shown === 0 && step.hints.length > 0;
  const wasStuck = useRef(stuck);
  useEffect(() => {
    if (stuck && !wasStuck.current) tell('stuck', stuckText(step.locale), step.locale);
    wasStuck.current = stuck;
  }, [stuck, step.locale, tell]);

  return { shown, show, stuck };
}

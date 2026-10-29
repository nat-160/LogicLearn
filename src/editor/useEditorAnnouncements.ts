import { useContext, useEffect } from 'react';
import { announce } from '../a11y/announcer';
import { findIO } from '../sim';
import { partName } from './describe';
import { BlindContext, useEditorStore } from './editorContext';

/**
 * Announce when a light changes ("Light Y is now on"), and messages from the editor such
 * as why a connection was refused. Lights are not announced in predict-first mode.
 */
export function useEditorAnnouncements(): void {
  const store = useEditorStore();
  const blind = useContext(BlindContext);
  useEffect(() => {
    const lightValues = () => {
      const { doc, values } = store.getState();
      return new Map(findIO(doc).outputs.map((p) => [p.id, values[`${p.id}.in`]]));
    };
    let before = lightValues();
    return store.subscribe((state, previous) => {
      if (state.notice && state.notice !== previous.notice) announce(state.notice);
      if (!state.report.settled && previous.report.settled) {
        announce('This circuit never settles – some parts keep flipping.', 'assertive');
      }
      const after = lightValues();
      if (!blind && state.doc === previous.doc) {
        const changes: string[] = [];
        for (const [id, value] of after) {
          if (before.has(id) && before.get(id) !== value && value !== 'X') {
            const part = state.doc.components.find((c) => c.id === id);
            if (part) changes.push(`${partName(part)} is now ${value === 1 ? 'on' : 'off'}.`);
          }
        }
        if (changes.length) announce(changes.join(' '));
      }
      before = after;
    });
  }, [store, blind]);
}

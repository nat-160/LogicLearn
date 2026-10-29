/**
 * Run the checker on the editor's current circuit and highlight what went wrong: wrong
 * rows in the truth table and problem parts on the canvas. The result is dropped as
 * soon as the circuit changes, because it no longer describes what is on screen.
 */
import { useState } from 'react';
import { check, rowNumber, type CheckResult, type CheckSpec, type CircuitDoc } from '../sim';
import { useEditor, useEditorStore } from './editorContext';

export function useCheck() {
  const store = useEditorStore();
  const doc = useEditor((s) => s.doc);
  const [last, setLast] = useState<{ doc: CircuitDoc; result: CheckResult } | null>(null);

  const run = (spec: CheckSpec): CheckResult => {
    const current = store.getState().doc;
    const result = check(current, spec);
    setLast({ doc: current, result });
    store.getState().setHighlight({
      componentIds: result.diagnostics
        .filter((d) => d.severity === 'error')
        .flatMap((d) => d.componentIds ?? []),
      rows: result.mismatches.map((m) => rowNumber(m.inputs)),
    });
    return result;
  };

  const result = last && last.doc === doc ? last.result : null;
  return { result, run, clear: () => setLast(null) };
}

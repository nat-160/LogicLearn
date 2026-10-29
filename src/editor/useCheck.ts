/**
 * Run the checker on the editor's current circuit and highlight what went wrong: wrong
 * rows in the truth table and problem parts on the canvas.
 *
 * A result belongs to one version of the design. Any change to the circuit (not just
 * moving parts around) hides it, and the store clears the highlights at the same time,
 * so the screen never shows marks that describe an older circuit.
 */
import { useState } from 'react';
import {
  check,
  findIO,
  rowNumber,
  type Bit,
  type CheckResult,
  type CheckSpec,
  type CircuitDoc,
} from '../sim';
import { useEditor, useEditorStore } from './editorContext';

export function useCheck() {
  const store = useEditorStore();
  const designVersion = useEditor((s) => s.designVersion);
  const [last, setLast] = useState<{ version: number; result: CheckResult } | null>(null);

  const run = (spec: CheckSpec): CheckResult => {
    const { doc, designVersion: version, setHighlight } = store.getState();
    const result = check(doc, spec);
    setLast({ version, result });
    setHighlight({
      componentIds: result.diagnostics
        .filter((d) => d.severity === 'error')
        .flatMap((d) => d.componentIds ?? []),
      rows: result.mismatches.map((m) => circuitRow(doc, spec, m.inputs)),
    });
    return result;
  };

  const clear = () => {
    setLast(null);
    store.getState().setHighlight({});
  };

  const result = last && last.version === designVersion ? last.result : null;
  return { result, run, clear };
}

/**
 * The truth-table row (in the circuit's own input order) for a row of a spec. The circuit
 * may have extra inputs the spec doesn't mention; the checker holds those at 0.
 */
function circuitRow(doc: CircuitDoc, spec: CheckSpec, specBits: Bit[]): number {
  const bits = findIO(doc).inputs.map((part) => {
    const i = spec.inputs.indexOf(part.label);
    return i >= 0 ? specBits[i] : 0;
  });
  return rowNumber(bits);
}

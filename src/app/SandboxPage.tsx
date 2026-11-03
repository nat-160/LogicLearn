/**
 * The sandbox: build anything. Work is saved in this browser automatically.
 */
import { useEffect, useMemo, useState } from 'react';
import { TargetCheckPanel } from '../editor/CheckPanel';
import { Editor } from '../editor/Editor';
import { Inspector } from '../editor/Inspector';
import { createEditorStore } from '../editor/store';
import { TARGETS } from '../editor/targets';
import { TruthTablePanel } from '../editor/TruthTablePanel';
import { GateReference } from '../lessons/GateReference';
import { misconceptionText } from '../lessons/misconceptionText';
import { useLocale } from '../settings/display';
import { GATE_TYPES } from '../sim';
import { loadSandbox, requestPersistentStorage, saveSandbox } from '../storage/storage';
import { debounce } from './debounce';
import { exampleCircuit } from './exampleCircuit';
import { FileActions } from './FileActions';

export function SandboxPage() {
  const [targetId, setTargetId] = useState('');
  // Save shortly after each change (not on every drag frame).
  const autosave = useMemo(() => debounce(saveSandbox, 300), []);
  const store = useMemo(
    () => createEditorStore(loadSandbox() ?? exampleCircuit(), { onDocChange: autosave }),
    [autosave],
  );

  useEffect(() => {
    requestPersistentStorage();
    // If the student leaves or closes the page right after a change, save it now.
    window.addEventListener('pagehide', autosave.flush);
    return () => {
      autosave.flush();
      window.removeEventListener('pagehide', autosave.flush);
    };
  }, [autosave]);

  const target = TARGETS.find((t) => t.id === targetId);
  const locale = useLocale();
  return (
    <>
      <h1 className="sr-only">Sandbox</h1>
      <Editor
        store={store}
        toolbarExtras={<FileActions store={store} />}
        side={
          <>
            <Inspector />
            <TargetCheckPanel
              targetId={targetId}
              onTargetChange={setTargetId}
              words={(m) => misconceptionText(m, locale)}
            />
            <TruthTablePanel spec={target?.spec} />
            <section className="panel" aria-label="Gate reminder">
              <GateReference gates={GATE_TYPES} />
            </section>
          </>
        }
      />
    </>
  );
}

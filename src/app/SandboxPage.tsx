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
  return (
    <>
      <h1 className="sr-only">Sandbox</h1>
      <Editor
        store={store}
        toolbarExtras={<FileActions store={store} />}
        side={
          <>
            <Inspector />
            <TargetCheckPanel targetId={targetId} onTargetChange={setTargetId} />
            <TruthTablePanel spec={target?.spec} />
          </>
        }
      />
    </>
  );
}

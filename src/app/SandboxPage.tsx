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
  const store = useMemo(
    () =>
      createEditorStore(loadSandbox() ?? exampleCircuit(), {
        // Save shortly after each change (not on every drag frame).
        onDocChange: debounce(saveSandbox, 300),
      }),
    [],
  );

  useEffect(() => {
    requestPersistentStorage();
    // Save immediately if the student closes or leaves the page.
    const flush = () => saveSandbox(store.getState().doc);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
    };
  }, [store]);

  const target = TARGETS.find((t) => t.id === targetId);
  return (
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
  );
}

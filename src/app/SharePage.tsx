/**
 * Opening a shared link. The shared circuit opens as a COPY: nothing here is saved, and
 * the student's own sandbox is untouched unless they choose to replace it.
 */
import { useMemo } from 'react';
import { unlockAll } from '../sim';
import { Editor } from '../editor/Editor';
import { Inspector } from '../editor/Inspector';
import { createEditorStore } from '../editor/store';
import { TruthTablePanel } from '../editor/TruthTablePanel';
import { decodeShareData, loadSandbox, saveSandbox } from '../storage/storage';
import { navigate } from './routes';

export function SharePage({ data }: { data: string }) {
  const loaded = useMemo(() => decodeShareData(data), [data]);
  const store = useMemo(() => (loaded.ok ? createEditorStore(loaded.doc) : null), [loaded]);

  if (!loaded.ok || !store) {
    return (
      <div className="page narrow">
        <h1>Couldn't open this link</h1>
        <p>{loaded.ok ? '' : loaded.errors[0]}</p>
        <p>
          <a href="#/sandbox">Go to the sandbox</a>
        </p>
      </div>
    );
  }

  const keepCopy = () => {
    const replace =
      !loadSandbox() || window.confirm('Replace the circuit in your sandbox with this one?');
    if (!replace) return;
    saveSandbox(unlockAll(store.getState().doc));
    navigate('#/sandbox');
  };

  return (
    <div className="share-page">
      <h1 className="sr-only">Shared circuit</h1>
      <div className="share-banner" role="status">
        You're looking at a shared circuit. Changes here are not saved.
        <button type="button" className="primary" onClick={keepCopy} data-testid="keep-copy">
          Copy to my sandbox
        </button>
      </div>
      <Editor
        store={store}
        side={
          <>
            <Inspector />
            <TruthTablePanel />
          </>
        }
      />
    </div>
  );
}

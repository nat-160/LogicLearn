/**
 * A complete editor: parts palette | toolbar + canvas | side panel.
 * The sandbox and each lesson step put one of these on screen with their own store and
 * their own side panel (truth table, check, lesson instructions…).
 */
import { ReactFlowProvider } from '@xyflow/react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Canvas } from './Canvas';
import { BlindContext, EditorContext } from './editorContext';
import { Palette } from './Palette';
import { ALL_PARTS } from './parts';
import type { EditorStore } from './store';
import { Toolbar } from './Toolbar';

export interface EditorProps {
  store: EditorStore;
  /** Part types offered in the palette (lessons can restrict this). */
  palette?: string[];
  /** Panel shown to the right of the canvas. */
  side?: ReactNode;
  /** Panel shown to the left of the palette (lesson instructions). */
  lead?: ReactNode;
  /** Predict-first mode: hide wire and light values (switches still show theirs). */
  blind?: boolean;
  /** Extra toolbar buttons (save, share…). */
  toolbarExtras?: ReactNode;
  readOnly?: boolean;
}

export function Editor({
  store,
  palette = ALL_PARTS,
  side,
  lead,
  blind = false,
  toolbarExtras,
  readOnly = false,
}: EditorProps) {
  // Undo/redo shortcuts. Typing in a text field keeps its own undo.
  const onKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select') || !(e.ctrlKey || e.metaKey)) return;
    const key = e.key.toLowerCase();
    if (key === 'z' && !e.shiftKey) {
      e.preventDefault();
      store.getState().undo();
    } else if ((key === 'z' && e.shiftKey) || key === 'y') {
      e.preventDefault();
      store.getState().redo();
    }
  };

  return (
    <EditorContext.Provider value={store}>
      <ReactFlowProvider>
        <BlindContext.Provider value={blind}>
          <div
            className={`editor ${blind ? 'is-blind' : ''}`}
            onKeyDown={readOnly ? undefined : onKeyDown}
          >
            {lead && <aside className="editor-lead">{lead}</aside>}
            {!readOnly && <Palette types={palette} />}
            <div className="editor-main">
              {!readOnly && <Toolbar>{toolbarExtras}</Toolbar>}
              <Canvas readOnly={readOnly} />
            </div>
            {side && <aside className="editor-side">{side}</aside>}
          </div>
        </BlindContext.Provider>
      </ReactFlowProvider>
    </EditorContext.Provider>
  );
}

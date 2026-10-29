/**
 * A complete editor: parts palette | toolbar + canvas | side panel.
 * The sandbox and each lesson step put one of these on screen with their own store and
 * their own side panel (truth table, check, lesson instructions…).
 *
 * Every editor also gets the text version of the circuit and (unless read-only) the
 * Connections panel, so it can be used with a screen reader or keyboard alone.
 */
import { ReactFlowProvider } from '@xyflow/react';
import { useEffect, type ReactNode } from 'react';
import { CircuitDescription, ConnectionsPanel } from './AccessPanels';
import { Canvas } from './Canvas';
import { BlindContext, EditorContext } from './editorContext';
import { Palette } from './Palette';
import { ALL_PARTS } from './parts';
import type { EditorStore } from './store';
import { Toolbar } from './Toolbar';
import { useEditorAnnouncements } from './useEditorAnnouncements';

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
  // Undo/redo shortcuts. They listen on the whole page, because focus often lands on
  // <body> (e.g. after a deleted part disappears). Typing in a text field keeps its own undo.
  useEffect(() => {
    if (readOnly) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.('input, textarea, select') || !(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.getState().undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        store.getState().redo();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [store, readOnly]);

  return (
    <EditorContext.Provider value={store}>
      <ReactFlowProvider>
        <BlindContext.Provider value={blind}>
          <div className={`editor ${blind ? 'is-blind' : ''}`}>
            <EditorAnnouncements />
            {lead && (
              <aside className="editor-lead" aria-label="Lesson instructions">
                {lead}
              </aside>
            )}
            {!readOnly && <Palette types={palette} />}
            <div className="editor-main">
              {!readOnly && <Toolbar>{toolbarExtras}</Toolbar>}
              <Canvas readOnly={readOnly} />
            </div>
            <aside className="editor-side" aria-label="Circuit tools">
              {side}
              <CircuitDescription />
              {!readOnly && <ConnectionsPanel />}
            </aside>
          </div>
        </BlindContext.Provider>
      </ReactFlowProvider>
    </EditorContext.Provider>
  );
}

/** Screen reader announcements for this editor (lights changing, refused connections…). */
function EditorAnnouncements() {
  useEditorAnnouncements();
  return null;
}

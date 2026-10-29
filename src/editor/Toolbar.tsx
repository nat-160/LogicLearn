/**
 * Undo, redo, delete and fit-to-view buttons. Every keyboard shortcut also has a button,
 * because tablets have no keyboard.
 */
import { useReactFlow } from '@xyflow/react';
import type { ReactNode } from 'react';
import { useEditor } from './editorContext';

export function Toolbar({ children }: { children?: ReactNode }) {
  const canUndo = useEditor((s) => s.past.length > 0);
  const canRedo = useEditor((s) => s.future.length > 0);
  const hasSelection = useEditor(
    (s) =>
      s.nodes.some((n) => n.selected && n.deletable !== false) || s.edges.some((e) => e.selected),
  );
  const undo = useEditor((s) => s.undo);
  const redo = useEditor((s) => s.redo);
  const removeSelected = useEditor((s) => s.removeSelected);
  const { fitView } = useReactFlow();

  return (
    <div className="toolbar" role="toolbar" aria-label="Editing">
      <button type="button" onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        ↶ Undo
      </button>
      <button type="button" onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
        ↷ Redo
      </button>
      <button
        type="button"
        onClick={removeSelected}
        disabled={!hasSelection}
        title="Delete the selected parts and wires (Delete key)"
        data-testid="delete-selected"
      >
        🗑 Delete
      </button>
      <button
        type="button"
        onClick={() => fitView({ padding: 0.25, maxZoom: 1.2, duration: 200 })}
        title="Show the whole circuit"
      >
        ⤢ Fit
      </button>
      <span className="toolbar-spacer" />
      {children}
    </div>
  );
}

/**
 * Details of the selected part: what it does, its label, and (for lights) its color.
 * Editing a label here is the touch-friendly alternative to keyboard shortcuts.
 */
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { findComponent, getComponentDef, type ComponentInstance } from '../sim';
import { useEditor } from './editorContext';
import { focusCanvas } from './focus';

const LIGHT_COLORS = ['yellow', 'red', 'green', 'blue'];

export function Inspector() {
  const selectedId = useEditor((s) => {
    const selected = s.nodes.filter((n) => n.selected);
    return selected.length === 1 ? selected[0].id : null;
  });
  const part = useEditor((s) => (selectedId ? findComponent(s.doc, selectedId) : undefined));
  if (!part) return null;
  // A new key per part resets the form when a different part is selected. (Keying on the
  // label too would remount the form after Enter and drop keyboard focus to the page,
  // where the next Backspace would delete the part.)
  return <PartForm key={part.id} part={part} />;
}

function PartForm({ part }: { part: ComponentInstance }) {
  const setLabel = useEditor((s) => s.setLabel);
  const setProps = useEditor((s) => s.setProps);
  const removeItems = useEditor((s) => s.removeItems);
  const [draft, setDraft] = useState(part.label ?? '');
  // If the label changes elsewhere (undo, redo), show the new one.
  const [shownLabel, setShownLabel] = useState(part.label);
  if (part.label !== shownLabel) {
    setShownLabel(part.label);
    setDraft(part.label ?? '');
  }
  const def = getComponentDef(part.type);
  const commitLabel = () => {
    if (draft.trim() !== (part.label ?? '')) setLabel(part.id, draft);
  };

  return (
    <section className="panel inspector" aria-label="Selected part">
      <h2 className="panel-title">{def.name}</h2>
      <p className="muted small">{def.description}</p>
      {part.locked ? (
        <p className="muted small">This part belongs to the task, so it can't be changed.</p>
      ) : (
        <>
          <label className="field">
            <span>Label</span>
            <input
              value={draft}
              maxLength={8}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => e.key === 'Enter' && commitLabel()}
              data-testid="label-input"
            />
          </label>
          {part.type === 'LIGHT' && (
            <label className="field">
              <span>Color</span>
              <select
                value={String(part.props.color ?? 'yellow')}
                onChange={(e) => setProps(part.id, { color: e.target.value })}
              >
                {LIGHT_COLORS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={(e) => {
              const editor = e.currentTarget.closest('.editor');
              flushSync(() => removeItems([part.id], []));
              focusCanvas(editor);
            }}
          >
            Delete this part
          </button>
        </>
      )}
    </section>
  );
}

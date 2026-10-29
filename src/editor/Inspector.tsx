/**
 * Details of the selected part: what it does, its label, and (for lights) its color.
 * Editing a label here is the touch-friendly alternative to keyboard shortcuts.
 */
import { useState } from 'react';
import { findComponent, getComponentDef, type ComponentInstance } from '../sim';
import { useEditor } from './editorContext';

const LIGHT_COLORS = ['yellow', 'red', 'green', 'blue'];

export function Inspector() {
  const selectedId = useEditor((s) => {
    const selected = s.nodes.filter((n) => n.selected);
    return selected.length === 1 ? selected[0].id : null;
  });
  const part = useEditor((s) => (selectedId ? findComponent(s.doc, selectedId) : undefined));
  if (!part) return null;
  // A new key per part/label resets the form when the selection changes.
  return <PartForm key={`${part.id}:${part.label ?? ''}`} part={part} />;
}

function PartForm({ part }: { part: ComponentInstance }) {
  const setLabel = useEditor((s) => s.setLabel);
  const setProps = useEditor((s) => s.setProps);
  const removeItems = useEditor((s) => s.removeItems);
  const [draft, setDraft] = useState(part.label ?? '');
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
          <button type="button" onClick={() => removeItems([part.id], [])}>
            Delete this part
          </button>
        </>
      )}
    </section>
  );
}

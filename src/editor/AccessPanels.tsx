/**
 * Ways to read and build a circuit without seeing or pointing at the canvas.
 *
 *  - CircuitDescription: a text list of every part (with its current value) and wire.
 *  - ConnectionsPanel:   "connect this output to that input" with two lists and a
 *    button, plus a Remove button for each wire. Together with the parts list (Enter adds
 *    a part) and the inspector (rename, delete), a whole circuit can be built with a
 *    keyboard or a screen reader.
 * (useEditorAnnouncements.ts tells screen reader users when a light changes.)
 */
import { useContext, useMemo, useState } from 'react';
import { announce } from '../a11y/announcer';
import { pinsOf } from '../sim';
import { describeCircuit, pinName } from './describe';
import { BlindContext, useEditor, useEditorStore } from './editorContext';

export function CircuitDescription() {
  const doc = useEditor((s) => s.doc);
  const values = useEditor((s) => s.values);
  const blind = useContext(BlindContext);
  const description = useMemo(
    () => describeCircuit(doc, values, { hideValues: blind }),
    [doc, values, blind],
  );
  return (
    <section className="panel" aria-labelledby="circuit-description-title">
      <details>
        <summary id="circuit-description-title">Circuit as text</summary>
        {doc.components.length === 0 ? (
          <p className="muted small">The canvas is empty.</p>
        ) : (
          <>
            <h3 className="sr-only">Parts</h3>
            <ul className="description-list" data-testid="description-parts">
              {description.parts.map((text, i) => (
                <li key={i}>{text}</li>
              ))}
            </ul>
            <h3 className="sr-only">Wires</h3>
            <ul className="description-list" data-testid="description-wires">
              {description.wires.map((w) => (
                <li key={w.id}>{w.text}</li>
              ))}
              {description.loose.map((text, i) => (
                <li key={`loose-${i}`}>{text}</li>
              ))}
            </ul>
          </>
        )}
      </details>
    </section>
  );
}

export function ConnectionsPanel() {
  const store = useEditorStore();
  const doc = useEditor((s) => s.doc);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const outputs = doc.components.flatMap((c) =>
    pinsOf(c.type, c.props).outputs.map((p) => ({
      value: `${c.id}.${p.id}`,
      label: pinName(doc, { component: c.id, pin: p.id }),
    })),
  );
  const inputs = doc.components.flatMap((c) =>
    pinsOf(c.type, c.props).inputs.map((p) => ({
      value: `${c.id}.${p.id}`,
      label: pinName(doc, { component: c.id, pin: p.id }),
    })),
  );
  const split = (v: string) => {
    const [component, pin] = v.split('.');
    return { component, pin };
  };

  const onConnect = () => {
    if (!from || !to) return;
    const a = split(from);
    const b = split(to);
    store.getState().connect({
      source: a.component,
      sourceHandle: a.pin,
      target: b.component,
      targetHandle: b.pin,
    });
    const { notice, doc: after } = store.getState();
    const made = after.wires.some(
      (w) =>
        w.from.component === a.component &&
        w.from.pin === a.pin &&
        w.to.component === b.component &&
        w.to.pin === b.pin,
    );
    announce(
      made
        ? `Connected ${pinName(after, a)} to ${pinName(after, b)}.`
        : (notice ?? 'Not connected.'),
    );
  };

  return (
    <section className="panel" aria-labelledby="connections-title">
      <details>
        <summary id="connections-title">Connections (keyboard)</summary>
        <div className="connect-form">
          <label className="field">
            <span>From output</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              data-testid="connect-from"
            >
              <option value="">— choose an output —</option>
              {outputs.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>To input</span>
            <select value={to} onChange={(e) => setTo(e.target.value)} data-testid="connect-to">
              <option value="">— choose an input —</option>
              {inputs.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onConnect}
            disabled={!from || !to}
            data-testid="connect-button"
          >
            Connect
          </button>
        </div>
        <h3 className="panel-title">Wires</h3>
        {doc.wires.length === 0 ? (
          <p className="muted small">No wires yet.</p>
        ) : (
          <ul className="wire-list">
            {doc.wires.map((w) => {
              const text = `${pinName(doc, w.from)} → ${pinName(doc, w.to)}`;
              return (
                <li key={w.id}>
                  <span>{text}</span>
                  <button
                    type="button"
                    aria-label={`Remove wire ${text}`}
                    onClick={() => {
                      store.getState().removeItems([], [w.id]);
                      announce(`Removed wire ${text}.`);
                    }}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </section>
  );
}

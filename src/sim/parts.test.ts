import { check } from './checker';
import { buildCircuit } from './circuit';
import { DIGIT_SEGMENTS, SEGMENTS } from './components';
import { parseCircuit, serializeCircuit } from './serialize';
import { computeTruthTable, findIO } from './truthTable';
import type { Bit } from './values';

/** One switch A wired to the given segments of display D; the rest unwired. */
const display = (segments: string) =>
  buildCircuit({
    parts: [
      { id: 'A', type: 'SWITCH' },
      { id: 'D', type: 'SEVEN_SEG' },
    ],
    wires: [...segments].map((s) => ['A', `D.${s}`] as [string, string]),
  });

describe('a seven-segment display', () => {
  it('gives one truth-table column per segment, in pin order', () => {
    const io = findIO(display('abcdefg'));
    expect(io.outputs.map((p) => p.label)).toEqual(SEGMENTS.map((s) => `D.${s}`));
    const result = computeTruthTable(display('bc'));
    expect(result.ok && result.table.rows[1].outputs).toEqual(['X', 1, 1, 'X', 'X', 'X', 'X']);
  });

  it('can be checked: "show 1 when A is on"', () => {
    const outputs = SEGMENTS.map((s) => `D.${s}`);
    const one = SEGMENTS.map((s): Bit => (DIGIT_SEGMENTS[1].includes(s) ? 1 : 0));
    const spec = {
      inputs: ['A'],
      outputs,
      expected: [
        { inputs: [0 as Bit], outputs: SEGMENTS.map((): Bit => 0) },
        { inputs: [1 as Bit], outputs: one },
      ],
    };
    // Segments not driven at all are X, so a display needs every segment wired.
    expect(check(display('bc'), spec).pass).toBe(false);
  });

  it('is reported once when missing, not once per segment', () => {
    const spec = {
      inputs: ['A'],
      outputs: SEGMENTS.map((s) => `D.${s}`),
      expected: [{ inputs: [0 as Bit], outputs: SEGMENTS.map((): Bit => 0) }],
    };
    const noDisplay = buildCircuit({ parts: [{ id: 'A', type: 'SWITCH' }] });
    const missing = check(noDisplay, spec).diagnostics.filter((d) => d.code === 'MISSING_IO');
    expect(missing.map((d) => d.message)).toEqual([
      'Your circuit needs a seven-segment display labeled "D".',
    ]);
  });

  it('never counts as a gate', () => {
    const spec = {
      inputs: ['A'],
      outputs: SEGMENTS.map((s) => `D.${s}`),
      expected: [{ inputs: [0 as Bit], outputs: SEGMENTS.map((): Bit => 0) }],
      constraints: { maxGates: 0 },
    };
    const codes = check(display('abcdefg'), spec).diagnostics.map((d) => d.code);
    expect(codes).not.toContain('TOO_MANY_GATES');
  });
});

describe('a push button', () => {
  it('is an input like a switch', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'P', type: 'PUSH_BUTTON' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [['P', 'Y']],
    });
    const result = computeTruthTable(doc);
    expect(result.ok && result.table.rows.map((r) => r.outputs[0])).toEqual([0, 1]);
  });
});

describe('light colors in files', () => {
  it('keeps a known color and drops an unknown one when loading', () => {
    const doc = buildCircuit({
      parts: [{ id: 'Y', type: 'LIGHT', props: { color: 'red' } }],
    });
    const loaded = parseCircuit(serializeCircuit(doc));
    expect(loaded.ok && loaded.doc.components[0].props).toEqual({ color: 'red' });
    const hostile = serializeCircuit(doc).replace('"red"', '"red evil-class"');
    const reloaded = parseCircuit(hostile);
    expect(reloaded.ok && reloaded.doc.components[0].props).toEqual({});
  });
});

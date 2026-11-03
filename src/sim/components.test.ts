import { allComponentDefs, getComponentDef, normalizeProps, pinsOf } from './registry';
import { DIGIT_SEGMENTS, digitShown, SEGMENTS } from './components';
import { X, type Value } from './values';

/** Full truth tables for every gate, rows 00, 01, 10, 11. */
const EXPECTED: Record<string, Value[]> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  NAND: [1, 1, 1, 0],
  NOR: [1, 0, 0, 0],
  XOR: [0, 1, 1, 0],
  XNOR: [1, 0, 0, 1],
};

const run = (type: string, inputs: Value[]) =>
  getComponentDef(type).evaluate(inputs, getComponentDef(type).defaultProps, undefined).outputs[0];

describe('gate truth tables', () => {
  for (const [type, column] of Object.entries(EXPECTED)) {
    it(`${type} matches its truth table`, () => {
      const rows: Value[][] = [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ];
      expect(rows.map((r) => run(type, r))).toEqual(column);
    });
  }

  it('NOT flips its input', () => {
    expect(run('NOT', [0])).toBe(1);
    expect(run('NOT', [1])).toBe(0);
    expect(run('NOT', [X])).toBe(X);
  });

  it('handles unknown (X) inputs the way real logic would', () => {
    expect(run('AND', [0, X])).toBe(0); // AND with a 0 is 0, whatever X is
    expect(run('AND', [1, X])).toBe(X);
    expect(run('OR', [1, X])).toBe(1);
    expect(run('OR', [0, X])).toBe(X);
    expect(run('NAND', [0, X])).toBe(1);
    expect(run('NOR', [1, X])).toBe(0);
    expect(run('XOR', [0, X])).toBe(X);
    expect(run('XNOR', [1, X])).toBe(X);
  });

  it('supports gates with 3 inputs', () => {
    const def = getComponentDef('AND');
    expect(def.pins({ inputs: 3 }).inputs.map((p) => p.id)).toEqual(['in0', 'in1', 'in2']);
    expect(def.evaluate([1, 1, 0], { inputs: 3 }, undefined).outputs[0]).toBe(0);
  });
});

describe('registry', () => {
  it('registers the eleven parts', () => {
    expect(
      allComponentDefs()
        .map((d) => d.type)
        .sort(),
    ).toEqual(
      [
        'AND',
        'LIGHT',
        'NAND',
        'NOR',
        'NOT',
        'OR',
        'PUSH_BUTTON',
        'SEVEN_SEG',
        'SWITCH',
        'XNOR',
        'XOR',
      ].sort(),
    );
  });

  it('marks push buttons as inputs and displays as outputs', () => {
    expect(getComponentDef('PUSH_BUTTON').io).toBe('input');
    expect(getComponentDef('SEVEN_SEG').io).toBe('output');
    expect(pinsOf('SEVEN_SEG').inputs.map((p) => p.id)).toEqual([...SEGMENTS]);
  });

  it('keeps only known light colors', () => {
    expect(normalizeProps('LIGHT', { color: 'red' })).toEqual({ color: 'red' });
    expect(normalizeProps('LIGHT', { color: 'x" onclick="evil' })).toEqual({});
    expect(normalizeProps('LIGHT', {})).toEqual({});
    expect(normalizeProps('AND', { inputs: 3 })).toEqual({ inputs: 3 });
  });

  it('says which digit a display shows', () => {
    const show = (lit: string) => SEGMENTS.map((s) => (lit.includes(s) ? 1 : 0));
    DIGIT_SEGMENTS.forEach((lit, digit) => expect(digitShown(show(lit))).toBe(digit));
    expect(digitShown(show('cdefg'))).toBe(6); // a 6 without its top bar
    expect(digitShown(show('ae'))).toBeUndefined();
    expect(digitShown(['X', 1, 1, 1, 1, 1, 1])).toBeUndefined();
  });

  it('marks switches as inputs and lights as outputs', () => {
    expect(getComponentDef('SWITCH').io).toBe('input');
    expect(getComponentDef('LIGHT').io).toBe('output');
    expect(getComponentDef('AND').io).toBeUndefined();
  });
});

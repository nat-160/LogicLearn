import { wirePath } from './wirePath';

describe('wirePath', () => {
  it('draws a straight wire when the pins line up', () => {
    expect(wirePath(0, 20, 100, 20)).toBe('M0,20 H100');
  });

  it('turns at the midpoint and never curves more than the space allows', () => {
    // 4px jog: corners can be at most 2px, or the wire would loop back (a squiggle).
    const path = wirePath(0, 20, 100, 24);
    expect(path).toBe('M0,20 H48 Q50,20 50,22 V22 Q50,24 52,24 H100');
  });

  it('keeps corners inside a short horizontal gap', () => {
    // 12px gap: corner radius is limited to 12 / 4 = 3px.
    expect(wirePath(0, 0, 12, 40)).toContain('H3');
  });
});

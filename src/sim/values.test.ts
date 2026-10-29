import { allInputRows, and, not, or, rowBits, rowNumber, X, xor } from './values';

describe('three-valued logic', () => {
  it('AND is 0 if any input is 0, even with unknowns', () => {
    expect(and([0, X])).toBe(0);
    expect(and([1, X])).toBe(X);
    expect(and([1, 1])).toBe(1);
  });

  it('OR is 1 if any input is 1, even with unknowns', () => {
    expect(or([1, X])).toBe(1);
    expect(or([0, X])).toBe(X);
    expect(or([0, 0])).toBe(0);
  });

  it('NOT keeps X as X', () => {
    expect(not(0)).toBe(1);
    expect(not(1)).toBe(0);
    expect(not(X)).toBe(X);
  });

  it('XOR is X whenever any input is X', () => {
    expect(xor([1, X])).toBe(X);
    expect(xor([1, 0])).toBe(1);
    expect(xor([1, 1, 1])).toBe(1);
  });
});

describe('truth table rows', () => {
  it('lists rows in binary counting order, all zeros first', () => {
    expect(allInputRows(2)).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]);
    expect(allInputRows(0)).toEqual([[]]);
  });

  it('converts between row numbers and bits', () => {
    expect(rowBits(5, 3)).toEqual([1, 0, 1]);
    expect(rowNumber([1, 0, 1])).toBe(5);
  });
});

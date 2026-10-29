/**
 * Signal values and three-valued ("Kleene") logic.
 *
 * Every wire carries one of three values:
 *   0   – off / false
 *   1   – on / true
 *   'X' – unknown: the wire is not connected to anything yet, or the value has not
 *         been worked out (e.g. inside a loop). The editor draws X wires gray and dashed,
 *         which teaches students to look for loose connections.
 *
 * The rules below are the standard ones: a gate's output is only X when the unknown
 * input could actually change the answer. For example AND(0, X) is 0 – whatever X is,
 * the AND cannot be on – but AND(1, X) is X.
 */

/** A definite bit, as set by a switch or written in a truth table. */
export type Bit = 0 | 1;

/** What a wire can carry while the circuit runs. */
export type Value = Bit | 'X';

export const X = 'X' as const;

/** AND: 0 if any input is 0; otherwise X if any input is X; otherwise 1. */
export function and(inputs: readonly Value[]): Value {
  if (inputs.includes(0)) return 0;
  if (inputs.includes(X)) return X;
  return 1;
}

/** OR: 1 if any input is 1; otherwise X if any input is X; otherwise 0. */
export function or(inputs: readonly Value[]): Value {
  if (inputs.includes(1)) return 1;
  if (inputs.includes(X)) return X;
  return 0;
}

/** NOT: flips 0 and 1; X stays X. */
export function not(value: Value): Value {
  if (value === X) return X;
  return value === 1 ? 0 : 1;
}

/** XOR: 1 when an odd number of inputs are 1. Any X input makes the result X. */
export function xor(inputs: readonly Value[]): Value {
  if (inputs.includes(X)) return X;
  return (inputs.filter((v) => v === 1).length % 2) as Bit;
}

export function isBit(value: unknown): value is Bit {
  return value === 0 || value === 1;
}

/**
 * The input combinations of a truth table, in binary counting order.
 * The first input is the most significant bit, so for inputs A, B the rows are
 * 00, 01, 10, 11 – the all-zeros row always comes first.
 */
export function allInputRows(inputCount: number): Bit[][] {
  const rows: Bit[][] = [];
  for (let n = 0; n < 2 ** inputCount; n++) {
    rows.push(rowBits(n, inputCount));
  }
  return rows;
}

/** Row number `n` of a truth table with `inputCount` inputs, as bits (MSB first). */
export function rowBits(n: number, inputCount: number): Bit[] {
  const bits: Bit[] = [];
  for (let i = inputCount - 1; i >= 0; i--) {
    bits.push(((n >> i) & 1) as Bit);
  }
  return bits;
}

/** The row number of a combination of bits (inverse of `rowBits`). */
export function rowNumber(bits: readonly Bit[]): number {
  return bits.reduce<number>((n, bit) => n * 2 + bit, 0);
}

import {
  CODE_ALPHABET,
  completionCode,
  dayNumber,
  dayToDate,
  isTeacherCode,
  lessonForUnlockCode,
  normalizeCode,
  readCompletionCode,
  unlockCode,
} from './codes';

describe('codes', () => {
  it('tidy up what was typed', () => {
    expect(normalizeCode(' ll-3f9k qx2m-ab ')).toBe('LL3F9KQX2MAB');
  });

  it('turn away a wrong teacher code', async () => {
    expect(await isTeacherCode('TEACH-WRONG1')).toBe(false);
    expect(await isTeacherCode('')).toBe(false);
  });

  it('give each lesson its own 6-character unlock code, and recognize it', async () => {
    const a = await unlockCode('or-xor');
    const b = await unlockCode('nand-nor');
    expect(a).toMatch(new RegExp(`^[${CODE_ALPHABET}]{6}$`));
    expect(a).not.toBe(b);
    expect(await unlockCode('or-xor')).toBe(a); // the same every time
    expect(await lessonForUnlockCode(a.toLowerCase(), ['nand-nor', 'or-xor'])).toBe('or-xor');
    expect(await lessonForUnlockCode('AAAAAA', ['nand-nor', 'or-xor'])).toBeUndefined();
  });

  it('round-trip a completion code', async () => {
    const day = dayNumber(new Date(Date.UTC(2026, 10, 30)));
    const code = await completionCode({ finished: [0, 2, 3, 7, 15], day });
    expect(code).toMatch(/^LL-[0-9A-Z]{6}-[0-9A-Z]{4}$/);
    expect(await readCompletionCode(code)).toEqual({ finished: [0, 2, 3, 7, 15], day });
    expect(dayToDate(day).toISOString().slice(0, 10)).toBe('2026-11-30');
  });

  it('notice a completion code that was changed or mistyped', async () => {
    const code = await completionCode({ finished: [1, 2], day: 300 });
    const payload = code.slice(3, 9);
    const swapped = payload[0] === '2' ? '3' : '2';
    const changed = `LL-${swapped}${payload.slice(1)}-${code.slice(10)}`;
    expect(await readCompletionCode(changed)).toBeNull();
    expect(await readCompletionCode('LL-12345')).toBeNull();
    expect(await readCompletionCode('hello')).toBeNull();
  });
});

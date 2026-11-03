import { findLesson } from './catalog';
import { findPractice, practiceReturnIndex } from './practice';
import type { ProgressMap } from './progress';

const orXor = findLesson('or-xor', 'en-US')!;
const done = (...ids: string[]): ProgressMap =>
  Object.fromEntries(
    ids.map((id) => [
      `or-xor/${id}`,
      { done: true, attempts: 1, hintsUsed: 0, triedRows: [], firstSeen: '', lastSeen: '' },
    ]),
  );

describe('practice steps', () => {
  it('are offered for a matching mistake, or after three failed checks', () => {
    expect(findPractice(orXor, 'build-xor', 'xor-as-or', 1)?.practiceId).toBe('both-on');
    expect(findPractice(orXor, 'build-xor', 'missed-all-zeros', 1)).toBeUndefined();
    expect(findPractice(orXor, 'build-xor', undefined, 3)?.practiceId).toBe('both-on');
    // Only from the steps that list it.
    expect(findPractice(orXor, 'build-or', 'xor-as-or', 5)).toBeUndefined();
  });

  it('lead back to the first step that offers them and is not done yet', () => {
    const practice = orXor.practice[0];
    const index = (id: string) => orXor.steps.findIndex((s) => s.id === id);
    expect(practiceReturnIndex(orXor, practice, {})).toBe(index('build-xor'));
    expect(practiceReturnIndex(orXor, practice, done('build-xor'))).toBe(index('exactly-one'));
    expect(practiceReturnIndex(orXor, practice, done('build-xor', 'exactly-one'))).toBe(
      index('build-xor'),
    );
  });

  it('keep their progress apart from the numbered steps', () => {
    expect(orXor.practice[0].id).toBe('practice-both-on');
    expect(orXor.steps.map((s) => s.id)).not.toContain('practice-both-on');
  });
});

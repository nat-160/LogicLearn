/**
 * "Have a code from your teacher?" on a locked lesson card: a teacher can let a student
 * skip ahead by giving them that lesson's unlock code (codes.ts; the teacher view lists
 * them). The code is checked in this browser; an opened lesson stays open.
 */
import { useId, useState } from 'react';
import { announce } from '../a11y/announcer';
import { canUseCodes, lessonForUnlockCode } from './codes';
import { useUnlocked } from './gating';

export function UnlockCodeForm({ lessonId, name }: { lessonId: string; name: string }) {
  const unlock = useUnlocked((s) => s.unlock);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const id = useId();
  if (!canUseCodes()) return null; // codes need a secure page (codes.ts)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((await lessonForUnlockCode(code, [lessonId])) === lessonId) {
      unlock(lessonId);
      announce(`${name} is open.`);
    } else {
      const text = "That code doesn't open this lesson. Check it with your teacher.";
      setMessage(text);
      announce(text);
    }
  };

  return (
    <details className="unlock-code">
      <summary>Have a code from your teacher?</summary>
      <form onSubmit={onSubmit}>
        <label htmlFor={id}>Unlock code for {name}</label>
        <input
          id={id}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          maxLength={12}
          data-testid={`unlock-code-${lessonId}`}
        />
        <button type="submit">Open {name}</button>
        {message && <p className="small">{message}</p>}
      </form>
    </details>
  );
}

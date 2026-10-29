// @vitest-environment jsdom
import { halfAdder } from '../sim/testCircuits';
import { decodeShareData, encodeShareData, loadSandbox, saveSandbox, storageKey } from './storage';

describe('storageKey', () => {
  it('uses the live site prefix from .env (the test version uses .env.dev-branch)', () => {
    expect(storageKey('progress:v1')).toBe('logiclearn:progress:v1');
  });
});

describe('share links', () => {
  it('round-trip a circuit', () => {
    const doc = halfAdder();
    expect(decodeShareData(encodeShareData(doc))).toEqual({ ok: true, doc });
  });

  it('give a friendly error for a broken link instead of crashing', () => {
    const result = decodeShareData('not-really-a-circuit');
    expect(result.ok).toBe(false);
  });
});

describe('sandbox autosave', () => {
  beforeEach(() => localStorage.clear());

  it('saves and restores the sandbox', () => {
    saveSandbox(halfAdder());
    expect(loadSandbox()).toEqual(halfAdder());
  });

  it('ignores a corrupted save', () => {
    localStorage.setItem('logiclearn:sandbox:v1', '{oops');
    expect(loadSandbox()).toBeNull();
  });
});

// @vitest-environment jsdom
import { markdownToSpeech } from './plainText';
import { pickVoice, splitIntoChunks } from './speech';

const voice = (voiceURI: string, lang: string, localService: boolean) => ({
  voiceURI,
  lang,
  localService,
});

describe('pickVoice', () => {
  const voices = [
    voice('google-us', 'en-US', false),
    voice('local-gb', 'en-GB', true),
    voice('local-us', 'en-US', true),
    voice('local-es', 'es-US', true),
  ];

  it("uses the student's choice when it exists", () => {
    expect(pickVoice(voices, 'en-US', 'google-us')?.voiceURI).toBe('google-us');
  });

  it('otherwise prefers an on-device voice for the exact language', () => {
    expect(pickVoice(voices, 'en-US', null)?.voiceURI).toBe('local-us');
    expect(pickVoice(voices, 'en-US', 'gone')?.voiceURI).toBe('local-us');
  });

  it('falls back to the same language, then to nothing (the browser default)', () => {
    expect(pickVoice(voices, 'en-AU', null)?.voiceURI).toBe('local-gb');
    expect(pickVoice(voices, 'fr-FR', null)).toBeUndefined();
  });
});

describe('splitIntoChunks', () => {
  it('keeps short text whole and splits long text between sentences', () => {
    expect(splitIntoChunks('One. Two.')).toEqual(['One. Two.']);
    const long = Array.from({ length: 20 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const chunks = splitIntoChunks(long, 100);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 100)).toBe(true);
    expect(chunks.join(' ')).toBe(long);
  });
});

describe('markdownToSpeech', () => {
  it('turns lists and tables into sentences with pauses', () => {
    const md =
      '- Switches are **inputs**\n- Lights are outputs\n\n| A | NOT A |\n|---|---|\n| 0 | 1 |';
    expect(markdownToSpeech(md)).toBe('Switches are inputs. Lights are outputs. A, NOT A. 0, 1.');
  });

  it('reads nested lists once', () => {
    expect(markdownToSpeech('- Outer\n  - Inner')).toBe('Outer. Inner.');
  });
});

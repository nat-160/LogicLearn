// Lists lesson text files that still contain placeholder (draft) text, and – for each
// language other than en-US – the files that haven't been translated yet, and translated
// steps whose number of hints differs from en-US.
// A file is a draft while its first line is <!-- draft -->. Delete that line when the
// final text is written. (The patterns match src/lessons/types.ts.)
//
//   npm run lessons:drafts
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DRAFT = /^<!--\s*draft\s*-->/i;
const HINTS = /<!--\s*hints\s*-->/i;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+/;
const DEFAULT_LOCALE = 'en-US';
const root = new URL('../src/lessons/content/', import.meta.url).pathname;
const dirs = (path) => readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory());
const hintCount = (text) => {
  const marker = HINTS.exec(text);
  if (!marker) return 0;
  return text
    .slice(marker.index)
    .split('\n')
    .filter((line) => LIST_ITEM.test(line)).length;
};

let drafts = 0;
let missing = 0;
let hintMismatches = 0;
for (const lesson of dirs(root)) {
  const locales = dirs(join(root, lesson));
  const english = existsSync(join(root, lesson, DEFAULT_LOCALE))
    ? readdirSync(join(root, lesson, DEFAULT_LOCALE)).filter((f) => f.endsWith('.md'))
    : [];
  for (const locale of locales) {
    const folder = join(root, lesson, locale);
    for (const file of readdirSync(folder).filter((f) => f.endsWith('.md'))) {
      const text = readFileSync(join(folder, file), 'utf8');
      if (DRAFT.test(text.trim())) {
        console.log(`draft      ${lesson}/${locale}/${file}`);
        drafts++;
      }
      if (locale !== DEFAULT_LOCALE && english.includes(file)) {
        const expected = hintCount(readFileSync(join(root, lesson, DEFAULT_LOCALE, file), 'utf8'));
        if (hintCount(text) !== expected) {
          console.log(`hints      ${lesson}/${locale}/${file} (en-US has ${expected})`);
          hintMismatches++;
        }
      }
    }
    if (locale === DEFAULT_LOCALE) continue;
    for (const file of english.filter((f) => !existsSync(join(folder, f)))) {
      console.log(`untranslated ${lesson}/${locale}/${file} (shows the en-US text)`);
      missing++;
    }
  }
}
console.log(
  `\n${drafts} draft file(s), ${missing} untranslated file(s), ${hintMismatches} with a different number of hints.`,
);

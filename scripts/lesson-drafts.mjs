// Lists lesson text files that still contain placeholder (draft) text, and – for each
// language other than en-US – the files that haven't been translated yet.
// A file is a draft while its first line is <!-- draft -->. Delete that line when the
// final text is written.
//
//   npm run lessons:drafts
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MARKER = '<!-- draft -->';
const DEFAULT_LOCALE = 'en-US';
const root = new URL('../src/lessons/content/', import.meta.url).pathname;
const dirs = (path) => readdirSync(path).filter((name) => statSync(join(path, name)).isDirectory());

let drafts = 0;
let missing = 0;
for (const lesson of dirs(root)) {
  const locales = dirs(join(root, lesson));
  const english = existsSync(join(root, lesson, DEFAULT_LOCALE))
    ? readdirSync(join(root, lesson, DEFAULT_LOCALE)).filter((f) => f.endsWith('.md'))
    : [];
  for (const locale of locales) {
    const folder = join(root, lesson, locale);
    for (const file of readdirSync(folder).filter((f) => f.endsWith('.md'))) {
      if (readFileSync(join(folder, file), 'utf8').trimStart().startsWith(MARKER)) {
        console.log(`draft      ${lesson}/${locale}/${file}`);
        drafts++;
      }
    }
    if (locale === DEFAULT_LOCALE) continue;
    for (const file of english.filter((f) => !existsSync(join(folder, f)))) {
      console.log(`untranslated ${lesson}/${locale}/${file} (shows the en-US text)`);
      missing++;
    }
  }
}
console.log(`\n${drafts} draft file(s), ${missing} untranslated file(s).`);

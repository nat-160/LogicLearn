// Lists lesson text files that still contain placeholder (draft) text.
// A file is a draft while its first line is <!-- draft -->. Delete that line when the
// final text is written.
//
//   npm run lessons:drafts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const MARKER = '<!-- draft -->';
const root = new URL('../src/lessons/content/', import.meta.url).pathname;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(root).filter((f) => f.endsWith('.md'));
const drafts = files.filter((f) => readFileSync(f, 'utf8').trimStart().startsWith(MARKER));

console.log(`${drafts.length} of ${files.length} lesson text files are drafts:`);
for (const f of drafts) console.log(`  ${relative(root, f)}`);

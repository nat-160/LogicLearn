# Translating the lessons

Lessons ship in US English (`en-US`). The text is kept separate from the code, so a new
language can be added by translating files and registering it once. The design is in
`PROJECT_PLAN.md` §3.10.

## Where the text lives

```
src/lessons/content/
  not-and/                  one folder per lesson
    index.ts                circuits, checks, parts lists – the same in every language
    en-US/                  one folder per language
      lesson.md             # Lesson title, then a one-sentence summary
      what-is-a-gate.md     one file per step, named by the step's id
      build-not.md
      …
  unit-1-project/
    en-US/
      lesson.md, brief.md, build.md
      door-alarm.md         a project also has one file per brief, named by its id
      voting.md
  or-xor/en-US/
      practice-both-on.md   a practice step: "practice-" and the practice's id
  _shared/                  text used by many lessons
    en-US/
      unit-1.md             a unit's title and summary
      gate-AND.md           the gate reminder card: one file per gate
      misconception-xor-as-or.md   feedback for a recognized mistake
      nudge-untried-rows.md, nudge-stuck.md, predict-reveal.md
```

Some shared files contain placeholders in braces, such as `{output}`, `{input}` or
`{tried}`. Keep them exactly as they are (don't translate the word inside the braces):
the app fills them in. `npm test` checks that each file only uses the placeholders it is
given.

A step file looks like this:

```markdown
<!-- draft -->            ← delete this line when the text is final

# Build it: NOT ← the step's title

The step's text, in Markdown: lists, **bold**, tables…

<!-- hints -->            ← optional: the hints, one bullet each

- First hint
- Second hint
```

The `<!-- draft -->` and `<!-- hints -->` markers are HTML comments, so they stay in
English in every language. Don't translate them. Hints can be a bulleted or a numbered
list. Each translated step needs as many hints as the English one (`npm test` checks this
for every language in `locales.ts`).

## Adding a language (example: US Spanish, `es-US`)

1. For each lesson, copy the `en-US` folder to `es-US` (the folder name is the language
   code).
2. Translate the text in each file. Keep the file names and the two markers as they are.
3. Add the language to `src/i18n/locales.ts`:

   ```ts
   export const LOCALES: Locale[] = [
     { code: 'en-US', name: 'English (US)' },
     { code: 'es-US', name: 'Español (EE. UU.)' },
   ];
   ```

   A **Lesson language** picker then appears in ⚙ Accessibility. Students whose browser
   is set to Spanish get Spanish by default.

4. Run `npm run lessons:drafts` to see which files are still drafts, not yet translated,
   or have a different number of hints. Run `npm test` to check that every file belongs
   to a real step.

A step that hasn't been translated yet shows its English text, so a half-finished
translation never leaves a step empty. This also applies to a file that exists but has no
text yet, such as one holding only `<!-- draft -->`.

The page's `lang` is the interface language, which is English until the interface is
translated. Lesson text in another language is marked with its own `lang` (for example
`lang="es-US"`), so screen readers and narration switch to a Spanish voice just for the
lesson text.

## Not translated yet

- Interface text (buttons, messages, the project checklist), and the checker's other
  explanations, are still English. They are identified by stable codes (`MISSING_IO`, `xor-as-or`, …), so
  they can move into per-language message files later.
- Labels inside circuits (A, B, Y) stay as they are.

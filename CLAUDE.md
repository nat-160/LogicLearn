# LogicLearn — notes for Claude Code sessions

A browser-based logic-circuit editor with a scaffolded high-school curriculum (CS6460
project). The plan and its reasoning are in `docs/PROJECT_PLAN.md`; the lesson sequence
is in `docs/curriculum-outline.md`. Read the plan's §3 before changing architecture.

## Commands

```bash
npm run dev            # local dev server
npm test               # unit tests (Vitest)
npm run e2e            # end-to-end tests (Playwright; builds + serves the app itself)
npm run build:dev      # build the test version (dev branch settings, .env.dev-branch)
npm run lint           # ESLint
npm run typecheck      # tsc -b (three projects: sim, app, node)
npm run format         # Prettier
npm run lessons:drafts # lesson text files still marked as drafts
```

Before pushing: `npm run lint && npm run typecheck && npm test && npm run e2e`.

## Architecture rules

- **`src/sim` is framework-free.** No React, React Flow, zustand, DOM or UI imports.
  Enforced by `tsconfig.sim.json` (no DOM lib) and an ESLint rule. Everything in and out
  of `src/sim` is plain, serializable data.
- **The `CircuitDoc` is the source of truth** for a design. Edits are pure functions in
  `src/sim/circuit.ts` that return a new doc. Simulation values are never stored in it.
- **New parts go in the registry** (`src/sim/components.ts`) with their `io` role if they
  are inputs/outputs, plus geometry + drawing in `src/editor`. The simulator, truth table
  and checker must not need changes for a new part. An output part may have several input
  pins (the seven-segment display): each pin becomes its own truth-table column, labelled
  `<label>.<pin>` (`D.a` … `D.g`). Props from files go through the part's `normalizeProps`.
- **Loaded data is untrusted.** Files, share links and localStorage go through
  `parseCircuit`/`loadCircuit`, which rebuild the doc from checked fields.
- **Editor state** lives in one zustand store per editor (`src/editor/store.ts`). Design
  changes go through `commit()` (undo history + re-simulate + autosave callback).
- **Every action needs a tap alternative** (tablets have no keyboard, no hover, no right
  click). Pins are 36px touch targets; keep `minZoom` so they stay ≥ 24px.
- **Nothing leaves the device** unless the student downloads a file or copies a link.
  No accounts, no analytics, no network calls (fonts are self-hosted).

## Accessibility (see docs/accessibility.md)

- **Colors only from theme tokens** in `src/styles/themes.css` (four themes: light, dark,
  and their high-contrast versions). Never hard-code a color in `app.css` or a component.
- Never use color as the only cue. Announce changes with `announce()` (`src/a11y/`), not
  new `aria-live` regions or `role="alert"`. Control names must include their visible text.
- The theme is applied twice: early by the inline script in `index.html`, then by
  `src/settings/display.ts`. Keep the two in step (same storage key).
- Every pointer action needs a keyboard path (wiring: "View and edit connections",
  `ConnectionsPanel` in `src/editor/AccessPanels.tsx`).
- `e2e/accessibility.spec.ts` runs axe-core in every theme; keep it passing.

## Lessons

- A lesson is `src/lessons/content/<lesson>/index.ts` (circuits, checks, parts lists –
  no words) plus a folder per language, `<lesson>/en-US/`, with `lesson.md` (title +
  summary) and one `<step-id>.md` per step (title, text, `<!-- hints -->` list). A project
  step also has one `<brief-id>.md` per brief. Register the lesson in
  `src/lessons/catalog.ts`, in course order (gating opens lessons in that order).
  Translations: `docs/translating.md`.
- Step kinds (`src/lessons/types.ts`): `explain`, `guided`, `challenge`, `predict` (fill
  in a circuit's truth table first) and `project` (briefs, the student's own rule, the
  grader's checklist – `src/sim/grader.ts`). Each has its own view in `src/lessons/`.
- Practice steps (`practice` in a `LessonDef`) are build or predict steps outside the
  numbered steps, offered after a matching mistake (`for`) on the steps in `from`. Their
  text is `<locale>/practice-<id>.md`; they never count towards finishing a lesson.
- Text used by many lessons (unit titles, the gate reminder, misconception feedback,
  nudges) is in `src/lessons/content/_shared/<locale>/`. A new misconception id needs a
  `misconception-<id>.md` there (a content test checks it).
- The course author writes the final lesson text. Placeholder text is short bullet points
  and starts with `<!-- draft -->`; remove that line when the real text is in.
- Every guided/challenge step needs a reference `solution`, and every project brief an
  `example` rule and circuit. `src/lessons/lessons.test.ts` checks that each solution
  passes, each starter fails, and spec labels are in truth-table order.
- Don't rename a published lesson, step or brief `id`: saved progress and work are keyed
  by them. Changing a step's locked starter parts (their ids, types or labels) discards
  students' saved circuits for that step (`starterFingerprint` in `stepWork.ts`).

## Conventions

- Comments explain _why_ in plain language (the code is shown in milestone videos).
  Each module starts with a short header comment saying what it is for.
- Simulation changes need unit tests; UI flows get Playwright tests using `data-testid`
  and accessible names. E2E helpers in `e2e/helpers.ts` click or tap per project.
- Do not copy code or assets from Logisim, Logisim-evolution or Digital (GPL).
- **Branches** (`docs/branches.md`): `main` is the live site and `dev` the test version
  (…/LogicLearn/dev/). Work on a feature branch and open pull requests **into `dev`**;
  releases are pull requests from `dev` into `main`. Every deploy publishes both.
- Save in the browser only through `storageKey()` names (`src/storage/storage.ts`): the
  test version uses its own prefix (`.env.dev-branch`), so it never touches live data.

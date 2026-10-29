# LogicLearn — notes for Claude Code sessions

A browser-based logic-circuit editor with a scaffolded high-school curriculum (CS6460
project). The plan and its reasoning are in `docs/PROJECT_PLAN.md`; the lesson sequence
is in `docs/curriculum-outline.md`. Read the plan's §3 before changing architecture.

## Commands

```bash
npm run dev            # local dev server
npm test               # unit tests (Vitest)
npm run e2e            # end-to-end tests (Playwright; builds + serves the app itself)
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
  and checker must not need changes for a new part.
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
  new `aria-live` regions. Control names must include their visible text.
- Every pointer action needs a keyboard path (wiring: the Connections panel).
- `e2e/accessibility.spec.ts` runs axe-core in every theme; keep it passing.

## Lessons

- A lesson is `src/lessons/content/<lesson>/index.ts` (circuits, checks, parts lists –
  no words) plus a folder per language, `<lesson>/en-US/`, with `lesson.md` (title +
  summary) and one `<step-id>.md` per step (title, text, `<!-- hints -->` list). Register
  the lesson in `src/lessons/catalog.ts`. Translations: `docs/translating.md`.
- The course author writes the final lesson text. Placeholder text is short bullet points
  and starts with `<!-- draft -->`; remove that line when the real text is in.
- Every guided/challenge step needs a reference `solution`. `src/lessons/lessons.test.ts`
  checks that each solution passes and each starter fails.
- Don't rename a published step `id`: saved progress is keyed by it.

## Conventions

- Comments explain _why_ in plain language (the code is shown in milestone videos).
  Each module starts with a short header comment saying what it is for.
- Simulation changes need unit tests; UI flows get Playwright tests using `data-testid`
  and accessible names. E2E helpers in `e2e/helpers.ts` click or tap per project.
- Do not copy code or assets from Logisim, Logisim-evolution or Digital (GPL).
- `main` deploys to GitHub Pages via `.github/workflows/ci.yml`; develop on a branch.

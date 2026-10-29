# LogicLearn

Learn the logic inside computers by building it. LogicLearn is a browser-based
logic-circuit editor with guided lessons for high school students, inspired by Logisim.
It runs on Chromebooks, tablets and laptops with no install and no account.

**Live site:** https://nat-160.github.io/LogicLearn/ (deployed from `main`)

**Test version:** https://nat-160.github.io/LogicLearn/dev/ (deployed from `dev`; see
[docs/branches.md](docs/branches.md))

## What's in Phase 1

- **Editor** – drag or tap gates (AND, OR, NOT, NAND, NOR, XOR, XNOR), switches and lights
  onto the canvas; connect pins by dragging or by tapping one pin and then another; undo
  and redo; wires and lights show 1 / 0 / unknown live.
- **Truth table** – updates as you build; the row for the current switches is highlighted;
  tap a row to try it; ✓ marks show which rows you have actually tested.
- **Checker** – compares a circuit with a target on every row, marks the wrong rows, and
  recognizes common mistakes (e.g. OR instead of XOR, XOR instead of "not both") from
  research on student misconceptions (Herman et al., ICER '08).
- **Lessons** – step-by-step lessons with locked starter parts, a limited parts list,
  hints, steps that unlock in order, and "predict first" challenges. Phase 1 ships one
  demo lesson: _NOT and AND_.
- **Saving and sharing** – the sandbox saves itself in the browser; save/open circuit
  files; share links that open a copy. Nothing is sent to a server.
- **Accessibility** – high-contrast and dark themes (four in all), a dyslexia-friendly
  font, built-in narration, screen reader support, and building circuits with the
  keyboard alone. Preferences are saved on the device. See
  [docs/accessibility.md](docs/accessibility.md).
- **Ready for translation** – lesson text is organized by language (`en-US` now). See
  [docs/translating.md](docs/translating.md).

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests
npm run e2e        # end-to-end tests (Playwright)
```

## How it is built

```
src/sim/       the simulation core: circuit model, parts, simulator, truth tables, checker
src/editor/    the canvas (React Flow), palette, toolbar, truth table and check panels
src/lessons/   lesson framework, progress, and lesson content (content/<lesson>/)
src/storage/   localStorage, files and share links
src/app/       pages and routing
e2e/           Playwright tests (mouse and touch)
docs/          project plan, curriculum outline, architecture and demo notes
```

Phase 1 status: [docs/phase-1-report.md](docs/phase-1-report.md). See [docs/architecture.md](docs/architecture.md) for how a switch flip becomes a lit
light, and [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the full plan.

TypeScript, React, React Flow, zustand, Vite, Vitest and Playwright. Deployed to GitHub
Pages by GitHub Actions on every push to `main` (the live site) or `dev` (the test
version). Changes go through `dev` first: [docs/branches.md](docs/branches.md).

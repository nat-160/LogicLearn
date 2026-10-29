# Project Plan: Web-Based Logic Circuit Learning Platform

> Status: **Draft for review**, drafted 2026-10-29 from the approved project proposal.
> Scope: a detailed plan for **Phase 1**, plus a roadmap for later phases. Phase 1 includes
> design "seams" so that later phases add to the code rather than rewrite it.

---

## 1. Summary

The proposal describes a Logisim-inspired, browser-native editor for logic circuits, with a
scaffolded high school curriculum built on top: guided lessons, automatically checked
challenges, remediation, open projects and teacher materials. It must run on locked-down
Chromebooks and iPads, and it is hosted on GitHub Pages.

Phase 1 delivers the **foundation**:

1. A pure-TypeScript **simulation engine** with no dependency on React.
2. A touch-friendly **drag-and-drop editor**.
3. A **truth-table generator** and an **automatic checker** that returns structured results.
4. A **lesson framework** skeleton with one end-to-end demo lesson.
5. A **draft scaffolded lesson plan** (curriculum outline).
6. CI and automatic deployment to GitHub Pages.

Together these cover the proposal's Oct 19 and Oct 26 timeline items, which have to be done
together because the repository currently holds only a README.

### Decisions confirmed with the author

| Topic | Decision |
|---|---|
| Starting point | Start fresh in this repo (no prior prototype code). |
| Wire model | **Port-to-port now, routing later.** Wires connect an output pin to an input pin. The data model keeps an optional `waypoints` field so drawn routing can be added later without a migration. |
| Data / backend | **Static, no accounts.** Everything stays in the browser (localStorage). Sharing is by file or link. No student data is ever collected. |
| Devices | **Touch and mouse are both first-class from day one** (Chromebook + iPad). |

---

## 2. Research notes: existing tools, and what we take from them

| Tool | What it is | Takeaway for this project |
|---|---|---|
| **Logisim / Logisim-evolution** (Java desktop); **logisim.app** (web port) | The classic teaching simulator. Each bit can be 0, 1, unknown or error. It reports oscillation after a fixed number of iterations rather than truly detecting a loop. | Reuse the value model (0/1/X now, E reserved) and the iteration-cap approach to oscillation. Both are GPL, so **do not copy code or assets**. |
| **Digital** (hneemann, Java, GPL-3) | Educational simulator with **built-in test cases** that check a circuit's outputs for given inputs. Event-driven with one shared gate delay, a "switch-on" settling phase, oscillation detection and single-step tracing. | Model for our checker (declarative input→output specs). The single-step tracer is a good later-phase teaching feature ("watch the signal propagate"). |
| **CircuitVerse** (web, MIT) | Browser-based. Teacher groups and assignments with deadlines and grading, subcircuits, multi-bit wires, and an Interactive Book with embedded circuits and quizzes. | **The closest existing competitor, and the proposal does not mention it.** Reviewers are likely to ask "why not CircuitVerse?" Our differentiators: **no accounts** (no student data), a **high-school-level scaffolded path** where each guided step is **checked automatically** and sends students to **remediation** when they fail, and **built-in teacher materials**. CircuitVerse's content is college-level (it draws on Mano's *Digital Design*). |
| **NandGame** (web) | Puzzle levels. You build a circuit, toggle its inputs, then submit it for a check. Finished levels become reusable parts. | Proves the "submit and auto-check" loop is engaging. "Completed circuits become components" is a strong later feature (subcircuits). As the proposal notes, it has no free-form projects. |
| **Nand2Tetris** | A college course based on an HDL, not on a visual editor. | Out of our audience's range. A good source for sequencing ideas. |
| **Digital Logic Sim** (Sebastian Lague, desktop) | Start from NAND, build custom chips in layers. | Its community repeatedly asks for **undo/redo** and for editing existing chips. **Undo/redo is in Phase 1.** |
| **React Flow (@xyflow/react)** | MIT-licensed library for node-based editors. Pan/zoom, snap-to-grid and custom nodes and edges are built in. On touch screens you can **tap two handles to connect them** (`connectOnClick`) or drag a connection line. | Our canvas. Several open-source React Flow logic simulators already exist, which lowers the technical risk. |

**Research on learning (assessment and remediation design).** Herman, Loui, Zilles and others
(University of Illinois) built the *Digital Logic Concept Inventory*. They found that
**translating English specifications into Boolean logic** is a foundational skill and a common
source of difficulty, and that students struggle most with abstraction and with transferring a
concept to a new context. This shapes our design:

- One lesson is dedicated to translating English into logic ("either/or", "unless", "only if").
- The checker produces data that lets hints target the specific wrong rows of a truth table.
- The DLCI targets university students, but some of its items could inform the pre/post
  evaluation, with permission from its authors.

**Standards alignment**, to verify against official documents before building the evaluation
index:

- **IB Computer Science** (new syllabus, first assessment May 2027) has A1.2.3 (purpose and use
  of logic gates), A1.2.4 (constructing truth tables) and A1.2.5 (logic diagrams), covering
  AND, OR, NOT, NAND, NOR, XOR and XNOR. *These come from third-party course materials; check
  them against the official IB guide.*
- **CSTA 3B-CS-02**: "Illustrate ways computing systems implement logic, input, and output
  through hardware components." California's 9–12 specialty standard explicitly names gates
  and adders built from gates.
- **AP CSP** clearly covers *Boolean expressions* (Topic 3.5). I could **not confirm** that the
  current Course and Exam Description covers *logic gates*. Check this before the proposal's
  evaluation relies on AP items.

**Deployment risk.** Some school districts block GitHub Pages, along with Vercel, Netlify and
Cloudflare, as a category. Mitigations for later phases: a custom domain that a district IT
team can allowlist, an installable offline-capable PWA, and possibly a single-file offline
build. Because the app is fully static, it can be moved to another host with no code changes.

---

## 3. Architecture (decided in Phase 1, built on in every later phase)

### 3.1 Stack

- **TypeScript + React + Vite** (current stable versions at scaffold time).
- **@xyflow/react** (React Flow) for the canvas.
- **Zustand** for app state. React Flow uses Zustand internally, and its docs recommend it.
- **Vitest** for unit tests. **Playwright** for end-to-end smoke tests, including emulated
  iPad touch.
- **GitHub Actions** runs lint, typecheck, test and build, then deploys to **GitHub Pages**
  via `actions/deploy-pages`.
- **Hash-based routing** (`/#/lesson/2`), because GitHub Pages has no SPA fallback. Vite's
  `base` is set to `/CS6460/` (or `./`).

### 3.2 Module layout and dependency rule

```
src/
  sim/        Pure TS: circuit model, component registry (logic), compiler, simulator,
              truth table, checker, serialization. NO React / DOM imports.
  components/ Component definitions: logic in sim-facing files, SVG rendering in view files.
  editor/     React Flow canvas, custom nodes/edges, palette, toolbar, undo/redo.
  lessons/    Lesson schema, runner UI, progress store; content/ holds lesson data.
  storage/    Persistence adapter (localStorage), file import/export, share-link codec.
  app/        Routes, layout, theming.
```

**Rule:** `sim/` must never import from `editor/`, `lessons/` or React. This keeps the engine
fully unit-testable, makes it reusable in a Web Worker or a headless grader, and keeps
simulation results stable while the UI changes.

### 3.3 Circuit document (the source of truth; serializable and versioned)

```ts
interface CircuitDoc {
  schemaVersion: 1;
  id: string;
  name: string;
  components: ComponentInstance[];
  wires: Wire[];
}

interface ComponentInstance {
  id: string;
  type: string;                       // "AND", "SWITCH", "LIGHT", later "SEVEN_SEG", "SUBCIRCUIT:..."
  position: { x: number; y: number };
  rotation?: 0 | 90 | 180 | 270;      // reserved
  label?: string;                     // "A", "B", "Out" — used by truth table and checker
  props: Record<string, unknown>;     // e.g. { inputs: 2 }, { color: "red" }
  locked?: boolean;                   // lesson-provided parts that cannot be moved or deleted
}

interface Wire {
  id: string;
  from: { component: string; pin: string };  // must be an output pin
  to:   { component: string; pin: string };  // must be an input pin
  waypoints?: { x: number; y: number }[];    // RESERVED for later drawn routing
}
```

- **Fan-out is allowed** (one output can drive many inputs). **Every input has at most one
  driver.** Connecting a wire to an input that is already driven replaces the old wire. This
  rule means two outputs can never fight over one wire, so Phase 1 needs no "error" value and
  no bus resolution.
- The document stores **no simulation values**. Values live in a separate simulator state, so
  undo/redo and saved files contain only the design.
- `schemaVersion` plus a `migrate()` function lets saved files and share links keep working
  as the format changes.

### 3.4 Component registry

Each component type is registered once:

```ts
interface ComponentDef {
  type: string;
  category: "io" | "gate" | "display" | "sequential";
  pins(props): { inputs: PinDef[]; outputs: PinDef[] };
  evaluate(inputs: Value[], props, state?): { outputs: Value[]; state? };
  defaultProps: Record<string, unknown>;
}
```

The view (SVG gate shape, touch targets) is registered separately, in `components/*/View.tsx`.
New components in later phases (seven-segment display, push button, clock, flip-flops,
subcircuits) are **added to the registry, and the engine does not change**. The optional
`state` argument exists now so that sequential components can be added later.

**Phase 1 component set:** Switch (toggle input), Light (output), AND, OR, NOT, NAND, NOR,
XOR, XNOR. Gates have 2 inputs (NOT has 1). The `inputs` prop is in place for 2–4-input gates
later.

### 3.5 Simulation engine

- **Values:** `0 | 1 | X`. X means unknown or not connected, and it follows three-valued
  (Kleene) logic: `AND(0, X) = 0`, `AND(1, X) = X`, `OR(1, X) = 1`, `NOT(X) = X`, and
  `XOR` with any X input gives X. An unconnected input reads as X. The editor draws it in a
  distinct "unknown" style, which teaches students to look for loose wires.
- **Compile:** `CircuitDoc` → a netlist with integer indices. There is one net per output pin,
  and a fan-out list for each net.
- **Run:** event-driven with unit delay. Changed nets schedule the components that read them.
  Each "tick" evaluates all scheduled components, then applies all of their new outputs at
  once. This repeats until nothing changes.
- **Oscillation:** if the circuit has not settled after a step budget (about 4× the component
  count, minimum 100), the engine stops and reports the components that are still changing.
  The editor highlights them with the message "This circuit never settles".
- **Why event-driven rather than topological ordering?** It handles feedback loops (SR
  latches, flip-flops) without redesign, which is the Phase 4 stretch goal. It also makes a
  "slow motion" propagation view possible later. For the small lesson circuits it is fast
  enough. Target: under 2 ms per update for 200 components.
- **Cycle check:** a graph check (DFS) flags combinational loops. In Phase 1 the checker
  rejects looped circuits with a friendly message ("loops come later, in the memory lesson").

### 3.6 Truth table and checker

- **I/O discovery:** inputs are Switch components and outputs are Light components. They are
  ordered by label: auto-labeled A, B, C… for inputs, and editable. Lessons fix the labels, so
  checks match parts by **label, not by position**.
- **Truth table:** for each of the 2ⁿ input combinations, reset to all-X, apply the inputs, and
  let the circuit settle. The table can be shown for up to 6 inputs (64 rows); the checker can
  check up to 10 inputs.
- **Check spec**, used by lessons, challenges and later the project grader:

  ```ts
  interface CheckSpec {
    inputs: string[];                 // labels, in order
    outputs: string[];
    expected: TruthTableRow[] | ((ins: Bit[]) => Bit[]);
    constraints?: {
      allowedTypes?: string[];        // e.g. only NAND
      maxGates?: number;
      requiredTypes?: string[];
    };
  }
  ```

- **Check result** (structured, so later phases can build hints from it):

  ```ts
  interface CheckResult {
    pass: boolean;
    mismatches: { inputs: Bit[]; expected: Bit[]; actual: Value[] }[];
    diagnostics: Diagnostic[];  // codes: MISSING_IO, UNCONNECTED_INPUT, OUTPUT_UNKNOWN,
                                // HAS_CYCLE, DISALLOWED_TYPE, TOO_MANY_GATES, OSCILLATES
  }
  ```

  The codes and the set of wrong rows are what the Phase 2 hint system uses. For example, if
  only the `1,1` row is wrong, the student probably built OR instead of XOR, and the hint can
  ask "What should happen when both inputs are on?"

### 3.7 Lesson framework

- **Lessons are TypeScript data modules**, with Markdown strings for prose. This makes them
  type-checked, lets them include check specs inline, and lets CI test them. Each lesson is a
  list of **steps**:
  - `explain`: text, an optional picture, an optional read-only embedded circuit.
  - `guided`: a starter circuit (with locked I/O), a restricted palette, a `CheckSpec`,
    `hints[]`, and a **reference solution**.
  - `challenge`: the end-of-lesson mastery check. It has the same shape as `guided` but
    gives less help.
  - `remediation` *(Phase 2)*: smaller guided steps, chosen by failure pattern.
  - `project` *(Phase 2)*: open-ended, checked against basic criteria.
- **Every guided or challenge step ships a reference solution, and a unit test checks that the
  solution passes the step's own `CheckSpec`.** This catches unsolvable or mis-specified
  lessons before students do, which matters more as lessons are written quickly in Phase 2.
- **Progress store** (localStorage, versioned) records, for each step: status, number of
  attempts, number of hints used, and first/last timestamps. It holds **no personal
  information**. These fields cost almost nothing now, and they later drive gating, test-outs
  and teacher completion codes. Students can also choose to export them as data for the beta
  evaluation.

### 3.8 Editor: interaction design for touch and mouse

- **Add parts:** drag from the palette (implemented with pointer events, not the HTML5 drag
  API, which is unreliable with touch on iPad Safari), **or tap a palette item to drop it at
  the center of the view**.
- **Connect:** drag from pin to pin, **or tap a pin, then tap another pin** (React Flow
  `connectOnClick`). `isValidConnection` rejects connections from input to input or from
  output to output.
- **Touch targets:** pins look small but have hit areas of at least 24 px (WCAG 2.2
  target-size minimum), aiming for about 44 px on touch screens. Toolbar buttons are at least
  44 px.
- **Toggling a switch** is a tap or click. A drag threshold (`nodeDragThreshold`) keeps a tap
  from being read as a move.
- **Delete:** the Delete or Backspace key, plus a toolbar trash button for touch. **Undo/redo**
  works with Ctrl/Cmd+Z and Shift+Z, plus toolbar buttons. A drag counts as one history entry,
  recorded when the drag ends.
- **Snap to grid** is on by default. This builds in the proposal's fallback of snapping to a
  grid instead of fully open editing.
- **Wire state is never shown by color alone.** A 1 is a bright, thick wire; a 0 is dark and
  thin; X is gray and dashed. A setting can show 0/1 labels on wires.
- **Layout:** tuned for Chromebooks at 1366×768 and iPads in landscape (about 1024–1180 px
  wide). The palette and lesson panel can be collapsed, and portrait mode stays usable.

---

## 4. Phase 1: work breakdown

**Date assumption:** today is Thu Oct 29, and the Milestone 1 video is due at the end of the
week of Oct 26. **Please confirm the actual due date** (see §7). Tasks are listed in build
order, and each task is a reviewable commit or PR.

| # | Task | Acceptance criteria | Target |
|---|---|---|---|
| **P1.0** | **Scaffold and CI/CD.** Vite + React + TS, ESLint + Prettier, Vitest, Playwright, a GitHub Actions workflow (lint, typecheck, test, build, deploy to Pages), hash router, `base` path. Add a `CLAUDE.md` with commands and the architecture rules, so future Claude Code sessions follow them. | `npm run build`, `npm test` and `npm run lint` pass in CI, and the Pages URL loads a placeholder page. | Oct 29 |
| **P1.1** | **Circuit model and serialization.** Types, `validate()`, `migrate()`, JSON round-trip. | Round-trip and validation tests pass. Wires that break the single-driver rule are rejected. | Oct 29 |
| **P1.2** | **Component registry and the 9 Phase 1 components** (logic only). | Every gate's full truth table, including X cases, is unit-tested. | Oct 30 |
| **P1.3** | **Simulation engine.** Compile, event loop, settle, step budget, oscillation report, cycle check. | Tests: half adder and full adder give correct outputs; fan-out; an unconnected input gives X; a NOT gate feeding itself is reported as oscillating; 200 components update in under 2 ms on CI. | Oct 30 |
| **P1.4** | **Truth table and checker.** Truth table generation, `CheckSpec`, `CheckResult`, diagnostics, constraints. | Tests: a correct XOR passes; OR used in place of XOR fails on exactly the `1,1` row; a missing output gives `MISSING_IO`; "only NAND" rejects an AND gate. | Oct 30 |
| **P1.5** | **Editor canvas.** Custom nodes with hand-drawn ANSI gate SVGs, palette (drag and tap-to-add), connect by drag or tap, single-driver replacement, delete, undo/redo, snap grid, pan/zoom, live coloring of wires and lights, switch toggling, a banner when the circuit oscillates. | With mouse **and** emulated iPad touch, a user can build a half adder from scratch, toggle its inputs and see correct outputs. Covered by a Playwright test in both modes. | Oct 31 |
| **P1.6** | **Truth table panel.** Updates live; the row matching the current switch settings is highlighted; tapping a row sets the switches to that combination. | Manual check plus a component test. This ties the circuit diagram to the truth table (IB A1.2.4–A1.2.5). | Oct 31 |
| **P1.7** | **Curriculum outline (scaffolded lesson plan).** Revise the draft in §5 with the author. | The author has reviewed it. It is saved as `docs/curriculum-outline.md`. | Nov 1 |
| **P1.8** | **Milestone 1 demo.** Deploy, write a demo script, record the video. | The deployed build shows: sandbox, live simulation, truth table, and a checker pass and fail. | **M1 due** |
| **P1.9** | **Saving and sharing.** Autosave the sandbox to localStorage; export and import a `.circuit.json` file; share link (circuit compressed into the URL hash with `lz-string`, falling back to a file when the link would be too long). | A link reopens the same circuit in a fresh browser profile. Malformed files or links give a friendly error, not a crash. | Nov 2 |
| **P1.10** | **Lesson framework skeleton.** Lesson schema, runner UI (instruction panel, step progress, a "Check" button that uses the checker, hints revealed one at a time), progress store, and **one demo lesson** ("NOT and AND") with reference solutions, plus the content test for solutions. | The demo lesson can be completed end to end; progress survives a page reload; the solution test runs in CI. | Nov 3–4 |

**Milestone 1 cut line:** P1.0–P1.8 is the minimum to demo. P1.9–P1.10 finish at the start of
the week of Nov 2 and overlap with Phase 2. P1.10 must be done before lessons 1–4 are written.

### Phase 1 exit criteria

- [ ] On Chrome (ChromeOS or desktop) and on Safari (iPad, or emulated touch), a student can
      build, simulate and inspect a circuit using **only** touch or **only** a mouse.
- [ ] The checker verifies a circuit against a spec and reports the exact wrong rows and the
      structural problems.
- [ ] A demo lesson runs end to end with gated steps, hints and saved progress.
- [ ] CI is green and `main` deploys to GitHub Pages automatically.
- [ ] `sim/` has no React or DOM imports, enforced by a lint rule.
- [ ] Unit tests cover all gate truth tables and every engine and checker scenario listed above.

### Explicitly out of scope for Phase 1

Drawn wire routing; multi-bit buses; seven-segment and other displays (Phase 2); lesson
content beyond the demo lesson (Phase 2); hints keyed to failure patterns (Phase 2); teacher
features (Phase 3); sequential logic and clocks (Phase 4 stretch); subcircuits (later or
stretch); building circuits with the keyboard alone (a known accessibility limit; toolbar and
lesson navigation will still work from the keyboard).

---

## 5. Draft scaffolded lesson plan (for the author to revise)

Each lesson moves from **direct instruction** to **guided construction** (with locked I/O and
a restricted palette) to **open construction**, then ends with an automatically checked
**challenge**. Failing the challenge leads to **remediation**. Each unit ends with an **open
project**. Optional test-outs come before each unit.

| # | Lesson | Key ideas | Example challenge | Standards |
|---|---|---|---|---|
| 0 | *Editor tour* (skippable) | Placing parts, wiring, toggling, undo | Wire a switch to a light | — |
| 1 | Signals: on/off, 0/1 | Inputs, outputs, binary signals, unknown (X) | Two switches, two lights; label them | IB A1.2.3 |
| 2 | NOT and AND | Gate behavior, reading a truth table | "The light is on only when both buttons are pressed" | A1.2.3–A1.2.4 |
| 3 | OR, and combining gates | Multi-gate circuits; tracing signals | Build `(A AND B) OR C` from its truth table | A1.2.4–A1.2.5 |
| 4 | From circuit to truth table | Building truth tables by hand, then checking with the tool | Predict the table, then verify it | A1.2.4 |
| **U1 project** | *Open project:* e.g. a door alarm or voting machine | Free design with basic automatic criteria | Rubric (hidden; for teachers) | CSTA 3B-CS-02 |
| 5 | NAND and NOR: universal gates | Build NOT, AND and OR from NAND only | "Only NAND" constraint | A1.2.3 |
| 6 | XOR/XNOR and English → logic | "Either… or", "unless", "only if" (the DLCI's hardest area) | Turn a word problem into a circuit | A1.2.5 |
| 7 | From truth table to circuit | Sum of products, Boolean expressions ↔ diagrams | Build a circuit from any 3-input table | A1.2.4–A1.2.5 |
| 8 | Useful circuits: adders | Half adder, full adder, 2-bit adder | Full adder | CSTA 3B-CS-02 |
| **U2 project** | *Open project:* e.g. drive a seven-segment display from switches | Uses Phase 2 display parts | Rubric | — |
| 9 *(stretch)* | Memory: latches and clocks | Feedback, SR latch, D latch | Store one bit | — |

---

## 6. Later phases (each is built on the Phase 1 seams above)

| Phase | Weeks (from the proposal) | Scope | Seam it relies on |
|---|---|---|---|
| **2: Lessons and guidance** | Nov 2 – Nov 13 (M2) | Lessons 1–8 content; hints and reminders (a progressive hint ladder, a gate-reference "reminder" card, hints chosen from wrong rows and diagnostics); progress gating; optional test-outs; remediation branches; seven-segment display and multi-color lights; automatic project grader (criteria such as "uses at least N gates", "every output depends on every input", "drives a seven-segment display"). | Registry; structured `CheckResult`; progress store; lesson step types. |
| **3: Instructor support and beta** | Nov 16 – Nov 27 (M3) | Teacher guide (onboarding, pacing for 45/50/90-minute periods, hidden rubrics), downloadable PDFs, **bypass codes** (checked as hashes in the browser; they discourage students but are not secure, and the docs say so), **completion codes** or a printable progress report a student can show a teacher (tamper-evident rather than tamper-proof), a teacher "answer key" view, and a beta-testing round with an opt-in progress export plus surveys. | Progress store holds no personal information and can be serialized; lesson data includes reference solutions. |
| **4: Stretch, polish, report** | Nov 30 – Dec 14 | Sequential logic (clock, SR/D latches, flip-flops), possibly checked with sequence-based tests like Digital's; a single-step "slow motion" propagation view; accessibility and performance polish; offline PWA; final report and walkthrough video. | Event-driven engine; `state` in `evaluate`; oscillation handling. |
| **Later / post-course** | — | Drawn wire routing (`waypoints`); subcircuits / custom chips (flattened at compile time, as Digital does); multi-bit buses; custom domain; optional backend (never required). | Wire waypoints; registry type namespaces; storage adapter. |

---

## 7. Open questions for the author

1. **Milestone 1 due date**, and what the course expects the video to show. This decides the
   P1.8 cut line.
2. **Gate symbols:** ANSI/IEEE distinctive shapes (default, and familiar from IB and US
   materials), or IEC rectangular symbols, or a toggle between them later?
3. **Name and branding** for the site (needed for the page title and the Pages URL; it could
   also be a custom domain).
4. **License** (MIT is suggested; it is compatible with using CircuitVerse ideas, while
   Logisim and Digital code must not be copied) and **repo visibility**: GitHub Pages on a
   private repo requires a paid plan. Also enable Pages with **Source: GitHub Actions** in the
   repo settings.
5. **Who writes the lesson prose?** The author writes it and Claude turns it into lesson data,
   or Claude drafts it for the author to edit.
6. **Evaluation instrument:** confirm whether AP CSP actually covers logic gates (§2), and
   whether you want to ask the DLCI authors about adapting items.
7. **Beta testers:** who are they, and when (week of Nov 23)? This decides when the opt-in
   progress export and the survey links must be ready.

---

## 8. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Phase 1 is compressed (the Oct 19 prototype was not built) | High | Strict M1 cut line; the headless engine first so Claude Code can test it quickly; one demo lesson rather than many. |
| Touch problems in iPad Safari | Medium | Playwright touch emulation in CI; test early on a real iPad if available; tap-to-add and tap-to-connect fallbacks. |
| Unsolvable or wrong lesson content written in a hurry | Medium | A reference solution for every check, plus a CI test. |
| A district blocks GitHub Pages | Medium | The app is static and can move hosts; custom domain; PWA/offline build later. |
| Scope creep from stretch features | Medium | §4 out-of-scope list; stretch work only after M3. |
| Simple bypass and completion codes are worked around | Low impact | Documented as discouragement only; teachers can also ask for exported project files. |

---

## 9. Sources

- Logisim oscillation docs: https://cburch.com/logisim/docs/2.3.0/guide/prop/oscillate.html
- Logisim value model ("shortcomings"): https://cburch.com/logisim/docs/2.0.3/guide/prop/shortcome.html
- Digital (hneemann): https://github.com/hneemann/Digital
- CircuitVerse docs: https://docs.circuitverse.org/ · Interactive Book: https://learn.circuitverse.org/about.html
- React Flow touch-device example: https://reactflow.dev/examples/interaction/touch-device
- Herman, Loui, Zilles et al. — DLCI / misconceptions: https://ideals.illinois.edu/items/25021 ,
  https://people.cs.vt.edu/~kafura/CS6604/Papers/Digital-Logic-Concept-Inventory.pdf
- CSTA K-12 standards (revised): https://csteachers.org/wp-content/uploads/2025/03/csta-k-12-computer-science-standards-revised.pdf
- IB CS 2027 A1.2 (third-party summary): https://www.tes.com/teaching-resource/ib-computer-science-2027-a1-2-data-representation-and-computer-logic-complete-bundle-13550815
- District blocking GitHub Pages (example): https://www.change.org/p/unban-github-for-lcps-high-school-students

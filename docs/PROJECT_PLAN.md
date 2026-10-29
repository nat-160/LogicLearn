# Project Plan: Web-Based Logic Circuit Learning Platform

> Status: **v3**, 2026-10-29. Drafted from the approved project proposal. v2 added the
> findings of an independent review and of Herman et al. (ICER '08); v3 adds the author's
> answers (see §10).
> Repository: `nat-160/LogicLearn` (formerly `CS6460`). Working name for the site: **LogicLearn**.
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
| Data / backend | **Static, no accounts.** Everything stays in the browser (localStorage). **The app never sends data anywhere.** Anything that leaves the device is a file or link the student chooses to create. Beta surveys and evaluation tests are run separately (see §6). |
| Devices | **Touch and mouse are both first-class in the design** (tap-to-add, tap-to-connect, large hit areas). **Testing targets current desktop browsers** (Chrome, Edge, Firefox, Safari). There is no partner school or target device fleet, so touch is checked with browser touch emulation. A real-iPad pass is optional. |
| Lesson text | The author writes the final lesson prose. Claude builds each lesson's structure, check specs, circuits and hints, with **short bullet-point placeholder text** covering each topic (§3.7). |
| Curriculum | The §5 order is confirmed. **Implication ("if-then") is taught**, in Lesson 6. |
| Beta testers | The author and peers (adults). |

### Hosting (resolved)

The repo was renamed to `nat-160/LogicLearn`, made public, and has Pages enabled. Expected
URL: `https://nat-160.github.io/LogicLearn/`. The P1.0 workflow deploys with
`actions/deploy-pages`, which requires **Settings → Pages → Source: GitHub Actions**. If Pages
was set to "Deploy from a branch", switch that one setting (see §7).

---

## 2. Research notes: existing tools, and what we take from them

| Tool | What it is | Takeaway for this project |
|---|---|---|
| **Logisim / Logisim-evolution** (Java desktop); **logisim.app** (web port) | The classic teaching simulator. Each bit can be on, off, unspecified or error. It reports oscillation after a fixed number of iterations rather than truly detecting a loop. | Reuse the value model (0/1/X now, E reserved) and the iteration-cap approach to oscillation. Both are GPL, so **do not copy code or assets**. |
| **Digital** (hneemann, Java, GPL-3) | Educational simulator with **built-in test cases**. Event-driven with one shared gate delay. Uses a "switch-on" phase with random update order so that latches can settle; has oscillation detection and single-gate stepping. | Model for our checker (declarative input→output specs) and for how sequential logic should settle in Phase 4. The single-gate stepper is a good later-phase teaching feature. |
| **CircuitVerse** (web, MIT) | Browser-based. Teacher groups and assignments with grading, subcircuits, multi-bit wires, and an Interactive Book with embedded circuits and quizzes. | **The closest existing competitor, and the proposal does not mention it.** Reviewers are likely to ask "why not CircuitVerse?" Our differentiators: **no accounts** (no student data), a **high-school-level scaffolded path** where each guided step is **checked automatically** and sends students to **remediation** when they fail, and **built-in teacher materials**. CircuitVerse's book draws mostly on Mano's *Digital Design*, a college text. |
| **NandGame** (web) | Puzzle levels. You build a circuit, toggle its inputs, then submit it for a check. Finished levels become reusable parts. | Proves the "submit and auto-check" loop is engaging. "Completed circuits become components" is a strong later feature (subcircuits). As the proposal notes, it has no free-form projects. |
| **Nand2Tetris** | A college course based on an HDL, not on a visual editor. | Out of our audience's range. A good source for sequencing ideas. |
| **Digital Logic Sim** (Sebastian Lague, desktop) | Start from NAND, build custom chips in layers. | Its community repeatedly asks for **undo/redo** and for editing existing chips. **Undo/redo is in Phase 1.** |
| **React Flow (@xyflow/react)** | MIT-licensed library for node-based editors. Pan/zoom, snap-to-grid and custom nodes and edges are built in. On touch screens you can **tap two handles to connect them** (`connectOnClick`) or drag a connection line. | Our canvas. Several open-source React Flow logic simulators already exist, which lowers the technical risk. |

### Research on learning, and how it shapes the design

**Herman, Kaczmarczyk, Loui and Zilles (2008), "Proof by Incomplete Enumeration and Other
Logical Misconceptions" (ICER '08).** In think-aloud interviews, students who had just
finished a digital logic course translated English specifications into Boolean logic.
The main findings:

- **"Easy" operators (AND, OR, XOR) vs "hard" ones (NAND, if-then, if-and-only-if).**
  Students quietly replace a hard operator with an easy one that agrees on most rows:
  - More than half translated "not both" as **XOR**, when it means **NAND**. The two differ
    only on the 0,0 row.
  - **No student** translated "if and only if" correctly. Most reduced it to a one-way
    "if-then", and several went on to AND, which differs from XNOR only on the 0,0 row.
  - Four students translated "if-then" as AND.
- **Proof by incomplete enumeration** (the second most common code): students checked only
  the one to three rows that confirmed their guess. They **rarely checked the all-zeros
  row**, and they dropped negated variables for "by itself" and "without".
- **Recall over reasoning** (the most common code), **"cowboy composition"** (combining
  several rules in their heads instead of translating each rule and ANDing them together),
  and **little metacognition** (rarely checking the answer against the English again).
- **Interference** from programming: a causal reading of "if", and `!` used for NOT.
- **The authors recommend:** concrete, relatable examples for "if-then", "if and only if",
  "by itself" and "not both"; teaching the translate-each-rule-then-combine method; and
  insisting on **checking every case** with a truth table.

**What this means for the design.** These are the participants' patterns, college students
who earned B or C grades. Whether high school students make the same mistakes is a
hypothesis for our evaluation to test.

1. The checker enumerates every row, but it must **show the student which rows are wrong**,
   not just "wrong". A **"misconception signature"** table (§3.6) maps sets of wrong rows to
   targeted hints.
2. The truth-table panel tracks **which input combinations the student has actually tried**
   ("you've tried 3 of 4"). In Phase 2 it nudges the student before they can press Check.
3. A lesson option **hides live outputs** ("predict first" / "blind" mode), so a challenge
   cannot be solved just by toggling switches until the lights match. A **prediction mode**
   lets students fill in the truth table before the tool reveals the answer (Phase 2; the
   seam is in Phase 1).
4. The curriculum (§5) puts XOR next to OR, contrasts NAND with XOR, and teaches English →
   logic as rule-by-rule translation followed by AND.
5. The sandwich-shop and apple-pie interview items are candidates, with attribution, for
   the pre/post evaluation or for think-aloud sessions.

Related work from the same group: *Describing the What and Why of Students' Difficulties in
Boolean Logic* (ACM TOCE, 2012), and the **Digital Logic Concept Inventory** (DLCI),
a validated multiple-choice instrument for university students.

### Standards alignment

- **IB Computer Science** (new syllabus, first assessment May 2027) has A1.2.3 (purpose and use
  of logic gates), A1.2.4 (truth tables) and A1.2.5 (logic diagrams), covering AND, OR, NOT,
  NAND, NOR, XOR and XNOR. *These codes come from third-party materials; the author has
  accepted them as correct for now.*
- **CSTA 3B-CS-02** (2017 standards): "Illustrate ways computing systems implement logic,
  input, and output through hardware components." California's 9–12 specialty standard
  explicitly names gates and adders built from gates. *CSTA has been revising its standards,
  so confirm that this identifier hasn't changed.*
- **AP CSP does not cover logic gates** (the author confirmed this). It covers only *Boolean
  expressions* (Topic 3.5). The proposal's evaluation index ("drawn from the AP and IB
  standards") should therefore be built from **IB A1.2.3–A1.2.5** and CSTA. AP CSP can
  contribute only Boolean-expression items. **Suggested change to the proposal or report
  wording:** say that AP CSP covers only Boolean expressions, not gates.

### Deployment risk

School web filters sometimes block developer and hosting sites. The evidence I found is
anecdotal: a student petition about a district blocking GitHub. Mitigations for later phases:
a custom domain that district IT can allowlist, and an installable offline-capable PWA.
Because the app is fully static, it can be moved to another host with no code changes.

---

## 3. Architecture (decided in Phase 1, built on in every later phase)

### 3.1 Stack, hosting and browser support

- **TypeScript + React + Vite** (current stable versions at scaffold time).
- **@xyflow/react** (React Flow) for the canvas.
- **Zustand** for app state. React Flow uses Zustand internally, and its docs recommend it.
- **Vitest** for unit tests. **Playwright** for end-to-end smoke tests, including emulated
  iPad touch.
- **GitHub Actions** runs lint, typecheck, test and build, then deploys to **GitHub Pages**
  via `actions/deploy-pages`.
- **Hash-based routing**, because GitHub Pages has no SPA fallback. Routes:
  - `#/` home
  - `#/sandbox`
  - `#/lesson/:id/:step`
  - `#/share/:payload`

  Vite's `base` is set to `'./'`, so the same build works under `/LogicLearn/`, under a custom
  domain, or on any other static host.
- **Browser support:** the current versions of desktop Chrome, Edge, Firefox and Safari.
  There is no partner school or legacy device fleet, so Vite's default `build.target` is
  fine. If a school with older Chromebooks or iPads adopts the app later, set an explicit
  target then.

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

**Rule:** `sim/` must never import from `editor/`, `lessons/`, React or the DOM. Two
mechanisms enforce this:

- ESLint `no-restricted-imports`.
- A separate `tsconfig` for `sim/` with **no `dom` library**, so DOM globals fail to typecheck.

All `sim/` inputs and outputs are **plain data** that can be serialized, with no functions.
This keeps the engine fully unit-testable, makes it usable in a Web Worker or a headless
grader, and keeps simulation results stable while the UI changes.

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
  io?: "input" | "output";            // marks parts the truth table and checker treat as I/O
  pins(props): { inputs: PinDef[]; outputs: PinDef[] };
  evaluate(inputs: Value[], props, state?): { outputs: Value[]; state? };
  defaultProps: Record<string, unknown>;
}
```

The view (SVG gate shape, touch targets) is registered separately, in `components/*/View.tsx`.
New components in later phases (push button, seven-segment display, clock, flip-flops,
subcircuits) are **added to the registry, and the engine and checker do not change**. They
find I/O through the `io` role, never through type names. The optional `state` argument
exists now so that sequential components can be added later.

**Phase 1 component set:** Switch (`io: input`), Light (`io: output`), AND, OR, NOT, NAND,
NOR, XOR, XNOR. Gates have 2 inputs (NOT has 1). The `inputs` prop is in place for 2–4-input
gates later.

### 3.5 Simulation engine

- **Values:** `0 | 1 | X`. X means unknown or not connected, and it follows three-valued
  (Kleene) logic: `AND(0, X) = 0`, `AND(1, X) = X`, `OR(1, X) = 1`, `NOT(X) = X`, and
  `XOR` with any X input gives X. An unconnected input reads as X. The editor draws it in a
  distinct "unknown" style, which teaches students to look for loose wires.
- **Compile:** `CircuitDoc` → a netlist with integer indices. There is one net per output pin,
  and a fan-out list for each net.
- **Reset:** every net is set to X, and **every component is scheduled once**. This is how
  switches (and later, constants and clocks) put their values onto the circuit.
- **Run:** event-driven with unit delay. Each **tick** evaluates all scheduled components, then
  applies all of their new outputs at once, and schedules the readers of any net that changed.
  This repeats until nothing changes.
- **Oscillation:** the step budget is counted in **ticks**: `max(100, 4 × componentCount)`.
  That is always more than the depth of an acyclic circuit. If the circuit has not settled
  within the budget, the engine stops and reports the components that are still changing,
  and the editor highlights them with the message "This circuit never settles".
  - Note: a NOT gate looped back on itself **settles at X** (NOT(X) = X), because its value
    is never pinned down. The editor still shows the `HAS_CYCLE` notice for it.
  - A real oscillation needs a known value to enter the loop. Example: a NAND gate whose
    second input is its own output. With A=0 it settles at 1; switching A to 1 then makes
    it oscillate.
- **Why event-driven rather than topological ordering?** The engine's structure already
  supports feedback loops (latches, flip-flops), the Phase 4 stretch goal. It also makes a
  "slow motion" propagation view possible later. For the small lesson circuits it is fast
  enough. Phase 4 must still add a **settling strategy**: with one uniform delay, a NOR SR
  latch whose S and R are released *at the same moment* oscillates forever. The options are
  Digital-style settling with random update order, or providing latches and flip-flops as
  primitive components. When a student toggles switches one at a time, this case does not
  arise.
- **Cycle check:** a graph check (DFS) flags combinational loops. In Phase 1 the checker
  rejects looped circuits with a friendly message ("loops come later, in the memory lesson").

### 3.6 Truth table and checker

- **I/O discovery:** inputs and outputs are the components whose `ComponentDef.io` is
  `input` or `output`. They are ordered by label: auto-labeled A, B, C… for inputs, and
  editable. Lessons fix the labels, so checks match parts by **label, not by position**.
- **Truth table:** for each of the 2ⁿ input combinations, reset, apply the inputs, and let
  the circuit settle. Rows are shown in binary counting order, so the **all-zeros row is
  always first**. The panel shows the table for up to 6 inputs (64 rows); the checker can
  check up to 10 inputs.
- **Check spec**: plain data, used by lessons, challenges and later the project grader:

  ```ts
  interface CheckSpec {
    inputs: string[];                 // labels, in order
    outputs: string[];
    expected: TruthTableRow[];        // data only; lesson authors may use rowsFrom(fn) to generate
    constraints?: {                   // gate constraints never count I/O parts
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
    diagnostics: Diagnostic[];  // MISSING_IO, EXTRA_IO, DUPLICATE_LABEL, UNCONNECTED_INPUT,
                                // OUTPUT_UNKNOWN, HAS_CYCLE, OSCILLATES,
                                // DISALLOWED_TYPE, TOO_MANY_GATES
  }
  ```

- **Misconception signatures.** Phase 1 builds the data and tests it; Phase 2 adds the hint
  text. Each signature is a target gate, a common wrong gate, and the set of rows where the
  two differ. These rows come from ICER '08 and from comparing the gates' truth tables.

  | Target | Common wrong answer | Wrong rows | Hint direction |
  |---|---|---|---|
  | NAND ("not both") | XOR ("exactly one") | {0,0} | "What should happen when *neither* is on?" |
  | XNOR ("if and only if", "exactly when") | AND | {0,0} | "Check the case where both are off." |
  | XOR ("one or the other, not both") | OR | {1,1} | "What should happen when *both* are on?" |
  | ¬A + B ("if A then B"; Lesson 6) | AND | {0,0}, {0,1} | "If A is off, has the rule been broken?" |
  | Any spec | — | only the all-zeros row | "Did you check the case where every input is 0?" |

### 3.7 Lesson framework

- **Lessons are TypeScript data modules.** This makes them type-checked and lets CI test
  them. **Prose lives in separate Markdown files**, one folder per language:
  `src/lessons/content/<lesson>/<locale>/<step>.md`. Each file holds the step's title,
  text and hints, so the author can write the final text without touching code (see
  §3.10).
  - Claude writes each file first as **short bullet points** covering the step's topics,
    starting with a `<!-- draft -->` marker.
  - `npm run lessons:drafts` lists the steps that are still drafts.
  - Hints are short. Claude drafts them in the TypeScript step definitions, and the author
    can revise them.

  Each lesson is a list of **steps**:
  - `explain`: text, an optional picture, an optional read-only embedded circuit.
  - `guided`: a starter circuit (with locked I/O), a restricted palette, a `CheckSpec`,
    `hints[]`, and a **reference solution**.
  - `challenge`: the end-of-lesson mastery check. It has the same shape as `guided` but
    gives less help.
  - `remediation` *(Phase 2)*: smaller guided steps, chosen by misconception signature.
  - `project` *(Phase 2)*: open-ended, checked against basic criteria.
- **Step options (seams):**
  - `liveOutputs: boolean` (default true). When false, lights show "?" until the student
    presses Check: the "predict first" / blind mode.
  - `truthTable: "live" | "hidden" | "predict"`. `predict` is Phase 2.
- **Every guided or challenge step ships a reference solution.** A content test in CI asserts
  that each **solution passes** its `CheckSpec` and each **starter circuit fails** it. This
  catches unsolvable or trivially solved steps before students see them, which matters more
  as lessons are written quickly in Phase 2.
- **Progress store** (localStorage, versioned) records, for each step: status, number of
  attempts, hints used, the input rows the student tried, and first/last timestamps. It holds
  **no personal information**. These fields cost almost nothing now; later they drive
  gating, test-outs, completion codes and the opt-in beta export.
  - **Durability.** Safari's tracking prevention can erase a site's localStorage after
    7 days without a visit (Home Screen web apps are exempt), and shared or guest-mode
    Chromebooks wipe storage when the session ends. So:
    - Phase 1 calls `navigator.storage.persist()` where it is available.
    - Phase 2 adds a student-facing **progress export/import** ("save my progress to a
      file"), which is required, not only a beta feature.

### 3.8 Editor: interaction design for touch and mouse

- **Add parts:**
  - Drag from the palette, implemented with pointer events, not the HTML5 drag API, which is
    unreliable with touch on iPad Safari.
  - **Or tap a palette item** to place it in the **next free grid cell near the center of the
    view**, so new parts don't pile up in one spot.
- **Connect:** drag from pin to pin, **or tap a pin, then tap another pin** (React Flow
  `connectOnClick`). `isValidConnection` rejects connections from input to input or from
  output to output.
- **Touch targets:**
  - Pins look small but have hit areas of at least 24 px (WCAG 2.2 target-size minimum),
    aiming for about 44 px on touch screens. Toolbar buttons are at least 44 px.
  - React Flow handles scale with zoom, so set **`minZoom`** (for example 0.5) high enough
    that hit areas stay at least 24 px on screen, or scale the handles inversely.
  - Space pins at least one hit area apart.
- **iPad gestures:**
  - `touch-action: none` on the canvas, so React Flow owns pan and pinch.
  - `-webkit-touch-callout: none` and `user-select: none` on editor controls, so a long press
    doesn't select text or open the callout menu.
  - Stop page-level pinch-zoom outside the canvas (iOS ignores `user-scalable=no`), using
    `touch-action: manipulation` and `gesturestart` handling.
- **Toggling a switch** is a tap or click. A drag threshold (`nodeDragThreshold`) keeps a tap
  from being read as a move.
- **Delete:** the Delete or Backspace key, plus a toolbar trash button for touch. **Undo/redo**
  works with Ctrl/Cmd+Z and Shift+Z, plus toolbar buttons. A drag counts as one history entry,
  recorded when the drag ends.
- **Snap to grid** is on by default, for tidy circuits. The proposal's worst-case fallback,
  a slot-based grid editor instead of open editing, should not be needed with React Flow. It
  stays in §8 as a contingency.
- **Wire state is never shown by color alone.** A 1 is a bright, thick wire; a 0 is dark and
  thin; X is gray and dashed. A setting can show 0/1 labels on wires.
- **Layout:** tuned for Chromebooks at 1366×768 and iPads in landscape (about 1024–1180 px
  wide). The palette and lesson panel can be collapsed, and portrait mode stays usable.

### 3.9 Accessibility and display preferences

> Added 2026-10-29 from the author's beta testing. Target: **WCAG 2.1 AA** (and 2.2
> where it's cheap), which also covers the ADA Title II requirement in §8.

**Requirements (author's priorities)**

| # | Requirement | Priority |
|---|---|---|
| A1 | The lessons work with a **screen reader** | Must |
| A2 | **Narration** built in. If built-in narration needed hosting beyond GitHub Pages, the fallback would be page conventions that work well with outside narration tools | Preferred |
| A3 | A **high-contrast theme** with an on/off toggle | Must |
| A4 | A **dyslexia-friendly font** with an on/off toggle | Must |
| A5 | A **dark mode** toggle. With A3 this makes four themes | Lower |
| A6 | Every preference is **saved persistently** | Must |

**Preferences (A6).**
- One store (`src/settings/`) is saved in localStorage under `logiclearn:prefs:v1`. It holds:
  - contrast: standard or high;
  - color scheme: light or dark;
  - reading font: default or dyslexia-friendly;
  - narration: auto-read, speed, voice;
  - language.
- **Until a student changes a setting, it follows the device**:
  - `prefers-contrast: more` turns on high contrast;
  - `prefers-color-scheme: dark` turns on dark mode.

  Once changed, the student's choice wins and is remembered. A "use my device's settings"
  button clears the saved choices.
- Preferences are applied as `data-*` attributes on `<html>` before the first render, so
  there is no flash of the wrong theme.
- Like everything else, preferences never leave the device.

**Settings panel.**
- An **Accessibility** button in the header opens a native `<dialog>`, which gives focus
  trapping and closes with Esc.
- It contains on/off switches (`role="switch"`) for high contrast, dark mode, the
  dyslexia-friendly font, and automatic narration, plus a speech speed control and a voice
  list. A language list appears once a second language exists (§3.10).
- Changes apply immediately and are saved automatically.

**Four themes (A3, A5).**
- The themes are light, dark, light high-contrast and dark high-contrast. Every color in
  the stylesheet comes from a CSS custom property (a "token"), and each theme only
  redefines tokens, so a fifth theme would be a token block, not a rewrite.
- High contrast means:
  - text at **7:1 or better** (WCAG AAA);
  - borders and parts at least 4.5:1;
  - thicker outlines (2px) and a 4px focus ring;
  - no faint shading or tints that carry meaning.
- Wire states keep their non-color cues: 1 is thick, 0 is thin, X is dashed. In high
  contrast they are thicker still.
- **Windows High Contrast / forced colors** (`@media (forced-colors: active)`) is respected
  using system colors.
- React Flow's own controls follow the theme (its `colorMode` setting).

**Dyslexia-friendly font (A4).**
- The font is **OpenDyslexic** (SIL Open Font License). It is self-hosted through
  `@fontsource` and downloaded only when the toggle is first turned on. Nothing is loaded
  from a font CDN, which keeps "nothing leaves the device" true.
- The toggle also applies the spacing in the British Dyslexia Association's *Dyslexia Style
  Guide*: line height ≥ 1.5, slightly wider letter and word spacing, left-aligned text, and
  no italics.
- Research note:
  - Extra letter spacing has measurable benefits (Zorzi et al., 2012, *PNAS*).
  - Studies of OpenDyslexic itself found no gain in reading speed or accuracy over standard
    fonts (Wery & Diliberto, 2017, *Annals of Dyslexia*).
  - So the spacing is treated as the main effect. The font is one CSS variable and can be
    swapped (e.g. for Lexend or Atkinson Hyperlegible, both also OFL) if testers prefer.

**Built-in narration (A2).**
- Narration uses the browser's **Web Speech API** (`speechSynthesis`). It runs entirely
  in the browser, so it needs **no server and works on GitHub Pages**.
- **Read aloud** reads the step's title and text, the hints already revealed, and the last
  check result. Pause/stop is available.
- Settings cover automatic reading when a step opens, speed, and voice.
- **On-device voices are preferred** (`voice.localService`). Some Chrome voices are
  generated on Google's servers, which would send lesson text (never student data) off
  the device, so those are only used if the student picks one.
- If the browser has no speech support, the button is hidden and the conventions below
  keep outside tools working.

**Conventions that keep outside narration tools and screen readers working.** These cover
Read&Write for Google Chrome, ChromeOS Select-to-speak and ChromeVox, Edge Immersive Reader,
VoiceOver and NVDA.
- All text is real text, never images of text or text drawn on a canvas.
- `lang` is set on `<html>`, and on lesson text when its language differs.
- One `<h1>` per page, and headings in order.
- Landmarks: banner, navigation, main, the lesson instructions as a labelled complementary
  region, and the circuit as a labelled region.
- Decorative SVG is `aria-hidden`; every control has a name.
- Lesson text stays selectable (no `user-select: none` outside the canvas), so
  select-to-speak works.
- Meaning is never carried by color alone.
- Dynamic results are announced through **persistent** live regions. Regions that are
  created already filled are often not announced.

**Screen reader support for lessons (A1).**
1. A **skip link** jumps to the main content.
2. Changing step **moves focus to the step heading**, so the new step is announced.
3. Check results, revealed hints and "never settles" warnings are announced politely
   (assertively for the warning).
4. The truth table has a `<caption>` and properly scoped column headers. Rows can be
   reached and activated from the keyboard.
5. **Circuit description:** a text version of the canvas.
   - It lists every part with its label and current value, and every wire as "from → to".
   - It updates live, and a short message is announced when a light changes ("Light Y is
     now on").
6. **Connections panel:**
   - "Connect output … to input …", built from two lists and a Connect button, plus a list
     of wires with Remove buttons.
   - With the palette (press Enter to add a part) and the inspector (rename, delete), a
     whole circuit can be built **without a pointer**.
   - This removes the Phase 1 limitation "circuits can't be wired with the keyboard alone".

**Testing.**
- **axe-core** scans run in Playwright on the home, sandbox and lesson pages in all four
  themes. They fail on any serious or critical violation, including color contrast.
- Unit tests cover the preferences store, the narration text, and the circuit
  description.
- A manual screen reader checklist is in `docs/accessibility.md`.

### 3.10 Localization (skeleton)

> Added 2026-10-29. Everything ships in US English for now, but lesson text is structured
> so translations can be added without code changes.

- **Locale codes** use the BCP 47 standard: `en-US` and, later, `es-US`. These are the
  same as the author's `en_us` and `es_us`, written the way browsers and the `lang`
  attribute expect.
- **Lesson text per locale:** `src/lessons/content/<lesson>/<locale>/` holds:
  - `lesson.md`, with the lesson title and a one-line summary;
  - one `<step>.md` per step, with the step title (its first `#` heading), the step text,
    and an optional `## Hints` list.

  Everything that doesn't depend on language stays in the lesson's `index.ts`: ids,
  circuits, checks, palettes and options.
- The **loader** picks the student's language and falls back to `en-US` file by file, so a
  half-finished translation never shows a blank step.
  - `npm run lessons:drafts` reports drafts and missing files per language.
  - The content test requires complete `en-US` text.
- The **locale registry** is `src/i18n/locales.ts`. Adding `{ code: 'es-US', name: 'Español
  (EE. UU.)' }` makes the language list appear in Settings, and `<html lang>` follows the
  choice. Step-by-step instructions are in `docs/translating.md`.
- **Not yet localized:** interface text (buttons, messages) and checker/misconception
  messages are English. They are already keyed by stable ids (diagnostic codes,
  misconception ids), so they can move into per-language message catalogs later. Circuit
  labels (A, B, Y) are not translated.

---

## 4. Phase 1: work breakdown

> **Status:** built and tested (2026-10-29). See [phase-1-report.md](phase-1-report.md).

**Dates:** today is Thu Oct 29. **Milestone 1 is due Tue Nov 3.** Tasks are listed in build
order, and each task is a reviewable commit or PR.

| # | Task | Acceptance criteria | Target |
|---|---|---|---|
| **P1.0** | **Scaffold and CI/CD.** Vite + React + TS, ESLint + Prettier, Vitest, Playwright, the GitHub Actions workflow (lint, typecheck, test, build, deploy to Pages), hash router, `base: './'`, and the **`sim/` boundary** (separate no-DOM tsconfig plus an import lint rule). Add a `CLAUDE.md` with commands and architecture rules, so future Claude Code sessions follow them. *Deploying needs Pages Source set to GitHub Actions (§1).* | `npm run build`, `npm test` and `npm run lint` pass in CI. `https://nat-160.github.io/LogicLearn/` loads a placeholder. A test file in `sim/` that imports React fails lint. | Oct 29 |
| **P1.1** | **Circuit model and serialization.** Types, `validate()`, `migrate()`, JSON round-trip. | Round-trip and validation tests pass. Wires that break the single-driver rule are rejected. | Oct 29 |
| **P1.2** | **Component registry and the 9 Phase 1 components** (logic only, with `io` roles). | Every gate's full truth table, including X cases, is unit-tested. | Oct 30 |
| **P1.3** | **Simulation engine.** Compile, reset (schedule everything once), tick loop, tick budget, oscillation report, cycle check. | Tests: half adder and full adder give correct outputs; fan-out; an unconnected input gives X; a NOT gate looped back on itself **settles at X** and shows `HAS_CYCLE`; NAND(A, its own output) settles at 1 with A=0, then **oscillates** after A is switched to 1; a 200-component circuit settles within a loose time bound (or measure with `vitest bench`, not a hard 2 ms gate in CI). | Oct 30 |
| **P1.4** | **Truth table and checker.** Truth table generation, `CheckSpec` (data only, plus a `rowsFrom()` helper), `CheckResult`, all diagnostics, constraints that skip I/O parts, and the misconception-signature data. | Tests: a correct XOR passes; OR used in place of XOR fails on exactly the `1,1` row and matches its signature; XOR used in place of NAND fails on exactly `0,0`; AND used in place of implication fails on exactly `0,0` and `0,1`; a missing output gives `MISSING_IO`; two inputs labeled "A" give `DUPLICATE_LABEL`; "only NAND" rejects an AND gate but not the switches. | Oct 30–31 |
| **P1.5a** | **Editor core.** Custom nodes with hand-drawn ANSI gate SVGs, palette (drag, and tap to place in the next free cell), connect by drag or tap, single-driver replacement, delete, snap grid, pan/zoom with `minZoom`, live coloring of wires and lights, switch toggling. | With mouse **and** emulated touch, a user can build a half adder from scratch and see correct outputs. The Playwright touch test uses **taps only** (tap to add, tap to connect, tap to toggle), because Playwright's touchscreen API only supports `tap()`. | Oct 31 |
| **P1.5b** | **Editor ergonomics.** Undo/redo (one history entry per drag), "never settles" banner and highlighting, touch gesture CSS, label editing. | Undo/redo unit tests on the store. Playwright smoke test passes in Chromium, Firefox and WebKit. | Nov 1 |
| **P1.6** | **Truth table and check panel.** Updates live; the current row is highlighted; tapping a row sets the switches to that combination; rows the student has tried are marked. Includes a **minimal "Target" check**: choose a hard-coded target (e.g. XOR, half adder), press **Check**, and see pass or fail with the wrong rows highlighted. | A component test, plus the M1 demo: OR built for an XOR target shows the `1,1` row wrong. | Nov 1 |
| **P1.7** | **Curriculum outline.** Write `docs/curriculum-outline.md` from §5 (order confirmed), with bullet-point topics for each lesson step. These bullets become the placeholder lesson text. | The author has reviewed it. | Nov 1 |
| **P1.9** | **Saving and sharing.** Autosave the sandbox to localStorage plus `navigator.storage.persist()`; export and import a `.circuit.json` file; share link at `#/share/<lz-string payload>`, falling back to a file when the link would be too long. **Opening a share link creates a copy and never overwrites the student's autosaved work.** | A link reopens the same circuit in a fresh browser profile, and the existing sandbox is unchanged. Malformed files or links give a friendly error, not a crash. | Nov 2 |
| **P1.10** | **Lesson framework skeleton.** Lesson schema (with the `liveOutputs` and `truthTable` options, and Markdown prose files), runner UI (instruction panel, steps unlocked in order, a "Check" button that uses the checker, hints revealed one at a time), progress store, `lessons:drafts` script, and **one demo lesson** ("NOT and AND") with draft bullet text and reference solutions, plus the content test (solution passes, starter fails). | The demo lesson can be completed end to end; progress survives a page reload; the content test runs in CI. | Nov 2–3 |
| **P1.8** | **Milestone 1 demo.** Deploy, write a demo script, record the video. | The deployed build shows: sandbox, live simulation, truth table, and the checker passing and failing. If ready, it also shows the share link and the demo lesson. | **Tue Nov 3** |

**Milestone 1 cut line:**

- **Required for M1:** P1.0–P1.7 and P1.8.
- **Planned before M1, but can slip:**
  - P1.9 (saving and sharing).
  - P1.10 (lesson skeleton), which can slip to Nov 4 at the latest, because lessons 1–4
    depend on it.
- **If time runs short,** cut in this order: label editing and gesture CSS (from P1.5b),
  then P1.9's share link (keep file export), then P1.10's runner polish. Never cut the
  checker or the tests.

### Phase 1 exit criteria

- [ ] In current desktop Chrome, Edge, Firefox and Safari, a student can build, simulate and
      inspect a circuit with a mouse. With touch emulation, they can do the same using taps
      only. Verified by the Playwright tests (Chromium, Firefox and WebKit). A manual pass on
      a real iPad is optional.
- [ ] The checker verifies a circuit against a spec, reports the exact wrong rows and the
      structural problems, and matches the misconception signatures.
- [ ] The demo lesson runs end to end: steps unlock in order, hints work, and progress is
      saved.
- [ ] CI is green and `main` deploys to GitHub Pages automatically.
- [ ] The `sim/` boundary is enforced by both the tsconfig and the lint rule.
- [ ] Unit tests cover all gate truth tables and every engine and checker scenario listed
      above.

### Explicitly out of scope for Phase 1

- Drawn wire routing.
- Multi-bit buses.
- Push button, seven-segment and other displays (Phase 2).
- Lesson content beyond the demo lesson (Phase 2).
- Hint *text* for misconception signatures, prediction mode, and the "tried rows" nudge
  (Phase 2).
- Teacher features (Phase 3).
- Sequential logic and clocks (Phase 4 stretch).
- Subcircuits (post-course).
- Building circuits with the keyboard alone. This is a known accessibility limit; the toolbar
  and lesson navigation still work from the keyboard. See §8.

---

## 5. Scaffolded lesson plan (order confirmed by the author)

The author writes the final lesson text. Claude's placeholder text is short bullet points
covering these topics (§3.7).

Each lesson moves from **direct instruction** to **guided construction** (with locked I/O and
a restricted palette) to **open construction**, then ends with an automatically checked
**challenge**. Failing the challenge leads to **remediation**, chosen by misconception
signature. Each unit ends with an **open project**. Optional test-outs come before each unit.

Two habits run through every lesson, taken from ICER '08:

- **"Check every row, starting with all zeros."** The tried-rows indicator and a closing
  "re-read the rule and check each row" prompt support this.
- **At least one challenge per lesson in predict-first mode**, with live outputs hidden.

| # | Lesson | Key ideas | Example challenge | Standards |
|---|---|---|---|---|
| 0 | *Editor tour* (skippable) | Placing parts, wiring, toggling, undo | Wire a switch to a light | — |
| 1 | Signals: on/off, 0/1 | Inputs, outputs, binary signals, unknown (X) means "not connected" | Two switches, two lights; label them | IB A1.2.3 |
| 2 | NOT and AND | Gate behavior, reading a truth table | "The light is on only when both switches are on" | A1.2.3–A1.2.4 |
| 3 | OR and XOR | Inclusive vs exclusive "or" (everyday "or" often means XOR); tracing multi-gate circuits | Build `(A AND B) OR C` from its table; tell OR and XOR apart on the `1,1` row | A1.2.4–A1.2.5 |
| 4 | From circuit to truth table | Building full truth tables by hand, then checking with the tool | Predict the whole table (predict mode), then verify it | A1.2.4 |
| **U1 project** | *Open project:* e.g. a door alarm or voting machine | Free design with basic automatic criteria | Rubric (hidden; for teachers) | CSTA 3B-CS-02 |
| 5 | NAND and NOR | "Not both" (NAND) vs "exactly one" (XOR): they differ only when both are off. NAND is universal: build NOT, AND and OR from NAND only. | "Only NAND" constraint | A1.2.3 |
| 6 | XNOR, implication, and English → logic | "If and only if" / "exactly when" is XNOR, not AND. **"If A then B" is implication, `NOT A OR B`**: it is broken only when A is on and B is off, and **a false "if" never breaks the rule**. Logic "if" is a rule, not cause and effect, unlike `if` in code. Method: **translate each rule separately, then AND them**. | Build "if A then B" from NOT and OR. Then a word problem with 2–3 rules (sandwich-shop style) | A1.2.5 |
| 7 | From truth table to circuit | Sum of products: each 1-row is "exactly this combination", so "by itself" and "without" need NOTs. Boolean expressions ↔ diagrams; notation (`NOT A` = `Ā` = `!A`) | Build a circuit from any 3-input table | A1.2.4–A1.2.5 |
| 8 | Useful circuits: adders | Half adder, full adder, 2-bit adder | Full adder | CSTA 3B-CS-02 |
| **U2 project** | *Open project:* e.g. drive a seven-segment display from switches | Uses Phase 2 display parts | Rubric | — |
| 9 *(stretch)* | Memory: latches and clocks | Feedback, SR latch, D latch | Store one bit | — |

---

## 6. Later phases (each is built on the Phase 1 seams above)

### Phase 1b: Accessibility and localization (from beta feedback, before M1)

The author's beta testing (2026-10-29) added §3.9 and §3.10:
- display preferences saved persistently (high contrast, dark mode, dyslexia-friendly font);
- built-in narration;
- screen reader support for lessons, including building circuits without a pointer;
- lesson text organized by language, ready for translations.

### Phase 2: Lessons and guidance (Nov 2 – Nov 13, M2)

This is the heaviest phase. Work in this **priority order**:

1. **Lessons 1–4**, progress gating, the hint ladder (progressive hints, plus a gate-reference
   "reminder" card), and progress export/import. *Week of Nov 2.*
2. The **misconception-signature hints**, the tried-rows nudge, and the Unit 1 project with
   the automatic grader's basic criteria ("uses at least N gates", "every output depends on
   every input"). *Week of Nov 9.*
3. **Lessons 5–8**, push button, seven-segment display and multi-color lights, and the Unit 2
   project. *Week of Nov 9.*
4. **Prediction mode**, optional test-outs, and remediation branches. *These can slip into
   Phase 3.*

**Lesson text:** Claude ships each lesson with bullet-point placeholder prose (from
`docs/curriculum-outline.md`), check specs, circuits and hints. The author replaces the
prose in the Markdown files whenever ready; this is independent of the code, and
`lessons:drafts` tracks what is left. Lesson 6 is the heaviest, so implication gets its own
guided steps and remediation (the {0,0}, {0,1} signature).

**Fallbacks** (from the proposal's feasibility section): shorter lessons and written
material, and briefer feedback on projects.

*Seams it relies on:* the registry and `io` roles; the structured `CheckResult` and
signatures; the progress store; the lesson step types and options.

### Phase 3: Instructor support and beta (Nov 16 – Nov 27, M3)

- **Teacher materials:** a teacher guide (onboarding, pacing for 45/50/90-minute periods,
  hidden rubrics) and downloadable PDFs.
- **Bypass codes**, checked as hashes in the browser. They discourage students but are not
  secure, and the docs say so.
- **Completion codes** or a printable progress report a student can show a teacher. These are
  tamper-evident rather than tamper-proof.
- A teacher "answer key" view.
- **Beta testing:**
  - **Testers:** the author and peers (adults), on their own desktop browsers. Follow the
    course's policy for peer testing.
  - Have the **beta build, opt-in progress export and survey ready by about Nov 20**, because
    Thanksgiving (Nov 26) falls in the testing week.

*Seams it relies on:* the progress store holds no personal information and can be
serialized; lesson data includes reference solutions.

### Phase 4: Stretch, polish, report (Nov 30 – Dec 14)

- **Sequential logic** (clock, SR/D latches, flip-flops), with the §3.5 settling strategy and
  possibly sequence-based tests like Digital's.
- A single-step "slow motion" propagation view.
- Accessibility and performance polish; offline PWA.
- **Proposal deliverables:**
  - Write the **user instructions**.
  - Complete the **evaluation document**. It *designs* the high-school control-group study
    (a pre/post index built from IB A1.2.3–A1.2.5 items, AP CSP Boolean-expression items
    only, candidate ICER '08 / DLCI items, surveys, board and parental approval). The study
    is not run this term.
  - Write the final report and record the walkthrough video.

*Seams it relies on:* the event-driven engine; `state` in `evaluate`; oscillation handling.

### Later / post-course

Drawn wire routing (`waypoints`); subcircuits / custom chips, flattened at compile time as
Digital does; multi-bit buses; a custom domain; an optional backend, never required.

*Seams it relies on:* wire waypoints; the registry and type namespaces; the storage adapter.

---

## 7. Open questions for the author

None of these block work. Claude proceeds with the **default** shown unless told otherwise.

1. **Pages source:** is Settings → Pages → Source set to **GitHub Actions**? P1.0 deploys with
   `actions/deploy-pages`, which needs it. If it is "Deploy from a branch", switch it.
   *Default: Claude assumes it will be GitHub Actions by the time P1.0 lands.*
2. **License:** the repo is now public. *Default: MIT.* CircuitVerse is MIT; Logisim and
   Digital are GPL, so no code or assets are copied from them.
3. **Gate symbols:** *Default: ANSI/IEEE distinctive shapes*, which IB and US materials use.
   IEC rectangular symbols could be added later as a toggle.
4. **Site name:** *Default: "LogicLearn"*, after the repo name.
5. **Milestone 1 video:** are there rubric items or a length limit? This is optional; it
   shapes the P1.8 demo script.
6. **Evaluation items:** whether to contact the ICER '08 / DLCI authors about adapting
   their items. *Phase 4; low priority.*

---

## 8. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Phase 1 is compressed (the Oct 19 prototype was not built) | High | Strict M1 cut line; the headless engine first so Claude Code can test it quickly; split the editor work into P1.5a and P1.5b; one demo lesson rather than many. |
| Phase 2 is overloaded | High | §6 priority order; the proposal's fallbacks (shorter lessons and written material, briefer project feedback); test-outs and remediation may slip into Phase 3. |
| Touch problems on real tablets (only emulation is tested) | Low–Medium | Tap-only Playwright tests in CI; tap-to-add and tap-to-connect fallbacks; the §3.8 gesture CSS; an optional manual iPad pass if a device is at hand. |
| Progress lost (Safari's 7-day storage deletion, also on desktop; private windows; cleared browser data) | Medium | `navigator.storage.persist()`; student progress export/import (Phase 2); later, a PWA added to the Home Screen. |
| Unsolvable or trivially solved lesson content written in a hurry | Medium | CI content test: solution passes, starter fails. |
| Beta testing overlaps Thanksgiving week (Nov 26) | Medium | Line up peers now; beta build ready by about Nov 20. |
| A district blocks the hosting domain | Medium | The app is static and can move hosts (`base: './'`); custom domain; PWA/offline build later. |
| Accessibility and adoption | Medium | The DOJ's ADA Title II rule requires public entities' web content to meet **WCAG 2.1 AA**: by **Apr 26, 2027** for populations of 50,000 or more, and **Apr 26, 2028** for smaller ones (after a one-year extension in April 2026). Schools may need this from the tools they adopt. §3.9 targets AA: high-contrast and dark themes, a dyslexia-friendly font, built-in narration, screen reader support, and a Connections panel so circuits can be built without a pointer. Checked by axe-core scans in CI plus a manual screen reader checklist. |
| The editor turns out too hard to build openly (proposal's worst case) | Low | Fall back to a slot-based grid editor; the data model is unchanged. |
| Scope creep from stretch features | Medium | §4 out-of-scope list; stretch work only after M3. |
| Simple bypass and completion codes are worked around | Low impact | Documented as discouragement only; teachers can also ask for exported project files. |

---

## 9. Sources

- Herman, G. L., Kaczmarczyk, L., Loui, M. C., & Zilles, C. (2008). *Proof by Incomplete
  Enumeration and Other Logical Misconceptions.* ICER '08. (The author provided a copy; it is
  not committed, per the ACM copyright notice.)
- Herman, G. L., Loui, M. C., Kaczmarczyk, L., & Zilles, C. (2012). *Describing the What and
  Why of Students' Difficulties in Boolean Logic.* ACM TOCE.
- DLCI: https://ideals.illinois.edu/items/25021 ·
  https://people.cs.vt.edu/~kafura/CS6604/Papers/Digital-Logic-Concept-Inventory.pdf
- Logisim oscillation docs: https://cburch.com/logisim/docs/2.3.0/guide/prop/oscillate.html
- Logisim value model ("shortcomings"): https://cburch.com/logisim/docs/2.0.3/guide/prop/shortcome.html
- Digital (hneemann): https://github.com/hneemann/Digital
- CircuitVerse docs: https://docs.circuitverse.org/ · Interactive Book: https://learn.circuitverse.org/about.html
- React Flow touch-device example: https://reactflow.dev/examples/interaction/touch-device
- CSTA K-12 standards (2017 revision): https://csteachers.org/wp-content/uploads/2025/03/csta-k-12-computer-science-standards-revised.pdf
- IB CS 2027 A1.2 (third-party summary): https://www.tes.com/teaching-resource/ib-computer-science-2027-a1-2-data-representation-and-computer-logic-complete-bundle-13550815
- ADA Title II deadline extension: https://www.sog.unc.edu/node/374666 ·
  https://3playmedia.com/blog/title-ii-deadline-extended/
- School filter blocking GitHub (anecdotal): https://www.change.org/p/unban-github-for-lcps-high-school-students

*Not independently verified from this environment (hosts blocked): the cburch.com,
reactflow.dev and csteachers.org pages, and the change.org petition.*

---

## 10. Review log

**v1 → v2** (2026-10-29). Changes from an independent sub-agent review of v1 against the
proposal, plus the ICER '08 paper:

- **Prerequisite:** added the Pages prerequisite (repo is private, Pages disabled).
- **M1 demo:** added a "Target" check panel to P1.6 so the M1 demo can show the checker.
- **Engine:**
  - Fixed the oscillation test: a NOT gate looped on itself settles at X.
  - Defined the tick budget, and reset schedules every component.
  - Documented that the SR latch needs a settling strategy in Phase 4.
- **Truth table and checker:**
  - Added `io` roles, plus the `EXTRA_IO` and `DUPLICATE_LABEL` diagnostics.
  - `CheckSpec` is now data only.
  - Constraints skip I/O parts.
  - Added misconception signatures from ICER '08.
- **Routing and sharing:**
  - Separate `#/share/` route, which opens a copy.
  - `base: './'`.
- **Browsers and devices:**
  - Browser support matrix.
  - iPad gesture CSS.
  - Handle hit areas under zoom.
  - Tap-to-add uses the next free cell.
  - Tap-only Playwright tests.
  - Split P1.5.
  - A manual pass on a real iPad.
- **Progress storage:** durability (`persist()` and progress export/import).
- **Lessons:**
  - Content test also checks that starters fail.
  - `liveOutputs` and predict-mode seams.
  - Tried-rows tracking.
  - Curriculum reordered per ICER '08.
- **Phases and wording:**
  - Phase 2 priority order and the proposal's fallbacks.
  - Thanksgiving and beta-tester consent.
  - Restored the Dec 7 deliverables (instructions, evaluation document).
  - Clarified that the evaluation study is designed, not run.
  - Reworded "no data collected" to "the app never sends data".
- **Risks and sources:**
  - ADA Title II risk.
  - Corrected the research attribution.
  - Softened the claim about districts blocking hosting sites.

**v2 → v3** (2026-10-29). The author's answers:

- **Repository:** renamed to `nat-160/LogicLearn`, made public, and Pages enabled. The §1
  prerequisite is resolved; only the Pages source setting still needs confirming (§7).
- **Milestone 1 is Tue Nov 3.** §4 is re-dated: P1.5b is now required for M1, and P1.9 and
  P1.10 are planned before M1.
- **Curriculum:**
  - The order is confirmed.
  - Implication is now core in Lesson 6.
  - "By itself" and "without" moved to Lesson 7, alongside sum of products.
- **Lesson text:** the author writes the final prose. Claude writes bullet-point placeholders
  in separate Markdown files, tracked by `lessons:drafts`.
- **Testing:** the testers are the author and peers, using modern desktop browsers. The
  legacy support matrix and the old-device risk are removed. Touch stays in the design and
  is tested by emulation only.
- **Standards:**
  - AP CSP does not cover logic gates, so the evaluation index uses IB, plus AP only for
    Boolean expressions.
  - IB codes are accepted as correct.
- **Hosting:** the hedged wording about hosting-site blocking stays.

**v3 → v4** (2026-10-29). The author's beta feedback:

- **Spec:** added §3.9 (accessibility and display preferences) and §3.10 (localization
  skeleton), plus a Phase 1b entry for them.
- **Risks:** the accessibility row now points at those features instead of listing
  keyboard-only building as a gap.

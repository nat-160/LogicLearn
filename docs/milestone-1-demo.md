# Milestone 1 demo script (about 5 minutes)

**Set-up before recording**

- Open the live site (https://nat-160.github.io/LogicLearn/) in a fresh browser window
  (or a private window, so the sandbox starts with the example circuit and no progress).
- Window about 1366×768, zoomed to 100%. Have `src/sim/simulator.ts` and
  `src/sim/misconceptions.ts` open in an editor for the code segment.
- Optional: Chrome DevTools device toolbar set to "iPad Air" to show touch use.

---

### 1. The problem (30 s)

- High school CS classes need a way to teach logic gates on **locked-down Chromebooks
  and iPads**, with structure that teachers can rely on.
- Logisim is great but is a Java desktop app with no guided lessons. LogicLearn is
  web-native, needs no account, and adds scaffolded lessons with automatic checks.

### 2. The sandbox (60 s) – _Sandbox tab_

- Show the example AND circuit. Flip **A** and **B**: wires turn bright and thick for 1,
  dark and thin for 0 (never color alone).
- Point at the **truth table**: the highlighted row follows the switches. **Tap a row** to
  set the switches. Point out the ✓ marks and "tried 3 of 4": students tend to test only
  a few rows (research: _proof by incomplete enumeration_), so the tool makes it visible.
- Delete a wire: the light shows **?** and the wire turns gray dashed – unknown (X).

### 3. Building by tapping (60 s)

- Click **New**. Tap **Switch** twice, **XOR**, **AND**, **Light** twice: each lands in a
  free spot. (Dragging also works.)
- Connect by **tapping one pin, then another** – no precise dragging needed on a tablet.
- Flip the switches: a half adder. Show **Undo/Redo**.

### 4. The checker and misconceptions (45 s)

- Choose target **"One or the other, not both"**, but build it with **OR**.
- Press **Check my circuit**: "1 of 4 rows are wrong", the 1,1 row is marked, and the
  hint names the mistake: _"Your circuit acts like OR…"_.
- Explain: the checker tries **every** row; the pattern of wrong rows identifies the
  likely misconception (from Herman et al., ICER '08).

### 5. A lesson (60 s) – _Lessons tab → NOT and AND_

- Step 1: explanation + example circuit to explore (draft text marked "Draft text").
- Step 2: locked switch and light, limited parts list. Press **Check** too early → "Not
  yet"; show a **hint**; build NOT → "Correct!" → next step unlocks. Steps can't be skipped.
- Jump to the challenge (complete steps 3–4 quickly, or describe it): **predict first** –
  the light shows "?" and the truth table is hidden until Check.
- Progress is saved in the browser; no account, no data leaves the device.

### 5b. Accessibility (45 s) – _⚙ Accessibility, top right_

- From beta testing: open **⚙ Accessibility**.
  - Turn on **High contrast** (the canvas and wires stay readable: thick = 1, thin = 0).
  - Then **Dark mode** (four themes in all).
  - Then the **Dyslexia-friendly font** (OpenDyslexic plus wider spacing).
  - Reload to show the settings are remembered.
- On a lesson step press **Read this step aloud**: built-in narration, no server needed.
- Show **View and edit connections** and **Circuit as text**: a whole circuit can be built
  and read without a mouse or touch screen.
- Mention that automated WCAG checks (axe-core) run in every theme on every change.

### 6. Under the hood (30 s) – _code editor_

- `src/sim/simulator.ts` header comment: event-driven, unit-delay simulation; handles
  loops later (memory), and catches circuits that never settle (show the NAND loop banner
  if time allows).
- The simulation core has no UI code (enforced), ~100 unit tests, Playwright tests with
  mouse **and** touch, and CI that deploys to GitHub Pages.

### 7. Next (15 s)

- Phase 2: Lessons 1–8, hints from misconception signatures, progress gating, test-outs,
  seven-segment display, open projects with an automatic grader.
- Phase 3: teacher materials, bypass/completion codes, beta testing with peers.
- Lesson text is already organized by language, ready for an `es-US` translation.

---

**If something goes wrong on camera:** the sandbox can be reset with **New**, or open the
site in a private window. The NAND loop demo: add a NAND, wire A → in0, wire its output
back to in1, then flip A on.

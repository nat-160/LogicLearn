# Milestone 2 demo script (about 6 minutes)

**Set-up before recording**

- Use the test site (https://nat-160.github.io/LogicLearn/dev/) in a fresh or private
  window. On **Lessons**, tick **Unlock all lessons** (test version only) so you can jump
  to any step. To show gating, first record section 1 before ticking it.
- Alternatively, on the live site, load a progress file saved from a run-through
  (**Lessons → Load progress from a file**).
- Window about 1366×768, zoomed to 100%. Have `src/sim/grader.ts` and
  `src/lessons/content/unit-1-project/index.ts` open in an editor for the code segment.

---

### 1. The course path (40 s) – _Lessons tab_

- Lessons are grouped into **Unit 1: Gates and truth tables** and **Unit 2: Building
  with gates**: Lessons 0–8 and a project per unit.
- In a fresh browser only the editor tour and Lesson 1 are open. A locked card says
  **"Finish Lesson 1 first"** (in words, not just a lock icon).
- The unit project (★) opens after the unit's lessons but never blocks the next unit.
- **Home → Continue** goes to the first step not yet done.
- **Save my progress to a file / Load progress from a file**: progress stays on the
  device (no accounts), so the file carries it to another computer. Loading never undoes
  progress or overwrites a circuit.

### 2. Help when stuck (40 s) – _Lesson 2, "Build it: AND"_

- **Show a hint**: hints come one at a time; the last guided hint is **"Show me how"**.
  Revealed hints stay revealed after a reload.
- After two failed checks without a hint, a note says **"Stuck? A hint is ready"**.
- Open the **Gate reminder**: the gates taught so far, with truth tables computed by the
  simulator itself.

### 3. Feedback that names the mistake (50 s) – _Lesson 3, "Build it: XOR"_

- Build **OR** instead of XOR and press **Check** without trying the rows: "You have
  tried 1 of 4 rows", with a **Try row A = 0, B = 1** button and **Check anyway**
  (research: students test only the rows that confirm their guess).
- Press **Check anyway**: "acts like OR… what should happen when both inputs are 1?" –
  the misconception is recognized from the pattern of wrong rows (Herman et al., ICER '08).
- Below the result: **"Want a short practice on this first? Practice: OR or XOR?"**
  Open it: predict OR and XOR side by side, see that only the 1,1 row differs, then
  **Back to step 4**. Practice never counts towards finishing the lesson.
- Mention: Phase 2 checks each output and each rule of a word problem separately, and
  also spots an inverted output and an output that ignores an input.

### 4. Predict first (45 s) – _Lesson 4, "Predict a truth table"_

- The light is hidden. Fill in Y for each row (radio buttons 0/1, big enough to tap).
- **Check my predictions** with a blank: focus jumps to the first blank.
- Complete it with one wrong row: the answers appear, marked **✓ right / ✗ wrong**.
- In the challenge, every row must be right; after a miss, a **different circuit**, so
  the answer can't just be copied.

### 5. New parts (40 s) – _Sandbox_

- **Push button**: on only while held (mouse, touch, or Space/Enter; with a screen
  reader one click holds it).
- **Seven-segment display**: one truth-table column per segment (`D.a` … `D.g`); it says
  which digit it shows ("Seven-segment display D: shows 2").
- **Light colors** (Inspector): the color is part of the light's name, never the only cue.

### 6. The Unit 1 project (70 s) – _Unit 1 project → step 2_

- Choose **Door alarm** (or **Voting machine**).
- **Your rule**: the brief gives 6 rows; the student decides the 2 open ones (does the
  panic button work when the alarm is off?). The rule is checked live: "keeps the cases
  the brief gives", "uses every input".
- Build L = P OR (D AND R); press **Check my project**: a checklist of **✓ Done** lines.
- Remove the panic button's wire and check again: **✗ Not yet: L never changes when P
  changes – is P connected?**
- Unit 2's project drives the display: switches A, B show 0–3.

### 7. Under the hood (30 s) – _code editor_

- `src/sim/grader.ts`: criteria are plain data; the grader returns codes and numbers,
  the screens write the words (ready for translation).
- `unit-1-project/index.ts`: each brief ships an example rule and circuit; content tests
  prove every example passes, every starter fails, and every lesson step is solvable.
- About 500 unit and content tests and about 150 browser tests (mouse and touch), with
  accessibility scans of every new screen in all four themes.

### 8. Next (15 s)

- Phase 3: teacher guide and answer key, bypass and completion codes, practice steps
  after a recognized mistake, unit test-outs, and the beta with peers.
- The author's final lesson text replaces the draft bullets (`npm run lessons:drafts`).

---

**If something goes wrong on camera:** **Start over** resets a lesson step (and can be
undone); a private window starts with no progress.

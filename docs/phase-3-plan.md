# Phase 3 plan: feedback sprint and teacher tools (Nov 27 – Nov 30)

## Context

Phase 2 is released: PR #5 went into `dev`, and the author merged the release PR #6 into `main` (d6b8ae5, Nov 27). The `main` deploy run passed (CI run 48, Nov 27). My working branch is already at `dev`'s head.

Peer feedback on Milestone 2 asked for:

1. **Hints that get more specific**, with something still left to work out after the last one: the gate's rule → the student's own circuit → one input row worked through. (The suggested timer between hints is out of scope; the author excluded it.)
2. **Corrective feedback that shows a failing input**, not just "incorrect".
3. **Short explanations of each topic after a failure**, covering the reasoning and not just the steps.
4. **Text alternatives for every graphic.**
5. **A small celebration**, with a graphic and a sound, when a lesson is finished.

**The author's decisions (Nov 27):**

- Sprint to about **Nov 30**, ending with a minimum working version of everything.
- Explanations are **in-app walkthroughs**, not recorded videos.
- **Drop the "Show me how" full-answer hint.** Full answers live only in the teacher answer key.
- **Keep all four planned Phase 3 items:** the teacher guide and answer key, the completion report, bypass codes, and unit test-outs.

Beta and survey work is not part of this sprint.

## Research behind the design

- **Hint ladders.** Tutors usually go pointing → teaching → bottom-out. Students who game the system click through to the bottom-out hint. Evidence that bottom-out hints help learning is weak.
  - Design: replace the bottom-out with a hint that works through one row but still leaves the fix to the student.
  - Sources: [LearnLab: Hint sequence](https://learnlab.org/research/wiki/index.php/Hint_sequence), [O'Rourke et al. 2014](https://grail.cs.washington.edu/wp-content/uploads/2015/08/orourke2014hsm.pdf), [Razzaq & Heffernan 2010](https://web.cs.wpi.edu/~nth/pubs_and_grants/papers/2010/ITS/Razzaq%20Hints%20Is%20It%20Better%20to%20Give%20or%20Wait.pdf), [An et al., LAK 2026](https://www.cs.cmu.edu/afs/cs.cmu.edu/Web/People/bmclaren/pubs/AnEtAl-RevisitingTheHintButton-LAK2026.pdf).
- **Counterexamples.** A failing example beats bare right/wrong feedback, and works better paired with an explanation; a bare "this failed" can encourage gaming.
  - Design: show one example row together with a trace through the circuit.
  - Sources: [D'Antoni et al., TOCHI 2015 (automata)](https://microsoft.com/en-us/research/wp-content/uploads/2016/12/tochi15.pdf), [Heickal & Lan 2026](https://arxiv.org/abs/2606.08807), [arXiv 1906.08937](https://arxiv.org/pdf/1906.08937).
- **Explainer length and style.** Segments under 6 minutes, with Khan-style step-by-step drawing, are the most engaging.
  - Design: walkthroughs are a few short frames on the circuit itself, paced by the student.
  - Source: [Guo, Kim & Rubin 2014](https://up.csail.mit.edu/other-pubs/las2014-pguo-engagement.pdf).
- **Rewards.** Gamification has a small positive effect overall. Badges alone, or points and leaderboards, risk an overjustification effect.
  - Design: the celebration names what the student learned. No points, streaks or leaderboards.
  - Source: [meta-analysis, PMC8037535](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8037535/).
- **WCAG.**
  - 1.1.1 text alternatives.
  - 2.3.1 no flashing.
  - `prefers-reduced-motion` for animation.
  - 1.4.2 audio control: sound is off by default, and a setting turns it on.
  - 2.2.2 pause: walkthroughs are paced by the student, with no auto-advance.

## Codebase facts the plan relies on

- `CheckResult.mismatches` has `{inputs, expected, actual}` for every wrong row (`src/sim/checker.ts`).
- `CheckResultView` and `summarizeCheck` (`src/editor/CheckPanel.tsx`, `checkSummary.ts`) show "N of M rows are wrong".
- The hint pieces:
  - `HintLadder` / `useHintLadder` (`src/lessons/`) handle authored hints and `revealHint(level)`.
  - The `showMeHow` label is in `HintLadder.tsx`.
  - Answer-style draft hints are in `nand-and-or.md`, `by-itself.md`, `full-adder.md`, `digits.md`, plus a few last hints that are effectively answers (door alarm, voting, build-not-both).
- `Simulator.pinValue(id, pin)` and `evaluateRow` (`src/sim/truthTable.ts`) can settle one row. `describe.ts` has `partName` and `pinName`.
- Routes (`src/app/routes.ts`): new pages follow the `practice` pattern. `App.tsx` focuses the page's h1 on every route change.
- Preferences (`src/settings/preferences.ts`) are sanitized field by field. The settings dialog is `SettingsDialog.tsx`.
- Every SVG today is `aria-hidden`, next to visible text or inside a named node. The logo `<img alt="">` sits beside the "LogicLearn" text. Lesson Markdown has no images.
- Gating: `gating.ts` (`isLessonComplete`, `isLessonUnlocked`, `nextStepFor`). Practice steps sit outside the numbering. The project `kind` already exists.

## Work packages (one PR into `dev`; release PR `dev → main` on Nov 30)

**P3.1 Show a failing row, and trace it (feedback 2)**

- New `src/sim/trace.ts`:
  - `traceRow(doc, bitsByLabel)` returns `{steps: {id, type, inputs: Value[], output: Value}[], outputs}`.
  - Gates come in dependency order from the inputs; parts in a loop are appended last.
  - Unit tests.
- `CheckResultView` and `summarizeCheck` add an example to a failed result:
  > "For example, A = 1, B = 0: your circuit gives Y = 1, the task wants 0."
  - A **Set the switches to this row** button uses `store.setInputs`.
  - The example is the first mismatch, preferring a row the recognized misconception points at.
  - It works in lessons, practice steps and the sandbox's target check.
- Grader `matches-rule` details gain the example row. `criterionText` shows it in the project checklist.

**P3.2 A three-level hint ladder (feedback 1–2; no full answers)**

- Build and practice steps:
  1. The step's **authored hints**: the gate's rule or the idea, never the answer.
  2. A generated **"Look at your circuit"** hint.
  3. A generated **"Try one row"** hint.
- The generated hints are worked out from the circuit as it is now, with a silent check that is not counted as an attempt:
  - If the circuit passes: "already right – press Check".
  - If something is missing or unconnected (for example an unconnected input): point at it and highlight that part.
  - If an output is wrong: name the gate that drives it ("Look at OR gate 1: it drives Y, which is wrong in 1 of 4 rows"), plus the misconception's input when one is known.
  - "Try one row" walks the trace (P3.1) for one wrong row: "With A = 1, B = 1, OR gate 1 gets 1 and 1 and gives 1, so Y is 1. The task wants 0." It ends with a **Set the switches** button and leaves the fix to the student.
- In a predict-first challenge, the generated hints wait until the first Check, so they don't reveal hidden values.
- Remove the "Show me how" label. Rewrite the answer-style draft hints into concept hints. A content test fails if a hint starts with "Show me how".
- Predict steps and projects keep their authored hints, with the answers removed.

**P3.3 Celebration on finishing (feedback 5)**

- New page `#/lesson/<id>/complete`, reached from "Finish lesson ✔" and "Finish project ✔". It redirects to the lesson if the lesson isn't complete.
- The page shows:
  - an SVG badge drawn from theme tokens (`role="img"`, named "Badge: Lesson 3 complete");
  - "Lesson 3 complete!" and what was learned (the lesson's `introduces` and summary);
  - a "Unit complete" line when it applies;
  - a **Next** button, "Back to lessons", and a reminder to save progress.
- A short CSS burst animation runs only without `prefers-reduced-motion`, and never flashes.
- **Sound:** a two-note chime made with Web Audio (no audio file). It plays only if the new **Sound effects** setting is on; the default is off. The setting lives in `Preferences.sounds` (sanitized) and the Accessibility dialog.

**P3.4 Text alternatives, kept that way (feedback 4)**

- An e2e test on the main pages: every `img`, `svg` and `[role=img]` has an accessible name, or is hidden next to visible text.
- A content test: any Markdown image in lesson text needs alt text.
- New graphics (the badge, the walkthrough canvas) get names.
- `docs/accessibility.md` gains a "Text alternatives" table: each graphic and its text alternative.

**P3.5 In-app walkthroughs (feedback 3)**

- `LessonDef.walkthrough`: a circuit (normally the explain step's example) plus frames `{inputs, highlight?: partIds[]}`.
- Captions are in `<locale>/walkthrough.md`: a title, then one bullet per frame that explains **why**. A content test checks that the frame count equals the caption count.
- The page `#/lesson/<id>/walkthrough` shows a read-only editor that sets the switches and highlights the parts for each frame.
  - It has the caption, "Frame 2 of 5", **Back / Next**, and Read aloud; with automatic reading on, each frame is read.
  - It ends with a "Back to step N" link.
- **Offered:**
  - after a failed check on the lesson's build steps ("Watch how it works"), next to the practice offer;
  - from the lesson's explain step.
- Draft walkthroughs for Lessons 1–8, 4–6 frames each.

**P3.6 Teacher area: guide and answer key**

- `#/teacher` asks for a **teacher code**. The app stores only its SHA-256 hash (`crypto.subtle`); I give the plain code to the author in chat. Teacher view stays on in this browser until "Leave teacher view".
- The docs say plainly that the code discourages students but is not security: the repository is public.
- **Teacher guide:** `content/_teacher/en-US/guide.md`, a draft for the author. It covers:
  - onboarding;
  - pacing for 45, 50 and 90-minute periods;
  - the hidden project rubrics;
  - how progress, reports and codes work;
  - accessibility.
    It has print CSS, so "Print → Save as PDF" makes the handout.
- **Answer key:** one lesson at a time, each step in a `<details>` that renders lazily:
  - the solution, in a read-only editor, with its truth table;
  - predict steps' circuits and tables;
  - practice solutions;
  - project brief examples.

**P3.7 Unlock (bypass) codes**

- Each lesson gets a 6-character code derived from a salted SHA-256 of its id. The teacher area lists all codes.
- A locked lesson card gets "Have a code from your teacher?", with a field that checks the code. Opened lessons are saved under `storageKey('unlocked')`.
- `isLessonUnlocked` respects these codes. They are labeled "discourages, not secure".

**P3.8 Progress report and completion code**

- New page `#/report`: a printable list of lessons and projects (done, steps, last activity), test-outs and practice.
- An optional name field is shown only for printing and **never saved**.
- **Completion code:** a bitset of finished lessons, the day number, and a 4-character salted checksum in base32 (`LL-XXXX-XXXX`).
  - The teacher area's **Check a code** decodes it and verifies the checksum. It is tamper-evident, not tamper-proof.
- Linked from the Lessons page and the celebration page.

**P3.9 Unit test-outs**

- `kind: 'test-out'`: one per unit, made of that unit's challenge steps under new ids:
  - Unit 1: `not-and/challenge`, `or-xor/exactly-one`, `circuit-to-table/challenge`.
  - Unit 2: `nand-nor/neither`, `xnor-if-then/three-rules`, `table-to-circuit/any-table`.
- No hints, practice or walkthrough offers on test-out steps.
- **Passing it:**
  - counts the unit's lessons as complete for gating (`isLessonComplete` checks the unit's test-out), without writing fake step records;
  - shows "Tested out" on those lesson cards;
  - makes `nextStepFor` skip them, and opens the unit project.
- The Unit 1 test-out is open from the start; Unit 2's opens after Unit 1 is complete.
- It appears at the top of each unit: "Already know this? Take the Unit N test-out".

**P3.10 Docs, review, release**

- **Docs:**
  - `PROJECT_PLAN` §6 Phase 3 status, plus a v6 log entry;
  - `phase-3-report.md` and `milestone-3-demo.md`;
  - `accessibility.md` (sounds, motion, walkthroughs, hints, text alternatives);
  - `translating.md` (walkthrough and teacher-guide files);
  - `CLAUDE.md` (test-out kind, walkthroughs, teacher area, no full-answer hints);
  - `curriculum-outline.md`.
- An independent review sub-agent, then fixes.
- PR into `dev`. After the author tries `/dev/`, a release PR from `dev` into `main`.

**Order and cut line**

- **Nov 27:** P3.1, P3.2, P3.4.
- **Nov 28:** P3.3, P3.5.
- **Nov 29:** P3.6, P3.7, P3.8.
- **Nov 30:** P3.9, P3.10.

If time runs short, cut in this order:

1. test-outs;
2. the completion code (keep the printable report);
3. walkthroughs beyond Lessons 2, 3, 5 and 6;
4. the answer key's practice and predict sections.

## Defaults (unless the author says otherwise)

- Sound is off by default; the badge, message and announcement always appear.
- Generated hints and the counterexample wording are interface text in TypeScript. Walkthrough captions and the teacher guide are author-editable Markdown drafts.
- The teacher code and unlock salt are constants in the source, and their limits are documented.
- One PR into `dev` collects the sprint. Lesson text stays as drafts for the author.
- Still open from Phase 2 and left for Phase 4:
  - Lesson 8's blind 16-row challenge;
  - prediction challenges cycling back to their first circuit;
  - a second Unit 2 brief;
  - 3-input gates in the editor.

## Verification

- Every package: `npm run lint && npm run typecheck && npm test && npm run e2e`, plus `npm run build:dev`. CI adds Firefox and WebKit.
- **New unit tests:**
  - `traceRow`: order, X values, loops, multi-pin outputs;
  - choosing the counterexample row;
  - generated hint text for a passing, an unconnected and a wrong circuit;
  - completion code round trip and tamper detection;
  - unlock codes;
  - test-out gating;
  - sanitizing the sound preference;
  - walkthrough caption counts;
  - no hint starts with "Show me how".
- **New e2e tests:**
  - build OR for AND → the example row appears → "Set the switches" sets them;
  - hint levels 2 and 3 name the gate and the row;
  - finishing a lesson → celebration page (no animation under reduced motion; no sound by default);
  - a walkthrough, played with Next and Back;
  - teacher code → answer key → a code unlocks a lesson for a student;
  - report → completion code → verified in the teacher area;
  - passing the Unit 1 test-out opens Lesson 5 and the Unit 1 project;
  - every graphic is named or hidden.
- Axe in all four themes for the celebration, walkthrough, teacher, report and test-out pages.
- Screenshots of each new screen for a visual check. The independent review runs before the release PR.

# Phase 2 plan: Lessons and guidance (through Milestone 2)

## Context

Milestone 1 (Tue Nov 3) shipped Phase 1:

- simulator, editor, and checker with misconception signatures;
- one demo lesson (Lesson 2, "NOT and AND");
- accessibility settings, narration and per-language lesson text;
- a live/test site split (`main` → live, `dev` → `/dev/`).

`docs/PROJECT_PLAN.md` §6 schedules **Phase 2, Lessons and guidance, Nov 2 – Nov 13 (M2)**, in this priority order:

1. Lessons 1–4; progress gating; the hint ladder with a gate-reference card; progress export/import.
2. Misconception hints; the tried-rows nudge; the Unit 1 project and the grader's basic criteria.
3. Lessons 5–8; push button, seven-segment display, multi-color lights; the Unit 2 project.
4. Prediction mode, test-outs, remediation (may slip to Phase 3).

This plan covers the research and work breakdown for all of it. The author's decisions are listed in §9.

**Assumptions**

- M2 is due **Fri Nov 13**, as in the plan.
- Work happens in Claude Code sessions: feature branch → one PR per package **into `dev`** → the author tries the test site → release PR `dev → main` on Nov 13.
- The author writes the final lesson prose. Claude ships `<!-- draft -->` bullets.

## 1. Research findings that shape the design

- **Hint ladders.** Tutors go pointing → teaching → bottom-out hints. Students "abuse" help by clicking through levels in under a second (about 36% of actions in one study). Offering help proactively after errors is recommended. Bottom-out hints can work as worked examples, but asking for them right away reduces learning.
  - Design: the ladder is paced by _tries_, not timers (timers are a WCAG 2.2.1 concern). The last guided hint is the bottom-out. Challenges have no bottom-out.
  - Sources: [LearnLab: Help abuse](https://learnlab.org/research/wiki/index.php/Help_abuse), [Shih, Koedinger & Scheines 2008](https://www.cmu.edu/dietrich/philosophy/docs/scheines/Shih_Koedinger_Scheines_2008_EDM.pdf), [Razzaq & Heffernan 2010](https://web.cs.wpi.edu/~nth/pubs_and_grants/papers/2010/ITS/Razzaq%20Hints%20Is%20It%20Better%20to%20Give%20or%20Wait.pdf).
- **ICER '08 misconceptions** (Herman et al.), already in plan §2.
  - Students swap a hard operator for an easy one that agrees on most rows; check only rows that confirm their guess; drop NOTs for "by itself"; combine rules in their heads.
  - Design: misconception detection per output column and per rule, a tried-rows nudge, practice steps, and "translate each rule, then AND them".
  - Sources: [ICER '08 paper](https://zilles.web.engr.illinois.edu/papers/misconceptions.icer08.pdf), [DLCI](https://zilles.web.engr.illinois.edu/papers/2010-SIGCSE-Creating-DLCI.pdf).
- **Implication.** Students resist "a false _if_ never breaks the rule" (the defective-conditional reading) and confuse a rule with its converse.
  - Design: Lesson 6 gets its own explain step and guided build, a "false if" practice step, and rule-level feedback.
  - Sources: [Teaching the material conditional](https://philarchive.org/rec/ENDTTT), [Durham study](https://durham-repository.worktribe.com/OutputFile/1514655).
- **Predict–observe–explain** with simulations has modest positive evidence, which supports prediction mode in Lesson 4 and the project rule table.
  - Source: [POE with simulations, 2025](https://avesis.metu.edu.tr/yayin/29d6c4b4-b5cb-433e-8740-c51e7ac6d0de/an-experimental-study-exploring-the-effects-of-predictobserveexplain-method-supported-with-simulations).
- **Fading worked examples** (Renkl & Atkinson) support explain → guided → open → challenge, with less help in challenges.
  - Source: [Renkl & Atkinson](https://faculty.engineering.asu.edu/mre/wp-content/uploads/sites/31/2020/02/Exp_Rev_LI06.pdf).
- **Expertise reversal** (Kalyuga et al. 2003): guidance that helps novices can hinder students who already know the material. This justifies optional test-outs, and moving the editor tour off the main path.
  - Source: [Wikipedia summary](https://en.wikipedia.org/wiki/Expertise_reversal_effect).
- **Momentary press-and-hold controls.** Screen readers can swallow keydown/keyup and send only a click, so a click-to-latch fallback is needed. `aria-pressed` is for toggles. Ignore key repeat.
  - Sources: [W3C WAI-IG thread](https://lists.w3.org/Archives/Public/w3c-wai-ig/2019JanMar/0095.html), [PhET issue](https://github.com/phetsims/scenery/issues/939).
- **Seven-segment convention** (active-high): segments a top, b top-right, c bottom-right, d bottom, e bottom-left, f top-left, g middle.
  - Digits: 0 = abcdef, 1 = bc, 2 = abdeg, 3 = abcdg, 4 = bcfg, 5 = acdfg, 6 = acdefg, 7 = abc, 8 = all, 9 = abcdfg.
  - Logisim's Button is a momentary input with a 1-bit output.
  - Sources: [Digilent](https://support.digilent.com/hc/en-us/articles/20367430334619-7-segment-display), [Logisim-evolution Button](https://mbaillif.github.io/Logisim-evolution-documentation/en/html/libs/io/button.html).
- **Grading open designs.** Matching the truth table plus separate structural criteria is the norm (JLSCircuitTester; DigiSim rubric advice).
  - Design: the grader returns a criteria checklist, not a single pass/fail.
  - Sources: [Kurmas ITiCSE '08](https://faculty.computing.gvsu.edu/kurmasz/papers/kurmas-iticse08.pdf), [DigiSim](https://digisim-marketing-dev.pages.dev/blog/grading-circuits-in-seconds-the-digisim-workflow).

## 2. Codebase facts the plan relies on (verified by exploration)

- **Lessons** (`src/lessons/`):
  - Steps are `explain` or `guided`/`challenge` (`types.ts`). Routes are `#/lesson/<id>/<n>` by position.
  - `progress.ts` keeps `StepProgress {done, attempts, hintsUsed, triedRows, firstSeen, lastSeen}` under `storageKey('progress:v1')`. `load()` barely validates it. There is **no lesson-level gating**.
  - `hintsShown` and predict-first `checked` are local state: they reset on reload, and hints get counted twice.
  - `LessonPage.tsx` (410 lines) holds every step view.
- **Misconception text is already written** in `src/sim/misconceptions.ts` (5 ids, 2-input/1-output only) and shown by `CheckResultView`. Nothing records the id or acts on it.
- **Truth table:** `findIO` and `outputValue` read only an output part's **first** pin, so a seven-segment display needs generic multi-pin output support. `requiredTypes` and `maxGates` look only at gates (parts without an `io` role).
- **Light colors already exist:** `Inspector.tsx` has `LIGHT_COLORS`, and the tokens are in all themes and forced colors. Colors are not validated on load (they go into a class name) and are missing from the accessible name.
- **Push button:** the simulator already supports it (`setInput`; `store.setInputs`). The node needs `nodrag nokey`, because React Flow treats Space as its pan key and Enter/Space as node selection.
- **Tried rows** start as `{current row}` and reset on every design change. The `circuitRow` mapping in `src/editor/useCheck.ts` is not exported.
- **Reusable pieces:**
  - `downloadCircuit` / `readCircuitFile` / `safeFileName` (`src/storage/storage.ts`)
  - the hidden `<input type=file>` pattern (`src/app/FileActions.tsx`)
  - `announce()` (`src/a11y/announcer.ts`)
  - `tell()` / `useSpeaker` (lesson narration)
  - `storageKey()`
  - `localizeLesson(def, locale, files)` with an injected files map (for tests)
  - `computeTruthTable`, `rowsFrom`, `findLoops`
  - `scripts/lesson-drafts.mjs` already walks any `content/*/<locale>/` folder.
- **CI hazards:**
  - 4 e2e call sites write the literal `'logiclearn:progress:v1'` (`lesson.spec.ts:56`, `accessibility.spec.ts:241,288`, `regressions.spec.ts:109`).
  - About 9 more e2e navigations into `not-and` have no progress and would hit strict gating.
  - Two e2e flows press Check after trying one row, which the nudge would catch.

## 3. Key designs (one place)

**Step kinds** (`src/lessons/types.ts`)

- `BuildStepDef` gets `showTarget?: boolean`: a read-only target table drawn from `spec.expected`.
- New `PredictStepDef { kind:'predict'; level:'guided'|'challenge'; circuits: CircuitDoc[] }`. Every part is locked; a challenge has at least 2 variants.
- New `ProjectStepDef { kind:'project'; briefs: ProjectBrief[] }`, where a brief has:
  - `id`, `starter`, `palette`, `inputs`, `outputs`;
  - `rule: {kind:'student', given: CheckRow[]} | {kind:'fixed', rows}`;
  - `criteria: Criterion[]`, optional `constraints`;
  - `example {rule, solution}` for content tests and the Phase 3 answer key.
- `PracticeDef {id; for: misconceptionIds[]; from: stepIds[]; step}` sits **outside** the numbered steps, at route `#/lesson/<id>/practice/<practiceId>`, so step numbering never shifts.
- `LessonDef` gets `unit`, `kind?: 'lesson'|'project'|'test-out'`, `optional?`, `introduces?: gate types`, `practice?`.

**Progress** (`src/lessons/progress.ts`)

- **Same key and shape.** New optional fields: `doneAt`, `misconceptions[]` (deduplicated, at most 20), `predicted {firstRight, bestRight, rows}`, `brief`. `hintsUsed` now means the highest hint revealed.
- **`parseProgress(raw)`** rebuilds every entry from checked fields and drops bad entries while keeping the rest. It is used for localStorage, the cross-tab `storage` event and imports. Empty timestamp strings stay valid, because the e2e seeds use them.
- **`mergeStep`:**

  | Field                         | Merged value |
  | ----------------------------- | ------------ |
  | `done`                        | OR           |
  | `attempts`, `hintsUsed`       | max          |
  | `triedRows`, `misconceptions` | union        |
  | `firstSeen`, `doneAt`         | earliest     |
  | `lastSeen`                    | latest       |

  It is used by `update()`, cross-tab sync and import. Progress is never undone.

- **Gating:**
  - **A step is unlocked** when every earlier step is done, or the lesson's last step is done (so adding a step later never re-locks anyone).
  - **A lesson is complete** when its last step is done, or its unit was tested out.
  - **A lesson is unlocked** when any of these holds:
    - it is Lesson 0 (always open);
    - the previous required lesson is complete;
    - the student already started it;
    - the test version's "unlock all" switch is on.
  - **Projects** open after their unit's last lesson. **Test-outs** open after the previous unit.
  - `nextStepFor()` drives Home's "Continue".

**Progress file** (`src/lessons/progressFile.ts`)

- Shape: `{format:'logiclearn-progress', version:1, exportedAt, site:'live'|'dev', steps, work?}`.
- The storage prefix is never written, so live and dev files are interchangeable.
- Import checks: at most 2 MB; correct `format`; a newer version gets a "newer LogicLearn" message; steps go through `parseProgress`, circuits through `loadCircuit`, rule cells must be 0/1/null.
- Saved work is restored only where this browser has none. The result is reported as "N added, M updated, K circuits restored, J kept".

**Misconceptions v2** (`src/sim/misconceptions.ts`, `checker.ts`)

- Optional `CheckSpec.rules: {fn, inputs:[a,b]}[]` (the expected rows equal the AND of the rules, enforced by a content test), plus `rowsFromRules()`.
- Detection order:
  1. the existing 2-input swaps, now **per output column**;
  2. **rule swaps** (each rule's operator replaced by its common wrong one);
  3. `missed-all-zeros`;
  4. new `inverted-output`;
  5. new `ignores-input`, using `inputDependencies`.
- `Misconception.params` carries `{output, input, rule}`.
- Export `MISCONCEPTION_IDS`. The English strings stay as fallbacks.

**Grader** (new `src/sim/grader.ts`)

- `Criterion` kinds:
  - `matches-rule`
  - `rule-keeps-rows`
  - `rule-uses-every-input`
  - `outputs-use-every-input`
  - `min-gates`, `max-gates`
  - `uses-part` (counts I/O parts)
- API: `grade(doc, GradeSpec) → {pass, check, criteria[]}` and `gradeRule(spec)` for feedback before building.
- `inputDependencies(rows) → boolean[out][in]` in `truthTable.ts`: output _j_ depends on input _i_ if flipping bit _i_ in some row changes _j_.
- `gateParts()` is extracted from the checker.
- The grader returns codes and details only; the UI writes the sentences.

**Multi-pin outputs** (`truthTable.ts`, `checker.ts`)

- An `io:'output'` part with several input pins becomes one column per pin, labeled `D.a…D.g`, sorted by part label and then by pin order.
- `outputValue` reads `part.pin`.
- `MISSING_IO` and `DUPLICATE_LABEL` messages are grouped by part.
- Amend CLAUDE.md's "checker must not change for new parts" rule to say a part may have several I/O pins and each becomes a column.

**Parts** (`src/sim/registry.ts`, `components.ts`, `serialize.ts`)

- **Registry:** optional `normalizeProps` and pin `label`.
- **LIGHT:** validates its color against an exported `LIGHT_COLORS`.
- **`PUSH_BUTTON`:** `io:'input'`, like SWITCH; only the editor knows it is momentary.
- **`SEVEN_SEG`:** `category:'display'`, `io:'output'`, pins a–g, plus `DIGIT_SEGMENTS` and `digitShown()`.

## 4. Work packages (one PR each, into `dev`)

**P2.1 Groundwork (Wed Nov 4 AM). No visible change.**

- Split `LessonPage.tsx` into `StepNav.tsx`, `StepText.tsx`, `ExplainStepView.tsx`, `BuildStepView.tsx` (with `BuildPanel`) and `stepWork.ts` (`saveWork`/`loadWork`/`starterFingerprint` plus generic step-state save/load).
- Move the `io()` and `b()` content helpers to `content/helpers.ts`.
- Add `parseProgress`, `mergeStep` and `mergeProgress` to `progress.ts`.
- Add `findSharedText()` and `fillPlaceholders()` to `lessonText.ts`, for `content/_shared/<locale>/*.md`.
- Add `PROGRESS_KEY` and a merging `seedProgress(page, keys)` to `e2e/helpers.ts`, replacing the 4 literal writes.
- Tests:
  - new `progress.test.ts`: the e2e seed shape loads; junk is dropped; merge rules hold;
  - new `lessons.test.ts` invariants: spec labels are in the solution's `findIO` order; palette types are registered; guided steps have ≥ 2 hints.

**P2.2 Units, lesson gating, list and Home (Wed Nov 4 PM)**

- `catalog.ts`: lessons in curriculum order, plus units.
- `progress.ts`: the gating functions.
- `LessonList.tsx`: grouped by unit; a locked card is not a link and shows visible text "Finish Lesson N first".
- `HomePage.tsx`: "Continue: Lesson N – step", plus a secondary link to the editor tour.
- `LessonPage`: a lesson lock screen.
- An "Unlock all lessons" button, **test version only** (`IS_TEST_VERSION`).
- `_shared/en-US/unit-1.md` and `unit-2.md`.
- Seed the unseeded e2e routes with `signals/fan-out`.
- New `e2e/gating.spec.ts`.

**P2.3 Progress export/import (Thu Nov 5 AM)**

- New `progressFile.ts`.
- `storage.ts` gains `downloadJson`, `readJsonFile` and `listLocalKeys`; `downloadCircuit` and `readCircuitFile` are rebuilt on them.
- New `ProgressActions.tsx` on the lessons page, with the text "Kept only in this browser… save a file now and then". Buttons: "Save my progress to a file" and "Load progress from a file". Results are shown and announced.
- Tests: unit tests for round trip, newer version, size limit, junk, merge rules and local-work precedence; `e2e/progress.spec.ts` (download → clear → upload → step done), mouse and touch.

**P2.4 Hint ladder and gate reminder card (Thu Nov 5 PM)**

- New `HintLadder.tsx`. `recordHint` becomes `revealHint(level)`, keeping the max; the level is restored on reload.
- **No pacing (author's decision):** every hint can be revealed right away, one at a time, as today.
- The last guided hint's button says "Show me how (last hint)". After 2 failed checks with no hints used, an announced "Stuck? A hint is ready" appears.
- Fix: predict-first stays revealed once the step is done.
- New `GateReference.tsx`: a "Gate reminder" `<details>` for the gates introduced so far. Each gate shows its `GateShape`, the rule from `_shared/<locale>/gate-<TYPE>.md`, a truth table **generated from the registry**, and Read aloud. The sandbox shows all gates.
- Tests: an RTL test for pacing; generated tables equal `TWO_INPUT_FUNCTIONS`; e2e; axe with the card open.

**P2.5 Lessons 0, 1, 3 (Thu PM – Fri Nov 6 AM)**

- Content folders `editor-tour/`, `signals/`, `or-xor/`.
- `Editor.tsx` hides an empty palette.
- `Palette.tsx` shows the part name for non-gate parts.
- e2e: Lesson 1 by tap and by click (rename a light in the Inspector, fan-out challenge), then Lesson 2 unlocks.

**P2.6 Prediction mode and Lesson 4 (Fri Nov 6 → Mon AM)**

- New `src/editor/PredictTable.tsx`:
  - each output cell is a `<fieldset>` with a screen-reader-only legend and two native radios labeled 0 and 1 (one tab stop, arrow keys, targets of at least 36px);
  - "6 of 8 filled" counter;
  - "Check my predictions" focuses the first blank if any are left.
- New `PredictStepView.tsx`: a read-only, hidden-values editor (switches still move the current row).
  - **Guided:** any complete submission reveals the answers, with "✓ right / ✗ wrong" text and an "explain" prompt.
  - **Challenge:** wrong rows are marked and revealed, then "Try another circuit"; the step is done when one variant is fully right.
- `comparePredictions()` in `truthTable.ts`.
- State saved under `storageKey('predict:…')`.
- `recordAttempt` takes an object.
- Content folder `circuit-to-table/`.
- Tests: unit, content (all parts locked, ≤ 6 inputs, no X, challenge variants differ), RTL, e2e (tap, click, keyboard, reload), axe.

**P2.7 Misconceptions v2 and tried-rows nudge (Mon Nov 9)**

- Sim: everything in §3 for misconceptions, plus `inputDependencies` and `gateParts`.
- New `misconceptionText.ts` reads `_shared/<locale>/misconception-<id>.md`, falling back to the sim strings. Used by `CheckResultView` and `summarizeCheck` in lessons and the sandbox. The id is recorded in progress.
- New `TriedRowsNudge.tsx`, shown on non-blind build steps, ≤ 8 rows, outputs not X, once per design version. Text from `_shared/nudge-untried-rows.md`. Buttons: "Try row A=0, B=1" (`store.setInputs`) and "Check anyway". The nudge is not an attempt. Export `circuitRow` from `useCheck.ts`.
- Update the two e2e flows to try rows first.
- Tests: the existing `checker.test.ts` expectations stay unchanged; new signature tests; content tests (a Markdown file per misconception id; specs with `rules` equal `rowsFromRules`).

**P2.8 Grader and Unit 1 project (Mon PM – Tue Nov 10)**

- `src/sim/grader.ts` and its tests.
- New `ProjectStepView.tsx`:
  1. choose a brief (radio group); work saved per brief as `{starter, doc, rule}`;
  2. "Your rule": `PredictTable` in rule mode, with the brief's rows locked and live `gradeRule` feedback;
  3. build, with the student's rule as the wanted column;
  4. "Check my project": a checklist where each line reads "✓ Done:" or "✗ Not yet:"; the summary goes through `tell()`.
- Content folder `unit-1-project/`.
- e2e: the door alarm.

**P2.9 New parts (Tue Nov 10 – Wed AM, or a parallel session from Nov 5)**

- Sim parts and multi-pin I/O (§3).
- `geometry.ts`: PUSH_BUTTON 60×40; SEVEN_SEG 120×280 with pins a–g on the left, 40px apart.
- `PartNode.tsx`: `PushButtonBody` and `SevenSegBody`. `shapes.tsx`: icons. `parts.ts` order.
- `Inspector.tsx` uses `LIGHT_COLORS` from the sim.
- `describe.ts`: "Push button P: up / held down", "Display D: shows 2", pin labels.
- `useEditorAnnouncements.ts`: "Display D now shows 3".
- `themes.css`: `--segment-on/off` and push-button tokens in all 4 themes plus forced colors. Unlit segments are drawn as outlines.
- **Push button behavior:**
  - pointer down captures and presses; up, cancel or lost capture releases;
  - Space/Enter press on keydown (ignoring repeat) and release on keyup;
  - blur and `visibilitychange` release;
  - a screen reader's bare click latches it down, and the next click releases;
  - no `aria-pressed`.
- Lights: the color goes into the accessible name ("Light Y: on (red)").
- Tests: sim; describe; RTL release paths; `e2e/parts.spec.ts` (mouse down/up, keyboard down/up, touch pointer events, click latch); axe.

**P2.10 Lessons 5–8 (Wed Nov 11 – Thu Nov 12)**

- Content folders `nand-nor/`, `xnor-if-then/` (specs with `rules`), `table-to-circuit/` and `adders/`.
- New `TargetTable.tsx` (for `showTarget`).
- e2e smoke test: the "only NAND" step rejects AND.

**P2.11 Unit 2 project (Thu Nov 12, on the cut line).** Brief `digits`: digits 0–3 from switches A, B on a locked display D, with a fixed rule. Criteria `matches-rule` and `uses-part SEVEN_SEG`. Reference solution of 6 gates (a = d = A + B̄, b = A + Ā, c = Ā + B, e = B̄, f = NOR(A, B), g = A).

**P2.12 Stretch: practice steps and test-outs (only if ahead; otherwise Nov 16–18)**

- The practice route, plus an _offered_ link in `BuildPanel` and `PredictStepView` when a failed check's misconception id matches, or after 3 failures. Practice ends with "Back to the challenge" and is not counted toward completion.
- Test-out lessons `test-out-1` and `test-out-2` reuse earlier challenge step definitions under new ids. Passing one counts the unit as complete for gating; no fake records are written.

**P2.13 M2 release (Fri Nov 13)**

- Docs: PROJECT_PLAN §3.6, §3.7, §6 and a v5 log entry; `architecture.md`; `translating.md` (`_shared`, brief and practice files); `accessibility.md`; CLAUDE.md (step kinds, `_shared`, the multi-pin rule, never rename step, brief or practice ids); `curriculum-outline.md`.
- New `docs/phase-2-report.md` and `docs/milestone-2-demo.md`.
- An **independent review sub-agent** pass over the sim and lesson flows before the release PR.
- Release PR `dev → main`; check both sites.

## 5. Lesson content plan (draft text files; ids are permanent once released)

**Lesson 0 `editor-tour`** (optional). Steps:

- `the-editor` (explain);
- `add-and-connect`: guided, Y = A, palette SWITCH and LIGHT;
- `fix-it`: guided; delete an extra NOT so that Y = A; `maxGates: 0`; the text covers undo and redo.

**Lesson 1 `signals`.** Steps:

- `on-and-off` (explain);
- `unknown-x`: explain, with an unwired light showing "?";
- `label-and-wire`: guided; rename L1 and L2 to Y and Z; Y = A, Z = B;
- `fan-out`: challenge, blind; Y = A and Z = A.

**Lesson 2 `not-and`** (exists). Add `unit` and `introduces`; step ids unchanged.

**Lesson 3 `or-xor`.** Steps:

- `meet-or` (explain);
- `build-or` (guided);
- `exclusive-or`: explain ("tea or coffee"; differs from OR only on the 1,1 row);
- `build-xor`: guided, can trigger xor-as-or;
- `table-to-circuit`: guided, (A AND B) OR C;
- `exactly-one`: challenge, blind, no XOR in the palette.

**Lesson 4 `circuit-to-table`.** Steps:

- `count-the-rows` (explain);
- `predict-two`: predict-guided, (NOT A) AND B;
- `find-the-row`: predict-guided, A·B̄·C;
- `challenge`: predict-challenge with 3 variants.

**Unit 1 project.** Steps: `brief` (explain), then `build` (project). Two briefs:

- **Door alarm:** inputs D, R, P (push button), output L (red light).
  - 6 given rows; **the student decides whether panic works when the alarm is off** (rows 001 and 101).
  - Criteria: `rule-keeps-rows`, `rule-uses-every-input`, `matches-rule`, `outputs-use-every-input`, `min-gates 2`.
- **Voting machine:** inputs A, B, C, output Y (green light).
  - Given rows 000→0 and 111→1; majority is suggested.
  - Same criteria.

**Lesson 5 `nand-nor`.** Steps:

- `not-both` (explain; NAND vs XOR on 0,0; NOR = "neither");
- `build-not-both`: guided, can trigger not-both-as-xor;
- `nand-not`: guided, only NAND allowed;
- `nand-and-or`: guided, two outputs, only NAND allowed;
- `neither`: challenge, only NAND allowed, blind.

**Lesson 6 `xnor-if-then`** (the heaviest). Steps:

- `match` (explain; XNOR ≠ AND);
- `if-then` (explain; NOT A OR B; a false "if" never breaks the rule);
- `build-if-then`: guided, can trigger if-then-as-and;
- `two-rules`: guided, rules [A→B, NAND(B,C)];
- `three-rules`: challenge, blind, rules [A→C, B XNOR C, NAND(A,B)]; Y = 1 only on rows 000 and 011 (verified).

**Lesson 7 `table-to-circuit`.** Steps:

- `one-row-at-a-time`: explain (sum of products, "by itself" needs NOTs, notation);
- `by-itself`: guided, showTarget, one row on;
- `two-rows`: guided, showTarget, rows 00 and 11;
- `any-table`: challenge, blind, showTarget, rows 001, 011, 110.

**Lesson 8 `adders`** (colored lights). Steps:

- `adding-bits` (explain);
- `half-adder`: guided, C = AND, S = XOR;
- `full-adder`: guided;
- `two-bit-adder`: challenge, inputs A0, A1, B0, B1, 16 rows, blind (the author may relax this).

**Unit 2 project.** Brief `digits` (§4, P2.11).

**Practice steps (P2.12).** In or-xor `both-on`; nand-nor `neither-on`; xnor-if-then `false-if` and `both-off`; table-to-circuit `by-itself`.

**Author-editable text** (all draft Markdown, per locale):

- step, predict and practice files;
- project `brief.md`, `build.md` and `<brief-id>.md`;
- `_shared/unit-N.md`, `_shared/gate-<TYPE>.md`, `_shared/misconception-<id>.md` (placeholders `{output}`, `{input}`, `{rule}`);
- `_shared/nudge-untried-rows.md`, `nudge-stuck.md`, `predict-reveal.md`.

Buttons and checklist wording stay in TypeScript, as interface text that isn't localized yet. Content tests check that every required `_shared` file exists and that placeholders are valid.

## 6. Schedule and cut line

| Day        | Main session                                  | Optional parallel session          |
| ---------- | --------------------------------------------- | ---------------------------------- |
| Wed Nov 4  | P2.1, P2.2                                    | —                                  |
| Thu Nov 5  | P2.3, P2.4                                    | P2.9a: multi-pin I/O, light colors |
| Fri Nov 6  | P2.5, P2.6 (starts)                           | P2.9b: push button, seven-segment  |
| Weekend    | The author tries `/dev/` and writes prose     |                                    |
| Mon Nov 9  | P2.6 (finish), P2.7                           |                                    |
| Tue Nov 10 | P2.8 (P2.9 if single-track)                   |                                    |
| Wed Nov 11 | P2.10: Lessons 5–6                            |                                    |
| Thu Nov 12 | P2.10: Lessons 7–8, P2.11; **freeze at 5 pm** | P2.12 if ahead                     |
| Fri Nov 13 | P2.13 release                                 |                                    |

- **Committed for M2:** P2.1–P2.9, P2.10 through Lesson 7, P2.13.
- **Go/no-go Thursday noon:** Lesson 8, then P2.11.
- **Phase 3 (Nov 16–18, before the Nov 20 beta build):** P2.12, 3-input gate UI, predicting your own build, a fully open project brief, a second Unit 2 brief, the answer-key view.
- **If time runs short, cut in this order:** test-outs → practice → Unit 2 project → Lesson 8 → seven-segment display → push button → Lesson 0.
- **Never cut:** content tests, export/import, gating tests.

## 7. Risks

| Risk                                                            | Mitigation                                                                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Gating and the nudge break existing e2e tests                   | Handled in the same PRs: `seedProgress`, and trying rows before Check.                                                     |
| Merge conflicts in the lesson page                              | P2.1 split; the parallel session touches only sim and editor-node files.                                                   |
| Students re-locked, or their work discarded, by content changes | "Last step done" counts as complete; started lessons stay open; locked parts are frozen at release; ids are never renamed. |
| Old results change                                              | The existing checker and truth-table tests must pass unchanged; signatures are tried in a fixed order.                     |
| Push button gets stuck, or Space pans the canvas                | `nodrag nokey`; release on every exit path; RTL tests.                                                                     |
| New UI fails axe                                                | Every new screen gets an axe entry in all 4 themes; segment contrast is checked in forced colors.                          |
| Lesson 8's blind 16-row challenge may be too hard               | Flagged to the author.                                                                                                     |

## 8. Verification

- **Per PR:** `npm run lint && npm run typecheck && npm test && npm run e2e`, plus `npm run build:dev`. CI covers Firefox and WebKit. The author tries `/dev/` (with "Unlock all" on the test version).
- **Content tests:**
  - every solution passes and every starter fails;
  - every project example passes `grade`;
  - every predict circuit is fully locked and has no X outputs;
  - every misconception, gate and nudge text file exists;
  - specs with `rules` equal `rowsFromRules`;
  - spec labels are in `findIO` order.
- **End-to-end:**
  - a fresh profile walks Lesson 1 → Lesson 2 unlocks;
  - export → clear → import restores progress;
  - a prediction challenge;
  - the door-alarm project passes, then fails a criterion after a wire is cut;
  - push button hold by mouse, keyboard, touch and click latch;
  - the display announces its digit;
  - the "only NAND" rejection.
- **Before the release:** an independent review sub-agent; axe in 4 themes; a manual check of the narration and screen reader passes on new screens (`docs/accessibility.md` checklist).

## 9. Design decisions

**Confirmed by the author (Nov 3):**

- **D1. Lesson gating:** strict, in order, with escapes: started lessons stay open, the test version has "unlock all", and Phase 3 brings bypass codes. Unit projects don't block the next unit.
- **D2. Hint pacing:** none. Every hint is available right away, one at a time.
- **D6. Unit 1 project rule:** fixed briefs where the student fills the rows the brief leaves open.
- **D7. Scope for M2:** practice steps only if ahead (Lesson 6 first); test-outs in Phase 3.

**Defaults used unless the author says otherwise:**

- **D3. Challenges:** no bottom-out hint; practice steps play the worked-example role.
- **D4. Tried-rows nudge:** soft. Once per change, on live steps with ≤ 8 rows, with "Check anyway".
- **D5. Prediction challenge feedback:** mark the wrong rows, then require a correct prediction of a new circuit.
- **D8. Progress file:** progress plus saved circuits and project rules; import never overwrites local work.
- **D9. 3-input gates in the editor:** postponed. No lesson needs them; students chain 2-input gates.
- **D10. Push button with a screen reader:** a bare click latches it down, and the next click releases.
- **D11. Seven-segment display:** 7 pins (a–g), no decimal point.
- **D12. Segment b always on (digits 0–3):** a hint teaches A OR NOT A, rather than adding a constant part.
- **D13. Lesson 0:** Home offers "Start Lesson 1" with "Take the editor tour" as a secondary link.

**Content questions for the author (don't block code):**

- Lesson 6's word-problem stories (original, not the ICER sandwich-shop item);
- the brief wording;
- whether Lesson 8's challenge stays blind.

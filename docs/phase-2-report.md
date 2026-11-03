# Phase 2 report

**Status (2026-11-03):** Phase 2 work packages P2.1–P2.11 are built and tested on the
branch `claude/stoic-galileo-5wwq3b`, in pull request #5 into `dev` (the test site,
…/LogicLearn/dev/). The plan was [phase-2-plan.md](phase-2-plan.md); P2.12 (practice
steps) and test-outs move to Phase 3, as the author decided.

## What was built

| Package                        | Result                                                                                                                                                                                                                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2.1 Groundwork                | The lesson page split into one view per step kind; `parseProgress` rebuilds saved progress field by field and `mergeProgress` combines two copies without undoing progress; shared lesson text in `content/_shared/<locale>/`; `seedProgress()` for e2e tests.          |
| P2.2 Units and gating          | Lessons grouped by unit; lessons open in order with escapes (optional tour, started lessons stay open, projects never block, "Unlock all lessons" on the test version); locked cards say what to finish first; Home "Continue".                                         |
| P2.3 Progress files            | "Save my progress to a file" / "Load progress from a file", with saved circuits and project rules. Loading checks every field, never undoes progress, and never overwrites a circuit already in the browser; the result is reported in a sentence.                      |
| P2.4 Hints                     | A hint ladder (one at a time, no waiting – the author's decision); "Show me how" on the last guided hint; revealed hints survive a reload; a "Stuck? A hint is ready" note after two failed checks; the gate reminder card with truth tables computed by the simulator. |
| P2.5 Lessons 0, 1, 3           | Editor tour (optional), Signals, OR and XOR.                                                                                                                                                                                                                            |
| P2.6 Prediction mode           | The `predict` step kind and `PredictTable` (radio cells, keyboard and tap friendly); guided and challenge levels, with a new circuit after a missed challenge; Lesson 4.                                                                                                |
| P2.7 Feedback                  | Misconceptions per output and per rule, plus `inverted-output` and `ignores-input`; feedback text in `_shared` files; ids saved in progress; the "try every row" nudge with "Try row …" and "Check anyway".                                                             |
| P2.8 Grader and Unit 1 project | `src/sim/grader.ts` (seven criteria, checklist results); the `project` step kind: choose a brief, fill in "Your rule", build, "Check my project"; briefs **door alarm** and **voting machine**.                                                                         |
| P2.9 New parts                 | Multi-pin outputs (`D.a` … `D.g`); push button (pointer, touch, Space/Enter, a screen reader click latches it); seven-segment display that announces its digit; light colors checked on load and part of the light's name.                                              |
| P2.10 Lessons 5–8              | NAND and NOR (with "only NAND" steps), XNOR and "if … then" (word problems with `rules`), From truth table to circuit (`showTarget` and the target table), Adders (colored lights).                                                                                     |
| P2.11 Unit 2 project           | **Number display**: two switches show 0–3 on the seven-segment display (fixed rule; the example uses 6 gates).                                                                                                                                                          |
| P2.13 Release                  | These docs, the Milestone 2 demo script, and an independent review (below).                                                                                                                                                                                             |

**Tests:** 507 unit and content tests; 147 browser tests pass locally in Chromium with a
mouse and with taps only (CI adds Firefox and WebKit). Every build step's solution
passes and its starter fails; every project brief's example rule and circuit pass the
grader; every new screen is scanned by axe in all four themes.

## Independent review

A separate reviewer agent read the whole Phase 2 change without seeing the reasoning
behind it, and confirmed several findings by running code. Fixed, each with a test:

1. **A finished step could be lost on reload.** One damaged detail in a saved record (a
   tried row above 1023, from a circuit with 11+ extra switches; a score from a newer
   version) threw away the whole record, `done` included. Now only the damaged detail is
   dropped.
2. **The project checklist could say "undefined never changes…"** when the circuit
   couldn't be tested at all (a loop, a repeated label). It now says the item is checked
   once the circuit can be tested.
3. **Old "✗ wrong" marks stayed after the project rule changed.** Changing the rule now
   clears them.
4. **The "Stuck? A hint is ready" note never appeared in projects**, because checks were
   counted on the project step and hints on the brief. The note now counts the step's
   checks. (Also found while fixing it: the project steps' own hints were never shown;
   they moved into the brief files, and a content test keeps them there.)
5. **"Read this step aloud" skipped the brief's text** on projects, and read the
   checker's built-in misconception wording instead of the lesson's. Both fixed.
6. **A finished step could be locked** if an earlier step was not done (a step added
   later, or an imported file). A done step now always stays open.
7. **"Unlock all lessons" didn't unlock steps** on the test version. It does now.
8. **A light labeled "D.a" next to a display "D"** made two columns with one name, and
   the checker silently used one. It is now reported as a repeated label.
9. **Duplicate React keys** in the truth table when two switches share a label.

Also added: a content test that every lesson, step and brief id can be saved under the
progress key pattern.

Not changed:

- A lesson reset made in one tab would not stick in another open tab, since merging never
  undoes progress. No screen resets a lesson yet; a reset will need a marker that the
  merge respects.
- A prediction challenge cycles back to its first circuit after three misses (an author
  decision; see the summary for options).

## Changes from the plan

- **Order:** the new parts (P2.9) were built before the Unit 1 project, so the door alarm
  uses the push button from the start.
- **Door alarm labels:** D (door open), P (panic button), R (alarm set), in that order –
  the truth table sorts by label.
- **Lesson 5, "Build not both":** built from AND and NOT (the NAND gate isn't in the parts
  list yet), with XOR in the list as the tempting wrong answer. The "only NAND" steps
  offer only NAND, so instead of an e2e test that adds an AND, a content test checks that
  every step's parts list only holds gates the step allows.
- **`showTarget`:** shows the target table only where the truth table is hidden; a live
  truth table already has the "wanted" column.
- **Unit 2 project criteria:** only "matches the rule". "Uses a seven-segment display"
  was dropped: the display is a locked starter part, so it would always say Done.
- **Progress:** no `brief` field; the chosen brief is saved as step state, and each
  brief's rule is saved with its circuit (and in progress files).
- **Wide tables** (the display's 7 columns) scroll sideways in a box that becomes a tab
  stop only while it scrolls (an axe finding on the new screen).

## Known limitations

- All lesson text is draft bullet points for the author (`npm run lessons:drafts`).
- Lesson 8's last challenge is blind with 16 rows and 7 gates; it may be too hard
  (flagged in the plan).
- Interface text, the checklist and the checker's messages are English only.
- Home "Continue" skips projects (they are optional for moving on).
- The display project's rule table is wider than the side panel and scrolls.
- Firefox and WebKit run in CI only.

## Next (Phase 3)

1. Teacher guide, answer key view (from the briefs' examples and steps' solutions),
   bypass and completion codes.
2. Practice steps after a recognized mistake (Lesson 6 first), unit test-outs.
3. A second Unit 2 brief (adder on the display) and a fully open project brief.
4. Beta build, opt-in progress export and survey by about Nov 20.

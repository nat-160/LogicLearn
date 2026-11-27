# Phase 3 report

**Status (2026-11-27):** the Phase 3 sprint (P3.1–P3.10) is built and tested on the branch
`claude/stoic-galileo-5wwq3b`, in pull request #7 into `dev`. The plan was
[phase-3-plan.md](phase-3-plan.md): answer the Milestone 2 peer feedback, and build the
teacher tools and test-outs, as a minimum working version of each by about Nov 30.

## The peer feedback, and what changed

| Feedback                                                                                                                           | What was built                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Hints … gradually more specific: the gate, then my circuit, then one input combination, so I still have something to figure out." | P3.2: written hints about the idea, then **Look at your circuit** (names the part to look at and can point it out) and **Try one row** (one wrong row walked through the gates). Both are worked out from the student's own circuit. "Show me how" is gone: no hint gives the whole answer (the author's decision). |
| "Could the grader show an input where my circuit gives the wrong output?"                                                          | P3.1: every failed check gives an example ("with A = 0, B = 1, your circuit gives Y = 1, but the task wants Y = 0") and can set the switches to it – in lessons, practice, the sandbox and projects.                                                                                                                |
| "A short video to explain each topic … the reasoning behind the steps."                                                            | P3.5: in-app **walkthroughs** (the author's choice over recorded video) for Lessons 1–8, offered after a failed check and on explain steps. Each frame sets the switches, points at parts, and explains why.                                                                                                        |
| "Alt tags for every graphic."                                                                                                      | P3.4: a new check on every page found three unlabeled React Flow graphics (fixed). It now runs in the test suite, lesson images need alt text, and `accessibility.md` lists every picture and its text alternative.                                                                                                 |
| "A mini celebration with a graphic and sound effect."                                                                              | P3.3: a celebration page with a badge, what was learned and the next lesson. The chime is optional (**Sound effects**, off by default for classrooms), and the motion respects reduced-motion settings.                                                                                                             |
| "Limit the release of the next hint with a timer."                                                                                 | Not built, by the author's decision.                                                                                                                                                                                                                                                                                |

## The teacher tools and test-outs

- **Teacher view** (`#/teacher`, opened with a teacher code). It has:
  - the printable **teacher guide** (a draft for the author);
  - the **answer key**: every step's table and a working circuit in words, with a link that opens a copy in the sandbox;
  - each lesson's **unlock code**;
  - a **completion-code checker**.
- **Progress report** (`#/report`): every lesson's status and last activity, plus a completion code a teacher can check. The name field is only for printing.
- **Unit test-outs**: three challenges per unit, no hints. Passing one counts the unit's lessons as done.
- All codes are checked in the browser and documented as discouraging, not secure.

**Tests:** 653 unit and content tests; 217 browser tests passing locally in Chromium with a
mouse and with taps only (CI adds Firefox and WebKit). New pages have axe scans in all four
themes and the text-alternatives check.

## Independent review

_To be filled in when the review finishes._

## Changes from the plan

- **Answer key:** each solution appears in words with an "open in the sandbox" link, instead of a drawn circuit per step. It is faster, and prints well.
- **Completion codes** are `LL-XXXXXX-XXXX` (six characters of data, not four). They hold up to 16 lessons and the date.
- **Highlight tones:** parts that hints and walkthroughs point at are outlined in blue. Red stays for problems a check found.
- **Lesson 2, "Build it: AND":** its second hint gave the steps. It now asks which row should light.

## Known limitations

- All new text (walkthrough captions, teacher guide, test-out intros) is draft for the author.
- The codes can be worked out by anyone who reads the source.
- Completion codes list at most 16 catalog entries. The catalog has 13 today.
- Generated hints and the example row are English interface text.

## Next (Phase 4)

- From Phase 2:
  - Lesson 8's blind challenge;
  - prediction challenges cycling back to their first circuit;
  - a second Unit 2 brief;
  - 3-input gates.
- The final deliverables: user instructions, the evaluation document, the report and the video.

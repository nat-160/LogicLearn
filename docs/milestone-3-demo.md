# Milestone 3 demo script (about 6 minutes)

**Set-up before recording**

- Use the test site (https://nat-160.github.io/LogicLearn/dev/) in a fresh or private
  window. Tick **Unlock all lessons** on the Lessons page to jump around.
- Have the teacher code at hand (it is not in the repository; Claude gave it to you in the
  Phase 3 session).
- Window about 1366×768, zoomed to 100%.

---

### 1. What changed since Milestone 2 (20 s)

- Peer feedback asked for hints that get more specific without giving the answer, to be
  shown _where_ a circuit goes wrong, explanations of the reasoning, text alternatives, and
  a little celebration. All five are in, plus the teacher tools planned for Phase 3.

### 2. Show me where it's wrong (45 s) – _Lesson 2, "Build it: AND"_

- Build **OR** instead of AND, try the rows, press **Check**.
- The result now gives an example: _"For example, with A = 0, B = 1, your circuit gives
  Y = 1, but the task wants Y = 0."_ Press **Set the switches to this row**: the canvas
  shows the values for that row.

### 3. Hints that get more specific (60 s) – _same step_

- **Show a hint** repeatedly:
  1. the written hint about the gate;
  2. **Look at your circuit**: _"Look at OR gate 1: it drives Y, and Y is wrong in 2 of
     4 rows."_ **Show it on the canvas** outlines the gate in blue (red stays for
     problems a check found);
  3. **Try one row**: _"Try A = 0, B = 1. OR gate 1 gets 0 and 1 and gives 1. So Y is 1,
     but the task wants 0. Which gate should change?"_
- Mention: no hint gives the whole answer any more – full answers are only in the
  teacher's answer key (research links clicking straight through to the answer with less
  learning).

### 4. A walkthrough (45 s) – _Lesson 3, "Build it: XOR"_

- After a failed check: **Watch how it works – OR or XOR?**
- Step through with **Next**: the switches move to each row, the gates are pointed out,
  and the caption explains _why_. On "Both on", OR gives 1 and XOR gives 0.
- Paced by the student (no auto-advance), announced to screen readers, read aloud if
  narration is on.

### 5. Finishing a lesson (30 s)

- Finish a lesson: the **celebration** page – a badge, "Lesson 3 complete!", what you can
  now build with, and **Next**.
- **⚙ Accessibility → Sound effects** turns on a short chime (off by default, for
  classrooms). With reduced motion, the burst of dots is left out.

### 6. Teacher tools (90 s)

- **Lessons → Print my progress report**: every lesson's status, and a completion code
  such as `LL-A23SCC-BCN5`. The name field is only for printing; nothing is saved or sent.
- Go to **#/teacher**, enter the teacher code:
  - **Check a completion code**: paste the student's code – it lists what is finished and
    when. Change one character: it no longer checks out.
  - **Unlock codes**: give a student one lesson's code; on the locked lesson card they
    enter it under "Have a code from your teacher?".
  - **Answer key**: pick a lesson; each step shows the table to build and a working
    circuit in words, with **Open this circuit in the sandbox**.
  - **Teacher guide** (printable): pacing for 45/50/90-minute periods and project rubrics.
- Mention: codes discourage rather than secure – the source is public.

### 7. Test-outs (30 s)

- Unit 1 starts with **Already know Unit 1?** – three challenges, no hints. Passing them
  marks Unit 1's lessons **Tested out** and opens Unit 2 and the Unit 1 project.

### 8. Under the hood (20 s)

- `src/sim/trace.ts` walks one row through any circuit; the hints and examples are
  worked out from the student's own circuit, not written per step.
- About 650 unit and content tests and about 220 browser tests (mouse and touch), with
  accessibility scans and a text-alternatives check on every page.

---

**If something goes wrong on camera:** a private window starts fresh; **Leave teacher
view** closes the teacher view.

# Curriculum outline (scaffolded lesson plan)

> **Status:** draft for the author. Order confirmed (see `PROJECT_PLAN.md` §5). These
> bullets become each step's placeholder text (`<!-- draft -->` Markdown files) until the
> author writes the final prose. Lesson 2 is built as the Phase 1 demo lesson.

## How every lesson is built

Each lesson goes **explain → guided build → open build → challenge**, following the
direct instruction → guided construction → open construction sequence from the course.

- **Explain:** short text plus an example circuit the student can explore but not edit.
- **Guided:** locked switches/lights, a limited parts list, hints revealed one at a time.
- **Challenge:** less help. At least one challenge per lesson is **predict-first**: outputs
  and the truth table stay hidden until Check.
- **Remediation (Phase 2):** a failed challenge leads to smaller steps chosen by the
  _misconception signature_ (the pattern of wrong rows).
- **Habits in every lesson** (from Herman et al., ICER '08): check **every** row, starting
  with all zeros; re-read the rule and check each row before pressing Check.
- **Test-outs (Phase 2)** before each unit let students who already know the material skip it.

Standards: IB CS A1.2.3 (purpose and use of logic gates), A1.2.4 (truth tables), A1.2.5
(logic diagrams); CSTA 3B-CS-02. AP CSP Topic 3.5 covers Boolean expressions only.

---

## Unit 1: Gates and truth tables

### Lesson 0: Editor tour (skippable)

- Explain: the canvas, the parts list, the truth table.
- Guided: add a switch and a light by tapping; connect them (tap a pin, then a pin).
- Guided: flip the switch; undo and redo; delete a part.
- No challenge. "Skip the tour" button for students who have used it before.

### Lesson 1: Signals – on/off, 0/1

- Explain: computers use signals that are on (1) or off (0); switches are inputs, lights are outputs.
- Explain: **X means "not connected"** – a gray dashed wire; a light shows "?".
- Guided: two switches, two lights; label them (A, B, Y, Z); wire A→Y and B→Z.
- Challenge: "Light Y shows A, and light Z shows A too" (fan-out: one output to two inputs).
- Standards: A1.2.3.

### Lesson 2: NOT and AND _(built: demo lesson)_

- Explain: a logic gate follows a rule; NOT outputs the opposite (example to explore).
- Guided: build NOT (locked A and Y; palette: NOT).
- Explain: AND is 1 only when **all** inputs are 1; 2 inputs → 4 rows; the ✓ marks.
- Guided: build AND (palette: AND, OR, NOT); test every row, starting with 00.
- Challenge (predict-first): "Y on when A is on and B is **off**" → A AND (NOT B).
- Standards: A1.2.3, A1.2.4.

### Lesson 3: OR and XOR

- Explain: OR is 1 when **at least one** input is 1.
- Explain: everyday "or" often means **exclusive** or ("tea or coffee?") → XOR: one or the other, **not both**.
- Guided: build OR; then build XOR; compare the two tables – they differ only on the 1,1 row.
- Guided: trace a multi-gate circuit; build `(A AND B) OR C` from its truth table.
- Challenge: "Y on when exactly one of A, B is on" (signature: OR-for-XOR, wrong on 1,1).
- Standards: A1.2.4, A1.2.5.

### Lesson 4: From circuit to truth table

- Explain: n inputs → 2ⁿ rows; list rows in counting order so none is missed.
- Guided (predict mode, Phase 2): fill in the truth table for a given circuit, then reveal.
- Guided: find the row where a given circuit's light is on.
- Challenge (predict-first): predict every row of a 3-input circuit, then check.
- Standards: A1.2.4.

### Unit 1 project (open)

- Pick one: **door alarm** (alarm if door open AND system armed, OR panic button), or
  **voting machine** (3 voters, light on if the majority vote yes).
- Automatic criteria (Phase 2 grader): required inputs/outputs present, every output
  depends on every input, correct for the student's own stated rule.
- Hidden teacher rubric: design explanation, labels, tidy layout, tested all rows.
- Standards: CSTA 3B-CS-02.

---

## Unit 2: Building with gates

### Lesson 5: NAND and NOR

- Explain: NAND = NOT AND ("**not both**"); NOR = NOT OR ("neither").
- Explain: **"not both" ≠ "exactly one"**: NAND and XOR agree except when both inputs are 0.
- Guided: build NAND; compare with XOR on the 0,0 row.
- Guided ("only NAND" constraint): build NOT from NAND, then AND, then OR.
- Challenge: "only NAND" – build a given function (signature: XOR-for-NAND, wrong on 0,0).
- Standards: A1.2.3.

### Lesson 6: XNOR, implication, and English → logic

- Explain: XNOR is 1 when the inputs **match** – "if and only if", "exactly when". It is not AND.
- Explain: **"if A then B"** is implication, `NOT A OR B`: broken only when A is on and B is off.
  A false "if" never breaks the rule. Logic "if" is a rule, not cause and effect – unlike `if` in code.
- Guided: build "if A then B" from NOT and OR; check the rows where A is 0.
- Explain: method – **translate each rule separately, then AND the rules together**.
- Guided: a 2-rule word problem (sandwich-shop style).
- Challenge: a 3-rule word problem (signatures: AND-for-XNOR on 0,0; AND-for-implication on 0,0 and 0,1).
- Standards: A1.2.5.

### Lesson 7: From truth table to circuit

- Explain: sum of products – each 1-row is "exactly this combination", so **"by itself"
  and "without" need NOTs** (allspice by itself = A AND NOT B AND NOT C).
- Explain: Boolean expressions ↔ diagrams; notation: `NOT A` = `Ā` = `¬A` = `!A`.
- Guided: build a circuit for a 2-input table with two 1-rows.
- Challenge: build a circuit for any 3-input table.
- Standards: A1.2.4, A1.2.5.

### Lesson 8: Useful circuits – adders

- Explain: adding two bits: sum = XOR, carry = AND (half adder).
- Guided: build a half adder (outputs S and C).
- Guided: full adder from two half adders and an OR.
- Challenge: 2-bit adder (shows bits on lights).
- Standards: CSTA 3B-CS-02.

### Unit 2 project (open)

- **Seven-segment display** (Phase 2 part): show digits 0–3 from two switches; or a
  2-bit adder whose answer lights up on the display.
- Automatic criteria: correct for every input; uses a seven-segment display.
- Hidden teacher rubric: as Unit 1, plus reuse of earlier circuits.

---

## Stretch (Phase 4)

### Lesson 9: Memory – latches and clocks

- Explain: a loop can **remember**: the SR latch.
- Guided: build an SR latch from two NOR gates; set and reset it.
- Explain: a clock; the D latch stores a bit when the clock is on.
- Challenge: store one bit.
- Needs: clock part, sequential checks (input sequences, not just truth tables), and the
  simulator's settling strategy (see `PROJECT_PLAN.md` §3.5).

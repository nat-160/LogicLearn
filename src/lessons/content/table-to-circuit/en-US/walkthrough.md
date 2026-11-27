<!-- draft -->

# One row, by itself

The circuit is (NOT A) AND B: it lights **Y** in exactly one row. Watch why it needs the NOT.

<!-- frames -->

- **A = 0, B = 1.** The NOT turns A's 0 into 1, so the AND gets 1 and 1: **Y = 1**. This is the row we want – "B by itself".
- **A = 1, B = 1.** Now the NOT turns A's 1 into **0**, so the AND gets a 0: **Y = 0**. Without the NOT, this row would light up too. "By itself" means the other input must be **off**.
- **A = 0, B = 0.** B is off, so the AND gives **0**.
- **A = 1, B = 0.** B is off again: **0**. One AND for one row: an input that is 1 in the row goes straight in, and an input that is 0 goes in through a NOT.

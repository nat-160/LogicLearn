<!-- draft -->

# One row, by itself

The circuit is A AND (NOT B): it lights **Y** in exactly one row. Watch why it needs the NOT.

<!-- frames -->

- **A = 1, B = 0.** NOT turns B's 0 into 1, so AND gets 1 and 1: **Y = 1**. This is the row we want – "A by itself".
- **A = 1, B = 1.** Now NOT turns B's 1 into **0**, so AND gets a 0: **Y = 0**. Without the NOT, this row would light up too. "By itself" means the other input must be **off**.
- **A = 0, B = 0.** A is off, so AND gives **0**.
- **A = 0, B = 1.** A is off again: **0**. One AND for one row: a 1 where the row has a 1, and a NOT where it has a 0.

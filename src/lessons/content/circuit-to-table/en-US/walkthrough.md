<!-- draft -->

# Working out a truth table

To fill in a truth table, take the rows in counting order and follow the signal through each gate, left to right. This circuit is A OR (NOT B).

<!-- frames -->

- Start at the all-zeros row, **A = 0, B = 0**, and the first gate: the NOT gate flips B's 0 into a **1**.
- Now the OR gate gets 0 (from A) and 1 (from the NOT). At least one is on, so **Y = 1**.
- **A = 0, B = 1.** The NOT turns B's 1 into **0**, and A is 0 too. OR gets 0 and 0: **Y = 0**.
- **A = 1, B = 0.** A is on, so OR gives **1** whatever the NOT says.
- **A = 1, B = 1.** A is on again: **Y = 1**. Four rows, and only one is off: A = 0, B = 1.

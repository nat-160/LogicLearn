<!-- draft -->

# Working out a truth table

To fill in a truth table, take the rows in counting order and follow the signal through each gate, left to right.

<!-- frames -->

- Start at the all-zeros row, **A = 0, B = 0**, and the first gate: the NOT gate flips A's 0 into a **1**.
- Now the AND gate gets 1 (from the NOT) and 0 (from B). Not both on, so it gives **0**: **Y = 0**.
- **A = 0, B = 1.** NOT still gives 1, and now B is 1 too. AND gets 1 and 1, so **Y = 1**.
- **A = 1, B = 0.** NOT turns A's 1 into **0**. AND gets a 0, so **Y = 0** – whatever B is.
- **A = 1, B = 1.** NOT gives 0 again, so **Y = 0**. Four rows, one light: Y is on only when A is off and B is on.

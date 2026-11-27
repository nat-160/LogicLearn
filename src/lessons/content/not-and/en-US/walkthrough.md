<!-- draft -->

# How AND decides

AND is a "both" gate. Watch it go through all four rows, starting with every switch off.

<!-- frames -->

- **A = 0, B = 0.** Neither input is on. AND needs **all** of its inputs on, so it gives **0**.
- **A = 0, B = 1.** Only B is on. One is not enough for AND: still **0**.
- **A = 1, B = 0.** Only A is on. Still **0** – AND doesn't care _which_ input is missing.
- **A = 1, B = 1.** Both are on, so AND gives **1**. This is the only row that lights **Y** – that's why you test every row, not just one.

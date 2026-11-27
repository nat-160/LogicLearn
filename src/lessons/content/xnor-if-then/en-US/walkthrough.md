<!-- draft -->

# When is "if A then B" broken?

This circuit checks "if A then B" another way: the rule is broken exactly when **A happens and B doesn't**, so the light **Y** is NOT (A AND NOT B) – a NAND gate with a NOT on B.

<!-- frames -->

- **A = 1, B = 1.** A happens and B happens: the promise is kept. "A and not B" is false, so the NAND gives **1**.
- **A = 1, B = 0.** A happens, but B doesn't: the promise is **broken**. Now "A and not B" is true, so the NAND gives **0**. This is the only row that breaks the rule.
- **A = 0, B = 0.** A didn't happen, so the rule didn't apply – it can't be broken. "A and not B" is false: **Y = 1**.
- **A = 0, B = 1.** A didn't happen again, so the rule is kept, whatever B does: **Y = 1**. A false "if" never breaks the rule – that's why "if A then B" is not the same as AND.

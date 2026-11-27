<!-- draft -->

# When is "if A then B" broken?

The circuit is (NOT A) OR B – the rule "if A then B". Light **Y** is on when the rule is **kept**.

<!-- frames -->

- **A = 1, B = 1.** A is true, and B happens: the promise is kept. NOT gives 0, but OR gets B's 1, so **Y = 1**.
- **A = 1, B = 0.** A is true, but B doesn't happen: the promise is **broken**. NOT gives 0 and B is 0, so OR gives **0**. This is the only row that breaks the rule.
- **A = 0, B = 0.** A is false, so the rule didn't apply – it can't be broken. NOT turns A's 0 into 1, and OR gives **1**.
- **A = 0, B = 1.** A is false again, so the rule is kept, whatever B does: **Y = 1**. A false "if" never breaks the rule – it is not the same as AND.

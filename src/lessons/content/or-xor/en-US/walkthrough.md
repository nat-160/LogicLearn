<!-- draft -->

# OR or XOR?

Light **X** is A OR B, and light **Y** is A XOR B. Watch where they agree – and the one row where they don't.

<!-- frames -->

- **Both off.** OR needs at least one input on, and XOR needs exactly one. Neither has it: both give **0**.
- **Only B on.** At least one input is on (OR: **1**), and exactly one is on (XOR: **1**). They agree.
- **Only A on.** Same as before: both give **1**. Three rows in, OR and XOR look identical…
- **Both on.** At least one is on, so OR gives **1**. But that's _two_, not exactly one, so XOR gives **0**. This is the row that tells them apart.
- So when a rule says "or", ask: is **both** allowed? If yes, it's OR. If not, it's XOR. Always check the row where both are on.

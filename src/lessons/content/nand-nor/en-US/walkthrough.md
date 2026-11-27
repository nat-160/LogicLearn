<!-- draft -->

# Not both, or exactly one?

Light **X** is A NAND B ("not both"), and light **Y** is A XOR B ("exactly one"). They sound alike. Watch the rows.

<!-- frames -->

- **Both on.** Both inputs are on, so "not both" is false: NAND gives **0**. And it's not "exactly one": XOR gives **0** too.
- **Only B on.** Not both (NAND: **1**), and exactly one (XOR: **1**). They agree.
- **Only A on.** Again they agree: both give **1**.
- **Both off.** Are both on? No – so "not both" is true: NAND gives **1**. But _exactly one_ isn't true when none are on: XOR gives **0**. "Neither" counts as "not both".

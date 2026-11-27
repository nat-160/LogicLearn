<!-- draft -->

# OR or XOR?

This is an XOR gate. Watch its light **Y** row by row, and compare it with what OR would do.

<!-- frames -->

- **Both off.** XOR needs **exactly one** input on. None is, so it gives **0** – and OR, which needs at least one, would give 0 too.
- **Only B on.** Exactly one input is on, so XOR gives **1**. OR would also give 1: at least one is on.
- **Only A on.** Again exactly one: XOR gives **1**, just like OR would.
- **Both on.** That's _two_ inputs, not exactly one, so XOR gives **0**. OR would give **1** here – this is the only row where they differ.
- So when a rule says "or", ask: is **both** allowed? If yes, it's OR. If not, it's XOR. Always check the row where both are on.

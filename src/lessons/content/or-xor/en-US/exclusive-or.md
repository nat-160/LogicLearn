<!-- draft -->

# XOR: exactly one

- In everyday talk, "or" often means **one or the other, not both**: "tea or coffee?"
- That is **XOR** ("exclusive or"): 1 when **exactly one** input is 1.
- OR and XOR agree on three rows. They differ only when **both** inputs are 1:

| A   | B   | A OR B | A XOR B |
| --- | --- | ------ | ------- |
| 0   | 0   | 0      | 0       |
| 0   | 1   | 1      | 1       |
| 1   | 0   | 1      | 1       |
| 1   | 1   | **1**  | **0**   |

- So always test the **1, 1** row when "or" is involved.

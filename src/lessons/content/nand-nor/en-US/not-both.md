<!-- draft -->

# NAND: not both

- **NAND** means NOT AND: the output is 1 unless **both** inputs are 1 – "**not both**".
- Careful: "not both" is **not** "exactly one". They differ when **both inputs are 0**: neither is on, so "not both" is still true.

| A   | B   | A NAND B | A XOR B |
| --- | --- | -------- | ------- |
| 0   | 0   | **1**    | **0**   |
| 0   | 1   | 1        | 1       |
| 1   | 0   | 1        | 1       |
| 1   | 1   | 0        | 0       |

- **NOR** means NOT OR: 1 only when **neither** input is 1.
- Flip the switches on the example and watch the NAND gate.

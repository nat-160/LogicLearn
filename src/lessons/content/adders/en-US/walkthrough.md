<!-- draft -->

# Adding two bits

The **S** light (green) shows the sum bit, and **C** (red) shows the carry. Watch A + B, one row at a time.

<!-- frames -->

- **0 + 0 = 0.** No sum, no carry: both lights are off.
- **0 + 1 = 1.** The sum bit is **1** (XOR: exactly one input on). No carry.
- **1 + 0 = 1.** The same: **S = 1**, **C = 0**.
- **1 + 1 = 2**, which is **10** in binary. The sum bit is **0** (XOR: not exactly one) and the carry is **1** (AND: both on) – like writing 0 and carrying 1.

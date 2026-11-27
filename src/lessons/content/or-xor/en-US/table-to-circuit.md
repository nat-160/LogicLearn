<!-- draft -->

# From a table to a circuit

- **Your task:** build the circuit whose truth table is shown in the **Y wanted** column. It has three inputs, so 2 × 2 × 2 = **8** rows.
- The rule in words: Y is on when **A and B are both on**, or when **C is on**.
- Build it in two parts: first "A AND B", then OR that with C.

<!-- hints -->

- Start with the part in brackets: an AND gate with inputs A and B.
- Then add an OR gate: one input from the AND gate, the other from C.
- Connect the OR gate's output to Y, then test all 8 rows (tap each row in the table).

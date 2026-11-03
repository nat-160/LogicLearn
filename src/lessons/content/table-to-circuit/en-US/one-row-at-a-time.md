<!-- draft -->

# One row at a time

- To build a circuit from a truth table, look only at the rows where the output is **1**.
- For each of those rows, make an AND that is 1 **in that row only**:
  - an input that is 1 in the row goes straight in;
  - an input that is 0 in the row goes in through a **NOT**.
- "A **by itself**" (A on, B off) is A AND (NOT B), not just A. That's the example circuit.
- If more than one row is 1, join the row ANDs with OR.
- People write this as A·B̄ (the bar means NOT) – "sum of products".

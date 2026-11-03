<!-- draft -->

# Just one row

- **Your task:** light **Y** in **one row only**: A = 0, B = 1, C = 0. The target is in the truth table's "Y wanted" column.
- Use the method: inputs that are 0 in that row need a NOT.

<!-- hints -->

- B is 1 in the row, so B goes straight in. A and C are 0, so each needs a NOT.
- AND only takes two inputs: AND two of them first, then AND the result with the third.
- Show me how: Y = ((NOT A) AND B) AND (NOT C).

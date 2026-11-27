<!-- draft -->

# Two rules at once

- A word problem with two rules (the author will add the story):
  - Rule 1: **if A then B**.
  - Rule 2: **not both B and C**.
- **Your task:** light **Y** when **both rules** are kept.
- Method: build each rule on its own, then join them with AND.

<!-- hints -->

- Rule 1 is (NOT A) OR B – you just built it. Rule 2 is B NAND C.
- Y is 1 only when rule 1 and rule 2 are both 1: one AND gate joins them.

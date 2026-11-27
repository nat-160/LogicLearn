<!-- draft -->

# AND and OR from NAND

- Still **only NAND**. Two lights this time:
  - **X** = A AND B
  - **Y** = A OR B
- Build each one, then check both columns of the truth table.

<!-- hints -->

- X: NAND is "NOT AND". What do you get if you put a NOT after it? (You know how to make a NOT from a NAND.)
- Y: A OR B is the same as "not (neither A nor B)" – that is, (NOT A) NAND (NOT B).
- Show me how: X = (A NAND B) NAND (A NAND B). Y = (A NAND A) NAND (B NAND B).

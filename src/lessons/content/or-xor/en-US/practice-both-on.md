<!-- draft -->

# Practice: OR or XOR?

- Light **X** is A OR B. Light **Y** is A XOR B. Both lights are hidden.
- **Your task:** predict both lights for every row, then check.
- Look out for the row where they differ.

<!-- hints -->

- OR is 1 when **at least one** input is 1. XOR is 1 when **exactly one** is.
- Only one row tells them apart: A = 1, B = 1. There, X is 1 and Y is 0.

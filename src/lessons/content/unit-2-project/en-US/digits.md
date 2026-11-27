<!-- draft -->

# Show 0, 1, 2, 3

- **A** and **B** make a 2-bit number: 00 is 0, 01 is 1, 10 is 2 and 11 is 3.
- The display **D** should show that number.
- One output can feed more than one segment, if two segments have the same column.

<!-- hints -->

- Some columns are easy: compare segment g's column with switch A's.
- Segments a and d have the same column – one circuit can drive both. Segment e is on for 0 and 2: whenever B is 0.
- Segment b is on for every number: A OR (NOT A) is always 1. Segment f is on only for 0: when neither A nor B is on.
- Show me how: a = d = A OR (NOT B); b = A OR (NOT A); c = (NOT A) OR B; e = NOT B; f = A NOR B; g = A.

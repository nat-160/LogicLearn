<!-- draft -->

# Full adder

- To add longer numbers, each column also adds the **carry in** from the column to its right.
- **Your task:** add A + B + **Cin**. **S** is the sum bit and **Cout** is the carry out.
  - S is 1 when an **odd** number of inputs are 1.
  - Cout is 1 when **two or more** inputs are 1.

<!-- hints -->

- S: add A and B first (XOR), then add Cin to the result (another XOR).
- Cout: there is a carry if A AND B, **or** if (A XOR B) AND Cin.
- Show me how: S = (A XOR B) XOR Cin; Cout = (A AND B) OR ((A XOR B) AND Cin).

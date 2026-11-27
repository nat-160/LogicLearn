<!-- draft -->

# Full adder

- To add longer numbers, each column also adds the **carry in** from the column to its right.
- **Your task:** add A + B + **Cin**. **S** is the sum bit and **Cout** is the carry out.
  - S is 1 when an **odd** number of inputs are 1.
  - Cout is 1 when **two or more** inputs are 1.

<!-- hints -->

- S: add the three bits one pair at a time. Which gate gives the sum bit of two bits?
- Cout: there's a carry when **two or more** of A, B and Cin are 1. In which ways can that happen?

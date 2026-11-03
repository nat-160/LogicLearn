<!-- draft -->

# XNOR: the inputs match

- **XNOR** means NOT XOR: the output is 1 when the inputs **match** – both 0 or both 1. It's also called "if and only if".
- Careful: XNOR is **not** AND. They differ when **both inputs are 0**: the inputs match, so XNOR gives 1.

| A   | B   | A XNOR B | A AND B |
| --- | --- | -------- | ------- |
| 0   | 0   | **1**    | **0**   |
| 0   | 1   | 0        | 0       |
| 1   | 0   | 0        | 0       |
| 1   | 1   | 1        | 1       |

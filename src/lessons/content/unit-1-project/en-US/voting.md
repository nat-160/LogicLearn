<!-- draft -->

# Voting machine

- Three judges, **A**, **B** and **C**, each vote yes (1) or no (0).
- The green light **Y** shows whether the vote passes.
- If nobody votes yes, it fails. If everyone does, it passes.
- **You decide** the rest: does one yes vote pass? Two? Does any judge get a veto?

<!-- hints -->

- Your rule must depend on all three judges – every vote should be able to matter.
- "Two or more yes votes" (majority) is a common rule. Which pairs of judges can pass a vote together?
- Majority: Y = (A AND B) OR (C AND (A OR B)).

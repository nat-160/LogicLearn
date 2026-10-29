# Architecture

How LogicLearn turns a drawing into a working circuit.

```
 student taps / drags                                    screen
        │                                                  ▲
        ▼                                                  │
 ┌──────────────┐   pure edit functions   ┌──────────────┐ │  React Flow draws parts
 │ editor store │ ──────────────────────► │  CircuitDoc  │ │  and wires; each part
 │  (zustand)   │ ◄── undo / redo ─────── │ (the design) │ │  reads its own pin values
 └──────┬───────┘                         └──────┬───────┘ │
        │ switch flips                           │ compile │
        ▼                                        ▼         │
 ┌──────────────┐  setInput / reset      ┌──────────────┐  │
 │  Simulator   │ ◄───────────────────── │   netlist    │  │
 │ (event-driven│ ── values of every ──────────────────────┘
 │  unit delay) │    pin (snapshot)
 └──────────────┘
        ▲
        │ fresh simulator per row
 ┌──────┴───────┐      ┌───────────────┐      ┌──────────────────┐
 │ truth table  │ ───► │    checker    │ ───► │ misconception    │
 │ (every row)  │      │ (vs CheckSpec)│      │ signatures       │
 └──────────────┘      └───────────────┘      └──────────────────┘
```

## The pieces

**`src/sim` — the simulation core.** Pure TypeScript with no React or browser code, so it
can be unit-tested, run in a Web Worker or used by a grader. A type-checking rule and a
lint rule keep it that way.

- `circuit.ts` – the **CircuitDoc**: parts, positions and wires. It holds the _design_
  only, never which wires are on. Every edit returns a new document, so undo is just "go
  back to the previous document".
- `registry.ts`, `components.ts` – what each part _is_: its pins and how it computes
  outputs. Switches are marked as inputs and lights as outputs; new parts plug in here.
- `values.ts` – signals are 0, 1 or **X** (unknown/unconnected), with three-valued logic:
  AND(0, X) is 0 because the answer can't depend on X, but AND(1, X) is X.
- `compile.ts` – turns the document into a fast **netlist**: one signal per output pin,
  and for each input pin the signal it reads. Also finds loops.
- `simulator.ts` – **event-driven, unit-delay** simulation. A flipped switch schedules
  the parts that read it; each tick, scheduled parts recompute and all changes land
  together; repeat until nothing changes. A loop that never settles is caught by a tick
  budget and reported.
- `truthTable.ts` – runs every input combination from a clean start.
- `checker.ts` – compares a circuit with a **CheckSpec** (labels + expected rows + gate
  rules) and returns exactly which rows are wrong and why.
- `misconceptions.ts` – recognizes specific mistakes from the _pattern_ of wrong rows,
  e.g. an XOR built for "not both" is wrong only on the 0,0 row.
- `serialize.ts` – loading untrusted JSON (files, links, storage) safely.

**`src/editor` — the canvas.** One zustand store per editor holds the document, the
switch settings, the latest simulation values, React Flow's nodes and edges, and the
undo history. React Flow handles panning, zooming, dragging and connecting; our own
components draw the gates (hand-made ANSI symbols) and wires. Touch is first-class:
tap-to-add, tap-to-connect, 36px pin targets, and buttons for every shortcut.

**`src/lessons` — the course.** A lesson is data: steps with starter circuits, reference
solutions, check specs and hints, plus one Markdown file of text per step. Steps unlock
in order; progress (no personal data) is saved in the browser. Content tests prove every
step is solvable and not already solved.

**`src/storage`, `src/app`** — localStorage with safe fallbacks, circuit files, share
links (the circuit is compressed into the link itself, so no server is needed), pages,
and hash-based routing for GitHub Pages.

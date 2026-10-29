import { buildCircuit } from './circuit';
import { compile, findLoops } from './compile';
import { Simulator, tickBudget } from './simulator';
import { fullAdder, halfAdder, notChain } from './testCircuits';
import type { Bit } from './values';

describe('Simulator', () => {
  it('computes a half adder for every input', () => {
    const cases: [Bit, Bit, Bit, Bit][] = [
      // A, B, S, C
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [1, 0, 1, 0],
      [1, 1, 0, 1],
    ];
    for (const [A, B, S, C] of cases) {
      const sim = new Simulator(halfAdder(), { A, B });
      expect(sim.pinValue('S', 'in')).toBe(S);
      expect(sim.pinValue('C', 'in')).toBe(C);
    }
  });

  it('computes a full adder for every input', () => {
    for (let n = 0; n < 8; n++) {
      const A = ((n >> 2) & 1) as Bit;
      const B = ((n >> 1) & 1) as Bit;
      const Cin = (n & 1) as Bit;
      const sim = new Simulator(fullAdder(), { A, B, Cin });
      const sum = A + B + Cin;
      expect(sim.pinValue('S', 'in')).toBe(sum % 2);
      expect(sim.pinValue('Cout', 'in')).toBe(sum >= 2 ? 1 : 0);
    }
  });

  it('updates when a switch is flipped', () => {
    const sim = new Simulator(halfAdder(), { A: 1, B: 0 });
    expect(sim.pinValue('C', 'in')).toBe(0);
    sim.setInput('B', 1);
    expect(sim.pinValue('C', 'in')).toBe(1);
    expect(sim.pinValue('S', 'in')).toBe(0);
  });

  it('sends one output to many inputs (fan-out)', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'n1', type: 'NOT' },
        { id: 'n2', type: 'NOT' },
        { id: 'Y', type: 'LIGHT' },
        { id: 'Z', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'n1'],
        ['A', 'n2'],
        ['n1', 'Y'],
        ['n2', 'Z'],
      ],
    });
    const sim = new Simulator(doc, { A: 0 });
    expect(sim.pinValue('Y', 'in')).toBe(1);
    expect(sim.pinValue('Z', 'in')).toBe(1);
  });

  it('reads X from an unconnected input', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'g', type: 'AND' },
        { id: 'Y', type: 'LIGHT' },
      ],
      wires: [
        ['A', 'g.in0'],
        ['g', 'Y'],
      ],
    });
    expect(new Simulator(doc, { A: 1 }).pinValue('Y', 'in')).toBe('X');
    // ...but AND with a 0 is 0 no matter what the other input is.
    expect(new Simulator(doc, { A: 0 }).pinValue('Y', 'in')).toBe(0);
  });

  it('lets a NOT gate wired to itself settle at X (nothing pins its value down)', () => {
    const doc = buildCircuit({
      parts: [{ id: 'n', type: 'NOT' }],
      wires: [['n', 'n']],
    });
    const sim = new Simulator(doc);
    expect(sim.lastReport.settled).toBe(true);
    expect(sim.pinValue('n', 'out')).toBe('X');
    expect(findLoops(compile(doc))).toEqual(new Set(['n']));
  });

  it('detects a circuit that never settles: NAND fed back into itself', () => {
    const doc = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'g', type: 'NAND' },
      ],
      wires: [
        ['A', 'g.in0'],
        ['g', 'g.in1'],
      ],
    });
    // With A = 0 the NAND outputs 1, whatever comes back around: it settles.
    const sim = new Simulator(doc, { A: 0 });
    expect(sim.lastReport.settled).toBe(true);
    expect(sim.pinValue('g', 'out')).toBe(1);
    // Switch A to 1: now out = NOT(out), which flips forever.
    const report = sim.setInput('A', 1);
    expect(report.settled).toBe(false);
    expect(report.unstable).toEqual(['g']);
  });

  it('settles a long chain within the tick budget', () => {
    const doc = notChain(300);
    const sim = new Simulator(doc, { A: 1 });
    expect(sim.lastReport.settled).toBe(true);
    expect(sim.pinValue('Y', 'in')).toBe(1); // 300 NOTs: even, so Y = A
    expect(sim.lastReport.ticks).toBeLessThanOrEqual(tickBudget(doc.components.length));
  });

  it('simulates a 200-part circuit quickly', () => {
    const doc = notChain(200);
    const sim = new Simulator(doc);
    const start = performance.now();
    for (let i = 0; i < 20; i++) sim.setInput('A', (i % 2) as Bit);
    const perUpdate = (performance.now() - start) / 20;
    // A loose bound so CI machines don't flake; typical runs take well under 1 ms.
    expect(perUpdate).toBeLessThan(50);
  });

  it('gives a snapshot of every pin for the editor', () => {
    const sim = new Simulator(halfAdder(), { A: 1, B: 1 });
    const snap = sim.snapshot();
    expect(snap['A.out']).toBe(1);
    expect(snap['x.out']).toBe(0);
    expect(snap['C.in']).toBe(1);
  });
});

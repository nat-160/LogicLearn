import { buildCircuit, grade, type GradeSpec } from '../sim';
import { criterionText } from './criterionText';

const spec: GradeSpec = {
  inputs: ['A', 'B'],
  outputs: ['Y'],
  rule: [
    { inputs: [0, 0], outputs: [0] },
    { inputs: [0, 1], outputs: [0] },
    { inputs: [1, 0], outputs: [0] },
    { inputs: [1, 1], outputs: [1] },
  ],
  criteria: [{ kind: 'matches-rule' }, { kind: 'outputs-use-every-input' }],
};

describe('criterionText', () => {
  it('never shows a missing detail when the circuit cannot be tested', () => {
    // Two switches labelled A: the check is blocked, so no rows are tested.
    const blocked = buildCircuit({
      parts: [
        { id: 'A', type: 'SWITCH' },
        { id: 'A2', type: 'SWITCH', label: 'A' },
        { id: 'B', type: 'SWITCH' },
        { id: 'Y', type: 'LIGHT' },
      ],
    });
    const lines = grade(blocked, spec).criteria.map(criterionText);
    expect(lines).toEqual([
      'Your circuit isn’t finished yet – see the messages below.',
      'Every output should depend on every input – this is checked once your circuit can be tested.',
    ]);
    for (const line of lines) expect(line).not.toMatch(/undefined/);
  });
});

/**
 * The simulation core's public API. The rest of the app imports from here.
 *
 *   circuit.ts        the circuit document (parts + wires) and pure edit operations
 *   registry.ts       what each kind of part is: pins + behavior
 *   components.ts     the Phase 1 parts: switch, light, AND/OR/NOT/NAND/NOR/XOR/XNOR
 *   values.ts         0 / 1 / X and three-valued logic
 *   compile.ts        document → netlist, and loop detection
 *   simulator.ts      event-driven, unit-delay simulation
 *   truthTable.ts     every input combination → outputs
 *   checker.ts        does a circuit match a spec? which rows are wrong?
 *   misconceptions.ts recognizing specific mistakes from the wrong rows
 *   serialize.ts      safe saving/loading as JSON
 *
 * Nothing in src/sim may use React or the browser (see CLAUDE.md).
 */
export * from './values';
export * from './registry';
export * from './components';
export * from './circuit';
export * from './compile';
export * from './simulator';
export * from './truthTable';
export * from './checker';
export * from './misconceptions';
export * from './serialize';

/**
 * A predict step: the student fills in a circuit's whole truth table before the circuit
 * shows its values, then compares (predict → observe → explain).
 *
 *  - The circuit is read-only. Its switches still work and move the highlighted row, but
 *    lights and wires stay hidden ("blind") until the prediction is checked.
 *  - Guided level: any complete prediction finishes the step; the real values appear, the
 *    wrong rows are marked, and a prompt asks the student to explain the difference.
 *  - Challenge level: every row must be right. After a miss, the wrong rows are shown and
 *    the student moves on to the next circuit in the step, so answers can't be copied.
 *
 * A prediction in progress is saved in this browser (stepWork.ts saveStepState).
 */
import { useEffect, useMemo, useState } from 'react';
import { useEditor } from '../editor/editorContext';
import { Editor } from '../editor/Editor';
import { PredictTable } from '../editor/PredictTable';
import { createEditorStore } from '../editor/store';
import { INTERFACE_LOCALE } from '../i18n/locales';
import {
  comparePredictions,
  computeTruthTable,
  rowNumber,
  type Bit,
  type CircuitDoc,
  type Prediction,
  type TruthTable,
} from '../sim';
import { HintLadder } from './HintLadder';
import { LessonGateReference } from './LessonGateReference';
import { findSharedText } from './lessonText';
import { Markdown } from './Markdown';
import { NextStepButton, StepHeader, type PracticePlace } from './PracticeNav';
import { isStepDone, useProgress } from './progress';
import { stepSpeech, textLang } from './stepSpeech';
import { StepText } from './StepText';
import { loadStepState, saveStepState } from './stepWork';
import type { Lesson, PredictStep } from './types';
import { useHintLadder } from './useHintLadder';
import { useTell } from './useTell';

interface PredictState {
  /** Which of the step's circuits is being predicted. */
  variant: number;
  /** [row][output] */
  cells: Prediction[][];
  /** Whether the prediction was checked and the real values are shown. */
  revealed: boolean;
}

const STATE_KIND = 'predict';

/** Identifies the step's circuits, so a saved prediction is dropped if they change. */
function fingerprint(circuits: readonly CircuitDoc[]): string {
  return circuits.map((c) => c.components.map((p) => `${p.id}:${p.type}`).join(',')).join('|');
}

function tableOf(circuit: CircuitDoc): TruthTable {
  const result = computeTruthTable(circuit, 6);
  // Content tests guarantee predict circuits have at most 6 inputs.
  if (!result.ok) throw new Error('A predict circuit has too many inputs');
  return result.table;
}

const emptyCells = (table: TruthTable): Prediction[][] =>
  table.rows.map(() => table.outputs.map(() => null));

/** A saved prediction, checked field by field; null if it doesn't fit this step. */
function loadState(lesson: Lesson, step: PredictStep): PredictState | null {
  const raw = loadStepState(STATE_KIND, lesson.id, step.id) as Record<string, unknown> | null;
  if (!raw || typeof raw !== 'object' || raw.fingerprint !== fingerprint(step.circuits)) {
    return null;
  }
  const variant = raw.variant;
  if (!Number.isInteger(variant) || (variant as number) < 0) return null;
  const table = tableOf(step.circuits[(variant as number) % step.circuits.length]);
  const cells = raw.cells;
  const ok =
    Array.isArray(cells) &&
    cells.length === table.rows.length &&
    cells.every(
      (row) =>
        Array.isArray(row) &&
        row.length === table.outputs.length &&
        row.every((c) => c === 0 || c === 1 || c === null),
    );
  if (!ok || typeof raw.revealed !== 'boolean') return null;
  return { variant: variant as number, cells: cells as Prediction[][], revealed: raw.revealed };
}

export function PredictStepView({
  lesson,
  step,
  index,
  practice,
}: {
  lesson: Lesson;
  step: PredictStep;
  index: number;
  /** Shown as a practice step (outside the numbered steps). */
  practice?: PracticePlace;
}) {
  const visit = useProgress((s) => s.visit);
  const [state, setState] = useState<PredictState>(
    () =>
      loadState(lesson, step) ?? {
        variant: 0,
        cells: emptyCells(tableOf(step.circuits[0])),
        revealed: false,
      },
  );
  const circuit = step.circuits[state.variant % step.circuits.length];
  const table = useMemo(() => tableOf(circuit), [circuit]);
  const store = useMemo(() => createEditorStore(circuit), [circuit]);

  useEffect(() => visit(lesson.id, step.id), [visit, lesson.id, step.id]);
  useEffect(() => {
    saveStepState(STATE_KIND, lesson.id, step.id, {
      fingerprint: fingerprint(step.circuits),
      ...state,
    });
  }, [state, lesson.id, step.id, step.circuits]);

  return (
    <Editor
      key={state.variant}
      store={store}
      readOnly
      blind={!state.revealed}
      lead={<PredictPanel lesson={lesson} step={step} index={index} practice={practice} />}
      side={
        <PredictSide lesson={lesson} step={step} table={table} state={state} setState={setState} />
      }
    />
  );
}

/** Instructions, hints and Next step. */
function PredictPanel({
  lesson,
  step,
  index,
  practice,
}: {
  lesson: Lesson;
  step: PredictStep;
  index: number;
  practice?: PracticePlace;
}) {
  const done = useProgress((s) => isStepDone(s.steps, lesson.id, step.id));
  const hints = useHintLadder(lesson, step);
  return (
    <div className="lesson-panel">
      <StepHeader lesson={lesson} index={index} practice={practice} />
      <StepText
        step={step}
        tag={practice ? 'Practice' : step.level === 'challenge' ? 'Challenge' : undefined}
        speech={() => stepSpeech(step, hints.shown, null)}
      />
      <HintLadder step={step} shown={hints.shown} onShow={hints.show} stuck={hints.stuck} />
      <LessonGateReference lessonId={lesson.id} />
      {done && <NextStepButton lesson={lesson} index={index} practice={practice} />}
    </div>
  );
}

/** The prediction table, Check my predictions, and what happened. Lives inside the editor. */
function PredictSide({
  lesson,
  step,
  table,
  state,
  setState,
}: {
  lesson: Lesson;
  step: PredictStep;
  table: TruthTable;
  state: PredictState;
  setState: (change: (s: PredictState) => PredictState) => void;
}) {
  const inputs = useEditor((s) => s.inputs);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const tell = useTell();
  const [message, setMessage] = useState<string | null>(null);
  const tableId = `predict-${step.id}`;

  const currentRow = rowNumber(table.inputs.map((p) => inputs[p.id] ?? 0));
  const result = state.revealed ? comparePredictions(table, state.cells) : null;
  const allRight = !!result && result.rowsRight === result.rows;
  const reveal = findSharedText('predict-reveal', step.locale);

  const say = (text: string) => {
    setMessage(text);
    tell('result', text, INTERFACE_LOCALE);
  };

  const onChange = (row: number, output: number, bit: Bit) => {
    setMessage(null);
    setState((s) => ({
      ...s,
      cells: s.cells.map((cells, r) =>
        r === row ? cells.map((c, o) => (o === output ? bit : c)) : cells,
      ),
    }));
  };

  const onCheck = () => {
    const check = comparePredictions(table, state.cells);
    if (!check.complete) {
      const left = check.rows - state.cells.filter((row) => row.every((c) => c !== null)).length;
      say(`${left} ${left === 1 ? 'row still needs' : 'rows still need'} a prediction.`);
      const r = state.cells.findIndex((row) => row.some((c) => c === null));
      const o = state.cells[r].findIndex((c) => c === null);
      document.querySelector<HTMLInputElement>(`input[name="${tableId}-r${r}-o${o}"]`)?.focus();
      return;
    }
    const pass = step.level === 'guided' || check.rowsRight === check.rows;
    recordAttempt(lesson.id, step.id, {
      pass,
      predicted: { right: check.rowsRight, rows: check.rows },
    });
    setState((s) => ({ ...s, revealed: true }));
    if (check.rowsRight === check.rows) say(`All ${check.rows} rows right!`);
    else if (step.level === 'guided')
      say(`${check.rowsRight} of ${check.rows} rows right. The wrong rows are marked.`);
    else
      say(
        `${check.rowsRight} of ${check.rows} rows right. The wrong rows are marked – try another circuit to show you've got it.`,
      );
  };

  const onTryAnother = () => {
    const variant = state.variant + 1;
    const next = tableOf(step.circuits[variant % step.circuits.length]);
    setMessage(null);
    setState(() => ({ variant, cells: emptyCells(next), revealed: false }));
  };

  return (
    <section className="panel" aria-labelledby="predict-title">
      <h2 id="predict-title" className="panel-title">
        Your predictions
      </h2>
      <PredictTable
        id={tableId}
        caption={`Predict the truth table. Inputs: ${table.inputs.map((p) => p.label).join(', ')}. Outputs: ${table.outputs.map((p) => p.label).join(', ')}.`}
        inputs={table.inputs.map((p) => p.label)}
        outputs={table.outputs.map((p) => p.label)}
        rows={table.rows.map((r) => r.inputs)}
        cells={state.cells}
        onChange={onChange}
        currentRow={currentRow}
        disabled={state.revealed}
        result={
          result && {
            actual: table.rows.map((r) => r.outputs),
            right: result.right,
          }
        }
      />
      {!state.revealed && (
        <button type="button" className="primary" onClick={onCheck} data-testid="check-predictions">
          Check my predictions
        </button>
      )}
      {message && (
        <p className="predict-message" data-testid="predict-message">
          {message}
        </p>
      )}
      {state.revealed && !allRight && step.level === 'guided' && reveal && (
        <div className="predict-reveal" lang={textLang(reveal)}>
          <h3>{reveal.title}</h3>
          <Markdown source={reveal.prose} />
        </div>
      )}
      {state.revealed && !allRight && step.level === 'challenge' && (
        <button type="button" className="primary" onClick={onTryAnother} data-testid="try-another">
          Try another circuit
        </button>
      )}
    </section>
  );
}

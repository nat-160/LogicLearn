/**
 * The teacher view (#/teacher): the teacher guide, the answer key, every lesson's unlock
 * code, and a checker for students' completion codes. It opens with the teacher code
 * (codes.ts), which discourages students from peeking but is not security: LogicLearn's
 * source, answers included, is public.
 *
 * The answer key shows each solution as text (every part and wire), the truth table it
 * makes, and a link that opens a copy in the sandbox – no circuit is drawn here, so the
 * page also prints well.
 */
import { useEffect, useId, useState } from 'react';
import { announce } from '../a11y/announcer';
import { partName, pinName } from '../editor/describe';
import { useLocale } from '../settings/display';
import {
  computeTruthTable,
  findIO,
  type Bit,
  type CheckRow,
  type CircuitDoc,
  type Value,
} from '../sim';
import { encodeShareData } from '../storage/storage';
import { getLessons } from './catalog';
import {
  canUseCodes,
  dayToDate,
  isTeacherCode,
  NO_CODES_MESSAGE,
  readCompletionCode,
  unlockCode,
} from './codes';
import { lessonName } from './gating';
import { findLessonFile, parseStepText } from './lessonText';
import { Markdown } from './Markdown';
import { useTeacher } from './teacher';
import { isBuildStep, isPredictStep, isProjectStep, type Lesson } from './types';

export function TeacherPage({ guideOnly = false }: { guideOnly?: boolean }) {
  const on = useTeacher((s) => s.on);
  if (!canUseCodes()) {
    return (
      <div className="page narrow">
        <h1>Teacher view</h1>
        <p>{NO_CODES_MESSAGE}</p>
      </div>
    );
  }
  if (!on) return <TeacherCodeForm />;
  return guideOnly ? <TeacherGuide /> : <TeacherHome />;
}

function TeacherCodeForm() {
  const setOn = useTeacher((s) => s.setOn);
  const [code, setCode] = useState('');
  const [wrong, setWrong] = useState(false);
  const id = useId();
  return (
    <div className="page narrow">
      <h1>Teacher view</h1>
      <p>
        The teacher guide, the answer key and the codes for students are here. Enter the teacher
        code that came with LogicLearn.
      </p>
      <form
        className="teacher-code"
        onSubmit={async (e) => {
          e.preventDefault();
          if (await isTeacherCode(code)) {
            setOn(true);
            announce('Teacher view is open.');
          } else {
            setWrong(true);
            announce("That isn't the teacher code.");
          }
        }}
      >
        <label htmlFor={id}>Teacher code</label>
        <input
          id={id}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          data-testid="teacher-code"
        />
        <button type="submit" className="primary">
          Open teacher view
        </button>
      </form>
      {wrong && <p data-testid="teacher-code-wrong">That isn&apos;t the teacher code.</p>}
    </div>
  );
}

function TeacherHome() {
  const setOn = useTeacher((s) => s.setOn);
  const lessons = getLessons(useLocale());
  return (
    <div className="page teacher">
      <h1>Teacher view</h1>
      <div className="button-row">
        <a className="button primary" href="#/teacher/guide">
          Teacher guide (printable)
        </a>
        <button type="button" onClick={() => setOn(false)}>
          Leave teacher view
        </button>
      </div>
      <CheckCompletionCode lessons={lessons} />
      <UnlockCodes lessons={lessons} />
      <AnswerKey lessons={lessons} />
    </div>
  );
}

function TeacherGuide() {
  const locale = useLocale();
  const file = findLessonFile('_teacher', locale, 'guide');
  const guide = parseStepText(file?.text ?? '');
  return (
    <div className="page narrow teacher-guide">
      <p className="no-print">
        <a href="#/teacher">← Back to the teacher view</a>
      </p>
      <h1>{guide.title || 'Teacher guide'}</h1>
      <Markdown source={guide.prose} draft={guide.draft} />
      <button type="button" className="primary no-print" onClick={() => window.print()}>
        Print or save as PDF
      </button>
    </div>
  );
}

/** Check a student's completion code (from their progress report). */
function CheckCompletionCode({ lessons }: { lessons: readonly Lesson[] }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<string[] | 'invalid' | null>(null);
  const [date, setDate] = useState('');
  const id = useId();
  return (
    <section className="panel teacher-section" aria-labelledby="check-code-title">
      <h2 id="check-code-title">Check a completion code</h2>
      <p className="small">
        A student&apos;s progress report ends with a code such as LL-3F9K2Q-X7MA. It lists what is
        finished; a code that was changed or mistyped won&apos;t check out.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const read = await readCompletionCode(code);
          if (!read) {
            setResult('invalid');
            announce("That code doesn't check out.");
            return;
          }
          const names = read.finished.map((i) =>
            lessons[i] ? `${lessonName(lessons[i])}: ${lessons[i].title}` : `Item ${i + 1}`,
          );
          setResult(names);
          setDate(dayToDate(read.day).toLocaleDateString(undefined, { timeZone: 'UTC' }));
          announce(`Code checks out: ${names.length} finished.`);
        }}
      >
        <label htmlFor={id}>Completion code</label>
        <input
          id={id}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          data-testid="check-code-input"
        />
        <button type="submit">Check</button>
      </form>
      {result === 'invalid' && (
        <p data-testid="check-code-result">
          That code doesn&apos;t check out: it was mistyped or changed.
        </p>
      )}
      {Array.isArray(result) && (
        <div data-testid="check-code-result">
          <p>
            The code checks out. Made on {date}; finished ({result.length}):
          </p>
          <ul>
            {result.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/** Every lesson's unlock code, to let a student skip ahead. */
function UnlockCodes({ lessons }: { lessons: readonly Lesson[] }) {
  const [codes, setCodes] = useState<Record<string, string>>({});
  useEffect(() => {
    let current = true;
    void Promise.all(lessons.map(async (l) => [l.id, await unlockCode(l.id)] as const)).then(
      (pairs) => {
        if (current) setCodes(Object.fromEntries(pairs));
      },
    );
    return () => {
      current = false;
    };
  }, [lessons]);
  return (
    <section className="panel teacher-section" aria-labelledby="unlock-codes-title">
      <h2 id="unlock-codes-title">Unlock codes</h2>
      <p className="small">
        Give a student a lesson&apos;s code to open it before they finish the lessons before it.
        They type it on the locked lesson in the lesson list.
      </p>
      <table className="report-table" data-testid="unlock-codes">
        <thead>
          <tr>
            <th scope="col">Lesson</th>
            <th scope="col">Unlock code</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((l) => (
            <tr key={l.id}>
              <th scope="row">
                {lessonName(l)}: {l.title}
              </th>
              <td className="code" data-testid={`unlock-code-for-${l.id}`}>
                {codes[l.id] ?? '…'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/** The answer key, one lesson at a time. */
function AnswerKey({ lessons }: { lessons: readonly Lesson[] }) {
  const [lessonId, setLessonId] = useState(lessons[0]?.id ?? '');
  const lesson = lessons.find((l) => l.id === lessonId);
  const id = useId();
  return (
    <section className="panel teacher-section" aria-labelledby="answer-key-title">
      <h2 id="answer-key-title">Answer key</h2>
      <label className="field" htmlFor={id}>
        <span>Lesson</span>
      </label>
      <select
        id={id}
        value={lessonId}
        onChange={(e) => setLessonId(e.target.value)}
        data-testid="answer-key-lesson"
      >
        {lessons.map((l) => (
          <option key={l.id} value={l.id}>
            {lessonName(l)}: {l.title}
          </option>
        ))}
      </select>
      {lesson && <LessonAnswers lesson={lesson} />}
    </section>
  );
}

function LessonAnswers({ lesson }: { lesson: Lesson }) {
  const items = [
    ...lesson.steps.map((step, i) => ({ step, label: `Step ${i + 1}: ${step.title}` })),
    ...lesson.practice.map((step) => ({ step, label: `Practice: ${step.title}` })),
  ];
  return (
    <div className="answer-key" data-testid="answer-key">
      {items.map(({ step, label }) => {
        if (isBuildStep(step)) {
          return (
            <details key={step.id}>
              <summary>{label}</summary>
              <h3 className="answer-heading">The table to build</h3>
              <RowsTable
                inputs={step.spec.inputs}
                outputs={step.spec.outputs}
                rows={step.spec.expected}
              />
              <h3 className="answer-heading">A solution</h3>
              <CircuitText doc={step.solution} />
            </details>
          );
        }
        if (isPredictStep(step)) {
          return (
            <details key={step.id}>
              <summary>{label}</summary>
              {step.circuits.map((circuit, i) => (
                <div key={i}>
                  <h3 className="answer-heading">
                    {step.circuits.length > 1 ? `Circuit ${i + 1}` : 'The circuit'}
                  </h3>
                  <CircuitText doc={circuit} />
                  <CircuitTable doc={circuit} />
                </div>
              ))}
            </details>
          );
        }
        if (isProjectStep(step)) {
          return (
            <details key={step.id}>
              <summary>{label}</summary>
              {step.briefs.map((brief) => (
                <div key={brief.id}>
                  <h3 className="answer-heading">{brief.title}: an example rule and circuit</h3>
                  <RowsTable
                    inputs={brief.inputs}
                    outputs={brief.outputs}
                    rows={brief.example.rule}
                  />
                  <CircuitText doc={brief.example.solution} />
                </div>
              ))}
            </details>
          );
        }
        return null; // explain steps have nothing to answer
      })}
    </div>
  );
}

function RowsTable({
  inputs,
  outputs,
  rows,
}: {
  inputs: readonly string[];
  outputs: readonly string[];
  rows: readonly (CheckRow | { inputs: readonly Bit[]; outputs: readonly Value[] })[];
}) {
  return (
    <table className="truth-table answer-table">
      <thead>
        <tr>
          {inputs.map((l) => (
            <th key={`i-${l}`} scope="col" className="col-input">
              {l}
            </th>
          ))}
          {outputs.map((l) => (
            <th key={`o-${l}`} scope="col" className="col-output">
              {l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.inputs.map((v, k) => (
              <td key={`i${k}`} className="col-input">
                {v}
              </td>
            ))}
            {row.outputs.map((v, k) => (
              <td key={`o${k}`} className="col-output">
                {v === 'X' ? '?' : v}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A circuit's own truth table (for prediction steps). */
function CircuitTable({ doc }: { doc: CircuitDoc }) {
  const result = computeTruthTable(doc);
  if (!result.ok) return null;
  const io = findIO(doc);
  return (
    <RowsTable
      inputs={io.inputs.map((p) => p.label)}
      outputs={io.outputs.map((p) => p.label)}
      rows={result.table.rows}
    />
  );
}

/** A circuit in words – every part and wire – with a link that opens a copy in the sandbox. */
function CircuitText({ doc }: { doc: CircuitDoc }) {
  return (
    <div className="circuit-text">
      <p className="small">
        <strong>Parts:</strong> {doc.components.map(partName).join(', ')}
      </p>
      <ul className="small">
        {doc.wires.map((w) => (
          <li key={w.id}>
            {pinName(doc, w.from)} → {pinName(doc, w.to)}
          </li>
        ))}
      </ul>
      <p className="small no-print">
        <a href={`#/share/${encodeShareData(doc)}`}>Open this circuit in the sandbox (a copy)</a>
      </p>
    </div>
  );
}

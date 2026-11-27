/**
 * The gate reminder card: the gates taught so far, each with its symbol, its rule in
 * words and its truth table. It is a closed <details> until the student opens it, so it
 * is always at hand without taking space.
 *
 * The words come from content/_shared/<locale>/gate-<TYPE>.md (the course author edits
 * them); the truth tables are computed from the simulator's own gate definitions, so they
 * can never contain a typo.
 */
import { GateShape } from '../editor/nodes/shapes';
import { markdownToSpeech } from '../narration/plainText';
import { ReadAloudButton } from '../narration/ReadAloud';
import { gateTruthTable } from '../sim';
import { useLocale } from '../settings/display';
import { findSharedText } from './lessonText';
import { Markdown } from './Markdown';
import { textLang } from './stepSpeech';

const INPUT_NAMES = ['A', 'B', 'C', 'D'];

function gateText(type: string, locale: string) {
  const text = findSharedText(`gate-${type}`, locale);
  return { title: text?.title || type, prose: text?.prose ?? '', locale: text?.locale ?? locale };
}

/** "AND. The output is 1 only when … A 0, B 0: 0. A 0, B 1: 0. …" */
function gateSpeech(type: string, locale: string): string {
  const { title, prose } = gateText(type, locale);
  const table = gateTruthTable(type);
  const rows = table.rows.map(
    (r) => `${r.inputs.map((bit, i) => `${INPUT_NAMES[i]} ${bit}`).join(', ')}: ${r.output}.`,
  );
  return `${title}. ${markdownToSpeech(prose)} ${rows.join(' ')}`;
}

export function GateReference({ gates }: { gates: readonly string[] }) {
  const locale = useLocale();
  if (gates.length === 0) return null;
  return (
    <details className="gate-reference" data-testid="gate-reference">
      <summary>Gate reminder</summary>
      <ReadAloudButton
        id="gates"
        label="Read the gate reminder aloud"
        getText={() => gates.map((g) => gateSpeech(g, locale)).join(' ')}
        lang={locale}
      />
      {gates.map((type) => {
        const text = gateText(type, locale);
        const table = gateTruthTable(type);
        const names = INPUT_NAMES.slice(0, table.inputs);
        return (
          <section key={type} className="gate-card" aria-labelledby={`gate-${type}`}>
            <div className="gate-card-head">
              <span className="gate-card-symbol">
                <GateShape type={type} />
              </span>
              <h3 id={`gate-${type}`} lang={textLang(text)}>
                {text.title}
              </h3>
            </div>
            <Markdown source={text.prose} lang={textLang(text)} />
            <table className="gate-table">
              <caption className="sr-only">{text.title} truth table</caption>
              <thead>
                <tr>
                  {names.map((n) => (
                    <th key={n} scope="col">
                      {n}
                    </th>
                  ))}
                  <th scope="col">Out</th>
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, i) => (
                  <tr key={i}>
                    {row.inputs.map((bit, j) => (
                      <td key={j}>{bit}</td>
                    ))}
                    <td className="gate-table-out">{row.output}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </details>
  );
}

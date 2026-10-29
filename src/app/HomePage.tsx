import { getLessons } from '../lessons/catalog';
import { useLocale } from '../settings/display';
import { lessonHref } from './routes';

export function HomePage() {
  const first = getLessons(useLocale())[0];
  return (
    <div className="page home">
      <section className="hero">
        <h1>Build the logic inside computers.</h1>
        <p className="lead">
          Drag gates onto the canvas, wire them up, and flip switches to see your circuit think.
          Lessons guide you step by step, and check your work as you go.
        </p>
        <div className="hero-actions">
          {first && (
            <a className="button primary" href={lessonHref(first.id)}>
              Start lesson {first.number}: {first.title}
            </a>
          )}
          <a className="button" href="#/sandbox">
            Open the sandbox
          </a>
        </div>
        <p className="muted small">
          Works in any modern browser. No account needed – your work stays on this device.
        </p>
      </section>
    </div>
  );
}

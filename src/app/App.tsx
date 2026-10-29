/**
 * The app shell: a skip link, a header with navigation and the Accessibility settings,
 * the page for the current route, and the screen reader announcement regions.
 */
import { useEffect, useRef } from 'react';
import { useAnnouncer } from '../a11y/announcer';
import { LessonList } from '../lessons/LessonList';
import { LessonPage } from '../lessons/LessonPage';
import { SettingsButton } from '../settings/SettingsDialog';
import { HomePage } from './HomePage';
import { useRoute, type Route } from './routes';
import { SandboxPage } from './SandboxPage';
import { SharePage } from './SharePage';
import { IS_TEST_VERSION } from './site';

export function App() {
  const route = useRoute();
  const main = useRef<HTMLElement>(null);
  useNoPagePinchZoom();
  useFocusOnPageChange(routeKey(route), main);

  return (
    <div className="app">
      {/* A button, not a "#main" link: the part of the address after # picks the page. */}
      <button type="button" className="skip-link" onClick={() => main.current?.focus()}>
        Skip to main content
      </button>
      {IS_TEST_VERSION && <TestVersionBanner />}
      <header className="app-header">
        <a className="brand" href="#/">
          <img src="./favicon.svg" alt="" width={28} height={28} />
          LogicLearn
        </a>
        <nav className="app-nav" aria-label="Main">
          <a
            href="#/lessons"
            aria-current={route.page === 'lessons' || route.page === 'lesson' ? 'page' : undefined}
          >
            Lessons
          </a>
          <a href="#/sandbox" aria-current={route.page === 'sandbox' ? 'page' : undefined}>
            Sandbox
          </a>
        </nav>
        <span className="header-spacer" />
        <SettingsButton />
      </header>
      <main className="app-main" id="main-content" ref={main} tabIndex={-1}>
        <Page key={routeKey(route)} route={route} />
      </main>
      <LiveAnnouncer />
    </div>
  );
}

/**
 * Shown on every page of the test version (built from the dev branch), so testers always
 * know which copy they're on. It is not a live region: it's there from the start.
 */
function TestVersionBanner() {
  return (
    <aside
      className="test-version-banner"
      aria-label="Test version"
      data-testid="test-version-banner"
    >
      <p>
        <strong>Test version</strong> (dev branch). Progress and settings here are separate from the
        live site. <a href="../">Go to the live site</a>
      </p>
    </aside>
  );
}

/** The always-present live regions that `announce()` writes into (see announcer.ts). */
function LiveAnnouncer() {
  const polite = useAnnouncer((s) => s.polite);
  const assertive = useAnnouncer((s) => s.assertive);
  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true" data-testid="announcer">
        {polite}
      </div>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {assertive}
      </div>
    </>
  );
}

/**
 * When the page (or lesson step) changes, move keyboard focus to its main heading, so a
 * screen reader announces the new page instead of staying silent.
 *
 * (It doesn't stop narration: each page stops its own reading when it closes, which
 * happens before the new step starts reading. Stopping here, after the new step has
 * started, would cut off automatic reading.)
 */
function useFocusOnPageChange(key: string, main: React.RefObject<HTMLElement | null>) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const heading = main.current?.querySelector<HTMLElement>('h1');
    const target = heading ?? main.current;
    if (!target) return;
    if (heading && !heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    target.focus();
  }, [key, main]);
}

/**
 * On iPad, pinching anywhere zooms the whole page, which breaks the layout mid-lesson.
 * Pinching on the canvas zooms the circuit instead (React Flow handles that); elsewhere
 * the page-level pinch is blocked. iOS ignores `user-scalable=no`, hence the event.
 */
function useNoPagePinchZoom() {
  useEffect(() => {
    const block = (e: Event) => {
      if (!(e.target instanceof Element && e.target.closest('.react-flow'))) e.preventDefault();
    };
    document.addEventListener('gesturestart', block, { passive: false });
    return () => document.removeEventListener('gesturestart', block);
  }, []);
}

/** A new key per page (and per lesson step) gives each one a fresh editor. */
function routeKey(route: Route): string {
  return route.page === 'lesson' ? `lesson/${route.lessonId}/${route.step}` : route.page;
}

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case 'home':
      return <HomePage />;
    case 'sandbox':
      return <SandboxPage />;
    case 'lessons':
      return <LessonList />;
    case 'lesson':
      return <LessonPage lessonId={route.lessonId} step={route.step} />;
    case 'share':
      return <SharePage data={route.data} />;
    case 'not-found':
      return (
        <div className="page narrow">
          <h1>Page not found</h1>
          <p>
            <a href="#/">Go to the home page</a>
          </p>
        </div>
      );
  }
}

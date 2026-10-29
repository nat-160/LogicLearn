/**
 * The app shell: a header with navigation, and the page for the current route.
 */
import { useEffect } from 'react';
import { LessonList } from '../lessons/LessonList';
import { LessonPage } from '../lessons/LessonPage';
import { HomePage } from './HomePage';
import { useRoute, type Route } from './routes';
import { SandboxPage } from './SandboxPage';
import { SharePage } from './SharePage';

export function App() {
  const route = useRoute();
  useNoPagePinchZoom();
  return (
    <div className="app">
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
      </header>
      <main className="app-main">
        <Page key={routeKey(route)} route={route} />
      </main>
    </div>
  );
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

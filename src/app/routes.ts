/**
 * Hash-based routes. GitHub Pages only serves files, so the page address after "#" picks
 * the screen:
 *
 *   #/                       home
 *   #/sandbox                free building
 *   #/lessons                lesson list
 *   #/lesson/<id>/<step>     a lesson step (step numbers start at 1)
 *   #/share/<data>           a circuit someone shared
 */
import { useEffect, useState } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'sandbox' }
  | { page: 'lessons' }
  | { page: 'lesson'; lessonId: string; step: number }
  | { page: 'share'; data: string }
  | { page: 'not-found'; path: string };

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { page: 'home' };
  if (parts[0] === 'sandbox' && parts.length === 1) return { page: 'sandbox' };
  if (parts[0] === 'lessons' && parts.length === 1) return { page: 'lessons' };
  if (parts[0] === 'lesson' && parts[1]) {
    const step = Number(parts[2] ?? '1');
    return {
      page: 'lesson',
      lessonId: parts[1],
      step: Number.isInteger(step) && step >= 1 ? step : 1,
    };
  }
  if (parts[0] === 'share' && parts[1]) return { page: 'share', data: parts.slice(1).join('/') };
  return { page: 'not-found', path };
}

export function lessonHref(lessonId: string, step = 1): string {
  return `#/lesson/${lessonId}/${step}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(href: string): void {
  window.location.hash = href.replace(/^#/, '');
}

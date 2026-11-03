/**
 * Short messages shared by several lesson views. Their words are in
 * content/_shared/<locale>/*.md so the course author can edit (and translate) them.
 */
import { fillPlaceholders, findSharedText } from './lessonText';

/** The "Stuck? A hint is ready." note (nudge-stuck.md). */
export function stuckText(locale: string): string {
  return findSharedText('nudge-stuck', locale)?.title || 'Stuck? A hint is ready.';
}

/** "You have tried 2 of 4 rows." (nudge-untried-rows.md) */
export function nudgeTitle(locale: string, tried: number, total: number): string {
  const text = findSharedText('nudge-untried-rows', locale);
  return fillPlaceholders(text?.title || 'You have tried {tried} of {total} rows.', {
    tried,
    total,
  });
}

/**
 * Short messages shared by several lesson views. Their words are in
 * content/_shared/<locale>/*.md so the course author can edit (and translate) them.
 */
import { findSharedText } from './lessonText';

/** The "Stuck? A hint is ready." note (nudge-stuck.md). */
export function stuckText(locale: string): string {
  return findSharedText('nudge-stuck', locale)?.title || 'Stuck? A hint is ready.';
}

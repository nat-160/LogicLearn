/**
 * Where keyboard focus goes after a part is deleted. The deleted part (and the inspector
 * that showed it) disappear, and focus would otherwise drop to the top of the page, so it
 * moves to the canvas of the same editor instead.
 */
export function focusCanvas(within: Element | null): void {
  const canvas = (within ?? document).querySelector<HTMLElement>('.canvas');
  canvas?.focus();
}

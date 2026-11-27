/**
 * The box around a truth table, which scrolls sideways when the table is too wide (many
 * output columns, a narrow screen, a large font). While it scrolls it can be focused, so
 * keyboard users can scroll it with the arrow keys; otherwise it is not a tab stop.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export function TableScroll({ label, children }: { label: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const update = () => setScrolls(box.scrollWidth > box.clientWidth + 1);
    update();
    if (typeof ResizeObserver === 'undefined') return;
    // The box changes size with the panel; the table changes size with its columns.
    const observer = new ResizeObserver(update);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="table-scroll"
      {...(scrolls && { tabIndex: 0, role: 'region', 'aria-label': label })}
    >
      {children}
    </div>
  );
}

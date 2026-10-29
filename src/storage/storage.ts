/**
 * Saving in the browser (localStorage), files and share links. Nothing ever leaves the
 * device unless the student downloads a file or copies a link themselves.
 *
 * localStorage can be unavailable (private windows, blocked storage) or wiped (Safari
 * removes a site's storage after 7 days without a visit), so every access is wrapped and
 * the app still works without it. Students can always export a file as a backup.
 */
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import {
  parseCircuit,
  serializeCircuit,
  unlockAll,
  type CircuitDoc,
  type LoadResult,
} from '../sim';

export function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/** Ask the browser not to clear our storage when space runs low (best effort). */
export function requestPersistentStorage(): void {
  try {
    void navigator.storage?.persist?.().catch(() => undefined);
  } catch {
    // Not supported: nothing to do.
  }
}

// --- The sandbox's autosave -------------------------------------------------

const SANDBOX_KEY = 'logiclearn:sandbox:v1';
const UNREADABLE_KEY = 'logiclearn:sandbox:unreadable';

/**
 * The saved sandbox circuit, or null. A save that can't be read (e.g. made by a newer
 * version of the app) is copied aside first, so the next autosave can't destroy it.
 * Sandbox parts are never locked, even if the saved circuit came from a shared link.
 */
export function loadSandbox(): CircuitDoc | null {
  const text = readLocal(SANDBOX_KEY);
  if (!text) return null;
  const result = parseCircuit(text);
  if (result.ok) return unlockAll(result.doc);
  writeLocal(UNREADABLE_KEY, text);
  return null;
}

export function saveSandbox(doc: CircuitDoc): void {
  writeLocal(SANDBOX_KEY, serializeCircuit(doc));
}

// --- Files --------------------------------------------------------------------

export const FILE_EXTENSION = '.circuit.json';

/** Download the circuit as a file the student can keep or send to a teacher. */
export function downloadCircuit(doc: CircuitDoc): void {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeFileName(doc.name)}${FILE_EXTENSION}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function readCircuitFile(file: File): Promise<LoadResult> {
  if (file.size > 2_000_000)
    return { ok: false, errors: ['That file is too big to be a circuit.'] };
  return parseCircuit(await file.text());
}

function safeFileName(name: string): string {
  return (
    name
      .replace(/[^a-z0-9-_ ]/gi, '')
      .trim()
      .replace(/\s+/g, '-') || 'circuit'
  );
}

// --- Share links ------------------------------------------------------------------
//
// The whole circuit is compressed into the link itself (#/share/<data>), so sharing needs
// no server. Very large circuits make links too long to paste comfortably; then we
// suggest downloading a file instead.

export const MAX_SHARE_LINK_LENGTH = 8000;

export function encodeShareData(doc: CircuitDoc): string {
  return compressToEncodedURIComponent(serializeCircuit(doc));
}

export function decodeShareData(data: string): LoadResult {
  let text: string | null;
  try {
    // Some apps percent-encode characters in links they pass on (e.g. "$" → "%24").
    const raw = data.includes('%') ? decodeURIComponent(data) : data;
    text = decompressFromEncodedURIComponent(raw);
  } catch {
    text = null;
  }
  if (!text) return { ok: false, errors: ['This share link is broken or incomplete.'] };
  return parseCircuit(text);
}

export function shareUrl(doc: CircuitDoc): string | null {
  const base = window.location.href.split('#')[0];
  const url = `${base}#/share/${encodeShareData(doc)}`;
  return url.length <= MAX_SHARE_LINK_LENGTH ? url : null;
}

/**
 * Codes for teachers and students, all checked in this browser (SHA-256, nothing is sent
 * anywhere):
 *  - the **teacher code** opens the teacher view (guide, answer key, codes);
 *  - an **unlock code** opens one lesson early, for a student the teacher lets skip ahead;
 *  - a **completion code** sums up which lessons a student has finished, so a teacher
 *    can check a progress report.
 *
 * They discourage rather than secure: LogicLearn's source is public, so a determined
 * student could work a code out. A completion code is tamper-evident (a changed code
 * fails its checksum), not tamper-proof. The teacher guide says so.
 */

const SALT = 'logiclearn/2026';

/** Letters and digits that can't be confused with each other (no 0/O, 1/I). */
export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/** SHA-256 of the teacher code (without its dash, in capitals). The code itself isn't stored. */
const TEACHER_CODE_HASH = '9421f0a1dc977c4f8aa356f0693a9dec08131ada241419299bcfb75b5036cc27';

/** A typed code tidied up: capitals, and no spaces or dashes. */
export function normalizeCode(text: string): string {
  return text.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

/**
 * Whether this browser can check codes. Web Crypto needs a secure page (https or this
 * computer); on plain http, code features say so instead of failing silently.
 */
export const canUseCodes = () => typeof crypto !== 'undefined' && !!crypto.subtle;

/** Shown where a code feature can't work (see canUseCodes). */
export const NO_CODES_MESSAGE =
  'Codes need a secure (https) page. Open LogicLearn from its https:// address to use them.';

async function sha256(text: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(text);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
}

const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

/** The first `bits` bits of some bytes, as a number (at most 48 bits). */
function leadingBits(bytes: Uint8Array, bits: number): number {
  let value = 0;
  for (let i = 0; i < bits; i++) {
    const bit = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
    value = value * 2 + bit;
  }
  return value;
}

/** A number written with `length` characters of CODE_ALPHABET (5 bits each). */
function toCode(value: number, length: number): string {
  let out = '';
  for (let i = length - 1; i >= 0; i--) {
    out += CODE_ALPHABET[Math.floor(value / 2 ** (5 * i)) % 32];
  }
  return out;
}

function fromCode(text: string): number | undefined {
  let value = 0;
  for (const ch of text) {
    const digit = CODE_ALPHABET.indexOf(ch);
    if (digit < 0) return undefined;
    value = value * 32 + digit;
  }
  return value;
}

export async function isTeacherCode(code: string): Promise<boolean> {
  return hex(await sha256(normalizeCode(code))) === TEACHER_CODE_HASH;
}

/** The 6-character code that unlocks one lesson. */
export async function unlockCode(lessonId: string): Promise<string> {
  return toCode(leadingBits(await sha256(`${SALT}:unlock:${lessonId}`), 30), 6);
}

/** The lesson (of those given) that a typed unlock code opens, if any. */
export async function lessonForUnlockCode(
  code: string,
  lessonIds: readonly string[],
): Promise<string | undefined> {
  const typed = normalizeCode(code);
  for (const id of lessonIds) {
    if ((await unlockCode(id)) === typed) return id;
  }
  return undefined;
}

// --- Completion codes ----------------------------------------------------------------
// "LL-XXXXXX-XXXX": 30 bits (format version, one bit per catalog entry that is finished,
// and the day the code was made), then a 20-bit checksum.

const VERSION = 1;
/** How many catalog entries a completion code can hold. */
export const LESSON_BITS = 16;
const DAY_BITS = 12;
const EPOCH = Date.UTC(2026, 0, 1);
const DAY = 24 * 60 * 60 * 1000;

export interface Completion {
  /** Positions (in the lesson catalog) of the finished lessons, projects and test-outs. */
  finished: number[];
  /** Days since 1 Jan 2026 (UTC) when the code was made. */
  day: number;
}

/** The day of `date` on the student's own calendar (so a report printed in the evening
 * shows the same date as the teacher sees), counted from 1 Jan 2026. */
export const dayNumber = (date: Date) => {
  const local = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.max(0, Math.min(2 ** DAY_BITS - 1, Math.round((local - EPOCH) / DAY)));
};
export const dayToDate = (day: number) => new Date(EPOCH + day * DAY);

async function checksum(payload: string): Promise<string> {
  return toCode(leadingBits(await sha256(`${SALT}:done:${payload}`), 20), 4);
}

export async function completionCode({ finished, day }: Completion): Promise<string> {
  let lessons = 0;
  for (const i of new Set(finished)) {
    if (Number.isInteger(i) && i >= 0 && i < LESSON_BITS) lessons += 2 ** i;
  }
  const value = (VERSION * 2 ** LESSON_BITS + lessons) * 2 ** DAY_BITS + (day % 2 ** DAY_BITS);
  const payload = toCode(value, 6);
  return `LL-${payload}-${await checksum(payload)}`;
}

/** A typed completion code read back, or null if it is mistyped or was changed. */
export async function readCompletionCode(code: string): Promise<Completion | null> {
  const text = normalizeCode(code);
  if (!/^LL[0-9A-Z]{10}$/.test(text)) return null;
  const payload = text.slice(2, 8);
  if ((await checksum(payload)) !== text.slice(8)) return null;
  const value = fromCode(payload);
  if (value === undefined) return null;
  const day = value % 2 ** DAY_BITS;
  const rest = Math.floor(value / 2 ** DAY_BITS);
  if (Math.floor(rest / 2 ** LESSON_BITS) !== VERSION) return null;
  const lessons = rest % 2 ** LESSON_BITS;
  const finished = [...Array(LESSON_BITS).keys()].filter((i) => Math.floor(lessons / 2 ** i) % 2);
  return { finished, day };
}

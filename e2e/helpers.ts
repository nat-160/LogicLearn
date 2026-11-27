import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

/** Click with a mouse, or tap on the touch-only project. Every action has a tap version. */
export async function press(target: Locator, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.use.hasTouch) await target.tap();
  else await target.click();
}

/** Connect two pins the touch-friendly way: tap (or click) one, then the other. */
export async function connect(
  page: Page,
  testInfo: TestInfo,
  from: [string, string],
  to: [string, string],
): Promise<void> {
  await press(page.getByTestId(`pin-${from[0]}-${from[1]}`), testInfo);
  await press(page.getByTestId(`pin-${to[0]}-${to[1]}`), testInfo);
}

/** Add a part by tapping it in the palette. Returns nothing; ids are predictable. */
export async function addPart(page: Page, testInfo: TestInfo, type: string): Promise<void> {
  const before = await page.locator('.react-flow__node').count();
  await press(page.getByTestId(`palette-${type}`), testInfo);
  await expect(page.locator('.react-flow__node')).toHaveCount(before + 1);
}

export function light(page: Page, label: string): Locator {
  return page.getByRole('img', { name: new RegExp(`^Light ${label}:`) });
}

export function switchButton(page: Page, label: string): Locator {
  return page.getByRole('button', { name: new RegExp(`^Switch ${label}: (on|off)`) });
}

/** Where lesson progress is saved on the live build (the build the e2e tests run). */
export const PROGRESS_KEY = 'logiclearn:progress:v1';

/**
 * Mark lesson steps as done before the page loads ("not-and/build-not" etc.). Progress
 * that is already saved is kept and merged, so a reload during a test keeps what the
 * test did.
 */
export async function seedProgress(page: Page, stepKeys: string[]): Promise<void> {
  await page.addInitScript(
    ([key, keys]) => {
      let saved: Record<string, object> = {};
      try {
        saved = JSON.parse(localStorage.getItem(key) ?? '{}') ?? {};
      } catch {
        // start fresh
      }
      const done = {
        done: true,
        attempts: 1,
        hintsUsed: 0,
        triedRows: [],
        firstSeen: '',
        lastSeen: '',
      };
      for (const k of keys) saved[k] = { ...done, ...(saved[k] ?? {}), done: true };
      localStorage.setItem(key, JSON.stringify(saved));
    },
    [PROGRESS_KEY, stepKeys] as const,
  );
}

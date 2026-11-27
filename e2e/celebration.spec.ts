/** The celebration when a lesson is finished: a badge, motion only when allowed, sound only when chosen. */
import { expect, test, type Page } from '@playwright/test';
import { seedProgress } from './helpers';

const SIGNALS = ['on-and-off', 'unknown-x', 'label-and-wire', 'fan-out'].map((s) => `signals/${s}`);

/** Count chimes: replace the browser's audio with a stand-in that only counts. */
async function countChimes(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { chimes: number; AudioContext: unknown };
    w.chimes = 0;
    w.AudioContext = class {
      currentTime = 0;
      destination = {};
      constructor() {
        w.chimes += 1;
      }
      createOscillator() {
        return { type: '', frequency: {}, connect: (n: unknown) => n, start() {}, stop() {} };
      }
      createGain() {
        const node = {
          gain: {
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
          connect: (n: unknown) => n,
        };
        return node;
      }
      close() {
        return Promise.resolve();
      }
    };
  });
}

const chimes = (page: Page) =>
  page.evaluate(() => (window as unknown as { chimes: number }).chimes);

test('a finished lesson gets a badge and no sound by default', async ({ page }) => {
  await countChimes(page);
  await seedProgress(page, SIGNALS);
  await page.goto('#/lesson/signals/complete');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesson 1 complete!');
  await expect(page.getByRole('img', { name: 'Badge: Lesson 1 complete' })).toBeVisible();
  await expect(page.locator('.burst')).toBeVisible();
  expect(await chimes(page)).toBe(0);
});

test('with "Sound effects" on, it chimes once', async ({ page }) => {
  await countChimes(page);
  await page.addInitScript(() =>
    localStorage.setItem('logiclearn:prefs:v1', JSON.stringify({ sounds: true })),
  );
  await seedProgress(page, SIGNALS);
  await page.goto('#/lesson/signals/complete');
  await expect(page.getByTestId('celebration')).toBeVisible();
  await expect.poll(() => chimes(page)).toBe(1);
});

test('with reduced motion, the burst of dots is left out', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedProgress(page, SIGNALS);
  await page.goto('#/lesson/signals/complete');
  await expect(page.getByTestId('celebration')).toBeVisible();
  await expect(page.locator('.burst')).toBeHidden();
});

test('an unfinished lesson has no celebration yet', async ({ page }) => {
  await seedProgress(page, ['or-xor/meet-or']); // started, not finished
  await page.goto('#/lesson/or-xor/complete');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not finished yet');
});

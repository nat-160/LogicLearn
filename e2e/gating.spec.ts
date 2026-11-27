/**
 * Lesson gating and "Continue": lessons open in order, and Home picks up where the
 * student left off. These tests start with an empty browser (the other tests start with
 * Lesson 1 finished, see playwright.config.ts).
 */
import { expect, test } from '@playwright/test';
import { press, seedProgress } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test('in a new browser, the tour and Lesson 1 are open and later lessons are locked', async ({
  page,
}) => {
  await page.goto('#/lessons');
  await expect(page.getByRole('heading', { level: 2, name: /^Unit 1/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Editor tour/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Signals/ })).toBeVisible();
  // A locked lesson is not a link, and says what to finish first.
  await expect(page.getByRole('link', { name: /NOT and AND/ })).toHaveCount(0);
  await expect(page.locator('.lesson-card.is-locked', { hasText: 'NOT and AND' })).toContainText(
    'Finish Lesson 1 first',
  );

  await page.goto('#/lesson/not-and/1');
  await expect(page.getByRole('heading', { name: 'Not unlocked yet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to Lesson 1' })).toBeVisible();
});

test('finishing a lesson opens the next one', async ({ page }) => {
  await seedProgress(page, ['signals/fan-out']);
  await page.goto('#/lessons');
  await expect(page.getByRole('link', { name: /NOT and AND.*0 of 5 steps/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /OR and XOR/ })).toHaveCount(0);
});

test('Home starts Lesson 1, then continues where the student left off', async ({
  page,
}, testInfo) => {
  await page.goto('#/');
  const main = page.getByTestId('continue-lesson');
  await expect(main).toHaveText(/^Start Lesson 1: Signals/);
  await expect(page.getByRole('link', { name: 'Take the editor tour' })).toBeVisible();
  await press(main, testInfo);
  await press(page.getByTestId('continue'), testInfo); // finish step 1

  await page.goto('#/');
  await expect(main).toHaveText(/^Continue: Lesson 1 – /);
  await press(main, testInfo);
  await expect(page).toHaveURL(/#\/lesson\/signals\/2$/);
});

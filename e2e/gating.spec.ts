/**
 * Lesson gating and "Continue": lessons open in order, and Home picks up where the
 * student left off.
 */
import { expect, test } from '@playwright/test';
import { press } from './helpers';

test('Home starts the first lesson, then continues where the student left off', async ({
  page,
}, testInfo) => {
  await page.goto('#/');
  const main = page.getByTestId('continue-lesson');
  await expect(main).toHaveText(/^Start Lesson 2: NOT and AND/);
  await press(main, testInfo);
  await press(page.getByTestId('continue'), testInfo); // finish step 1

  await page.goto('#/');
  await expect(main).toHaveText(/^Continue: Lesson 2 – /);
  await press(main, testInfo);
  await expect(page).toHaveURL(/#\/lesson\/not-and\/2$/);
});

test('the lesson list is grouped by unit and shows progress in words', async ({ page }) => {
  await page.goto('#/lessons');
  await expect(page.getByRole('heading', { level: 2, name: /^Unit 1/ })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: /^Unit 2/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /NOT and AND.*0 of 5 steps/ })).toBeVisible();
});

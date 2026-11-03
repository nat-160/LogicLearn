import { expect, test } from '@playwright/test';
import { addPart, connect, light, press, seedProgress, switchButton } from './helpers';

test('complete the first two steps of the demo lesson', async ({ page }, testInfo) => {
  await page.goto('#/lessons');
  await press(page.getByRole('link', { name: /NOT and AND/ }), testInfo);

  // Step 1: explore the example, then continue.
  await expect(page.getByRole('heading', { name: 'What is a logic gate?' })).toBeVisible();
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
  await press(switchButton(page, 'A'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
  await press(page.getByTestId('continue'), testInfo);

  // Step 2: build NOT. A first check fails...
  await expect(page.getByRole('heading', { name: 'Build it: NOT' })).toBeVisible();
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('check-result')).toContainText('Not yet');

  // ...a hint is available...
  await press(page.getByTestId('hint-button'), testInfo);
  await expect(page.locator('.hint').first()).toBeVisible();

  // ...and the right circuit passes and unlocks the next step.
  await addPart(page, testInfo, 'NOT'); // not-1
  await connect(page, testInfo, ['A', 'out'], ['not-1', 'in0']);
  await connect(page, testInfo, ['not-1', 'out'], ['Y', 'in']);
  await press(page.getByTestId('check-button'), testInfo);
  // Only the A = 0 row was tried: a nudge offers the other row first.
  await expect(page.getByTestId('tried-rows-nudge')).toContainText('You have tried 1 of 2 rows.');
  await expect(page.getByTestId('check-result')).toHaveCount(0);
  await press(page.getByTestId('try-row'), testInfo);
  await expect(page.getByTestId('try-row')).toHaveCount(0); // every row tried now
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('check-result')).toContainText('Correct');
  await press(page.getByTestId('next-step'), testInfo);
  await expect(page.getByRole('heading', { name: 'AND: all inputs must be on' })).toBeVisible();

  // Progress survives a reload.
  await page.reload();
  await expect(page.getByRole('link', { name: /Step 2: Build it: NOT \(done\)/ })).toBeVisible();
});

test('locked steps cannot be skipped', async ({ page }) => {
  await page.goto('#/lesson/not-and/5');
  await expect(page.getByRole('heading', { name: 'Not unlocked yet' })).toBeVisible();
});

test('the challenge hides outputs until Check (predict first)', async ({ page }, testInfo) => {
  // Pretend steps 1–4 are done.
  await seedProgress(
    page,
    ['what-is-a-gate', 'build-not', 'meet-and', 'build-and'].map((s) => `not-and/${s}`),
  );
  await page.goto('#/lesson/not-and/5');
  await expect(page.getByRole('heading', { name: /on, but not that one/ })).toBeVisible();
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /hidden until you check/);
  await expect(page.getByTestId('truth-table')).toHaveCount(0);

  await addPart(page, testInfo, 'NOT'); // not-1
  await addPart(page, testInfo, 'AND'); // and-1
  await connect(page, testInfo, ['A', 'out'], ['and-1', 'in0']);
  await connect(page, testInfo, ['B', 'out'], ['not-1', 'in0']);
  await connect(page, testInfo, ['not-1', 'out'], ['and-1', 'in1']);
  await connect(page, testInfo, ['and-1', 'out'], ['Y', 'in']);
  await press(page.getByTestId('check-button'), testInfo);

  await expect(page.getByTestId('check-result')).toContainText('Correct');
  await expect(page.getByTestId('truth-table')).toBeVisible();
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: (on|off)/);
});

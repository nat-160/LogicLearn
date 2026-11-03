/** The hint ladder and the gate reminder card. */
import { expect, test } from '@playwright/test';
import { press, seedProgress } from './helpers';

test.beforeEach(async ({ page }) => {
  await seedProgress(page, ['not-and/what-is-a-gate']);
});

test('hints come one at a time, the last one shows how, and they stay after a reload', async ({
  page,
}, testInfo) => {
  await page.goto('#/lesson/not-and/2');
  const hintButton = page.getByTestId('hint-button');
  await expect(hintButton).toHaveText('Show a hint (1 of 3)');
  await press(hintButton, testInfo);
  await press(hintButton, testInfo);
  await expect(hintButton).toHaveText('Show me how (hint 3 of 3)');
  await expect(page.locator('.hint')).toHaveCount(2);

  await page.reload();
  await expect(page.locator('.hint')).toHaveCount(2);
  await expect(hintButton).toHaveText('Show me how (hint 3 of 3)');
});

test('after two failed checks without a hint, a note points to the hints', async ({
  page,
}, testInfo) => {
  await page.goto('#/lesson/not-and/2');
  await expect(page.getByTestId('stuck-note')).toHaveCount(0);
  await press(page.getByTestId('check-button'), testInfo);
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('stuck-note')).toHaveText('Stuck? A hint is ready.');
  await press(page.getByTestId('hint-button'), testInfo);
  await expect(page.getByTestId('stuck-note')).toHaveCount(0);
});

test('the gate reminder shows the gates taught so far, with their truth tables', async ({
  page,
}, testInfo) => {
  await page.goto('#/lesson/not-and/1');
  const card = page.getByTestId('gate-reference');
  await press(card.locator('summary'), testInfo);
  await expect(card.getByRole('heading', { level: 3 })).toHaveText(['NOT', 'AND']);
  await expect(
    card.getByRole('table', { name: 'AND truth table' }).locator('tbody tr'),
  ).toHaveCount(4);
});

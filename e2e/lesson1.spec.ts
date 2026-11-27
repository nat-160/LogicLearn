/** Lesson 1 from start to finish (mouse and touch), which opens Lesson 2. */
import { expect, test } from '@playwright/test';
import { connect, press } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test('Lesson 1 can be completed, and then Lesson 2 opens', async ({ page }, testInfo) => {
  await page.goto('#/lesson/signals/1');
  await press(page.getByTestId('continue'), testInfo);
  await press(page.getByTestId('continue'), testInfo);

  // Step 3: rename the lights, then wire them.
  await expect(page.getByRole('heading', { level: 1, name: /Label and wire/ })).toBeVisible();
  for (const [id, label] of [
    ['light-1', 'Y'],
    ['light-2', 'Z'],
  ]) {
    await press(page.getByTestId(`part-${id}`), testInfo);
    const input = page.getByTestId('label-input');
    await input.fill(label);
    await input.press('Enter');
  }
  await connect(page, testInfo, ['A', 'out'], ['light-1', 'in']);
  await connect(page, testInfo, ['B', 'out'], ['light-2', 'in']);
  for (const row of [1, 2, 3]) await press(page.getByTestId(`tt-row-${row}`), testInfo);
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('check-result')).toContainText('Correct');
  await press(page.getByTestId('next-step'), testInfo);

  // Step 4 (challenge): one switch, two lights.
  await connect(page, testInfo, ['A', 'out'], ['Y', 'in']);
  await connect(page, testInfo, ['A', 'out'], ['Z', 'in']);
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('check-result')).toContainText('Correct');
  await press(page.getByTestId('next-step'), testInfo); // "Finish lesson"

  // A celebration, then on to Lesson 2.
  await expect(page).toHaveURL(/#\/lesson\/signals\/complete$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lesson 1 complete!');
  await expect(page.getByRole('img', { name: 'Badge: Lesson 1 complete' })).toBeVisible();
  await expect(page.getByTestId('celebration-next')).toHaveText('Next: Lesson 2 – NOT and AND');
  await press(page.getByRole('link', { name: 'Back to lessons' }), testInfo);
  await expect(page).toHaveURL(/#\/lessons$/);
  await expect(page.getByRole('link', { name: /Signals.*Done/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /NOT and AND/ })).toBeVisible();
});

/** Feedback on a check: the tried-rows nudge and misconception messages. */
import { expect, test } from '@playwright/test';
import { addPart, connect, press, PROGRESS_KEY, seedProgress } from './helpers';

test('OR built for XOR: "Check anyway" shows the misconception, which is remembered', async ({
  page,
}, testInfo) => {
  await seedProgress(page, [
    'not-and/challenge',
    'or-xor/meet-or',
    'or-xor/build-or',
    'or-xor/exclusive-or',
  ]);
  await page.goto('#/lesson/or-xor/4');
  await addPart(page, testInfo, 'OR'); // or-1
  await connect(page, testInfo, ['A', 'out'], ['or-1', 'in0']);
  await connect(page, testInfo, ['B', 'out'], ['or-1', 'in1']);
  await connect(page, testInfo, ['or-1', 'out'], ['Y', 'in']);

  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('tried-rows-nudge')).toContainText('You have tried 1 of 4 rows.');
  await expect(page.getByTestId('try-row')).toHaveText('Try row A = 0, B = 1');
  await press(page.getByTestId('check-anyway'), testInfo);

  const result = page.getByTestId('check-result');
  await expect(result).toContainText('1 of 4 rows are wrong');
  await expect(result.locator('[data-misconception="xor-as-or"]')).toContainText(
    'What should happen when both inputs are 1?',
  );
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), PROGRESS_KEY);
  expect(saved['or-xor/build-xor'].misconceptions).toEqual(['xor-as-or']);
});

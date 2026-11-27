/** Practice steps: offered after a recognized mistake, and lead back to the step. */
import { expect, test } from '@playwright/test';
import { addPart, connect, press, seedProgress } from './helpers';

test('building OR for XOR offers a practice, which leads back to the step', async ({
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
  for (const row of [1, 2, 3]) await press(page.getByTestId(`tt-row-${row}`), testInfo);
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('check-result')).toContainText('acts like OR');
  await expect(page.getByTestId('announcer')).toContainText('A short practice is offered below.');

  await press(page.getByTestId('practice-offer').getByRole('link'), testInfo);
  await expect(page).toHaveURL(/#\/lesson\/or-xor\/practice\/both-on$/);
  await expect(page.getByRole('heading', { level: 1, name: /OR or XOR/ })).toBeVisible();
  // X = A OR B, Y = A XOR B.
  for (const [row, [x, y]] of [
    [0, 0],
    [1, 1],
    [1, 1],
    [1, 0],
  ].entries()) {
    await page.getByTestId(`predict-practice-both-on-r${row}-o0-${x}`).check();
    await page.getByTestId(`predict-practice-both-on-r${row}-o1-${y}`).check();
  }
  await page.getByTestId('check-predictions').click();
  await expect(page.getByTestId('predict-message')).toContainText('All 4 rows right');

  await expect(page.getByTestId('next-step')).toHaveText('Back to step 4 →');
  await press(page.getByTestId('next-step'), testInfo);
  await expect(page).toHaveURL(/#\/lesson\/or-xor\/4$/);
  // The practice is not one of the lesson's steps: the step is still to do.
  await expect(page.getByRole('link', { name: /Step 4: .*\(done\)/ })).toHaveCount(0);
});

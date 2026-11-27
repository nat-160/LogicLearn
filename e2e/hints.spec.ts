/** The hint ladder and the gate reminder card. */
import { expect, test } from '@playwright/test';
import { addPart, connect, light, press, seedProgress } from './helpers';

test.beforeEach(async ({ page }) => {
  await seedProgress(page, ['not-and/what-is-a-gate']);
});

test('hints come one at a time, and they stay after a reload', async ({ page }, testInfo) => {
  await page.goto('#/lesson/not-and/2');
  const hintButton = page.getByTestId('hint-button');
  // Three written hints, then two worked out from the circuit.
  await expect(hintButton).toHaveText('Show a hint (1 of 5)');
  await press(hintButton, testInfo);
  await press(hintButton, testInfo);
  await expect(hintButton).toHaveText('Show a hint (3 of 5)');
  await expect(page.locator('.hint')).toHaveCount(2);

  await page.reload();
  await expect(page.locator('.hint')).toHaveCount(2);
  await expect(hintButton).toHaveText('Show a hint (3 of 5)');
});

test("the last hints look at the student's own circuit, without giving the answer", async ({
  page,
}, testInfo) => {
  await seedProgress(page, ['not-and/build-not', 'not-and/meet-and']);
  await page.goto('#/lesson/not-and/4');
  await addPart(page, testInfo, 'OR'); // or-1: the wrong gate for AND
  await connect(page, testInfo, ['A', 'out'], ['or-1', 'in0']);
  await connect(page, testInfo, ['B', 'out'], ['or-1', 'in1']);
  await connect(page, testInfo, ['or-1', 'out'], ['Y', 'in']);
  const hintButton = page.getByTestId('hint-button');
  for (let i = 0; i < 4; i++) await press(hintButton, testInfo);
  await expect(hintButton).toHaveCount(0); // all four shown: two written, two generated

  await expect(page.getByTestId('circuit-hint-3')).toContainText(
    'Look at your circuit: Look at OR gate 1: it drives Y, and Y is wrong in 2 of 4 rows.',
  );
  await press(page.getByTestId('circuit-hint-3').getByTestId('show-on-canvas'), testInfo);
  await expect(page.locator('.react-flow__node .is-highlighted')).toHaveCount(1);

  const row = page.getByTestId('circuit-hint-4');
  await expect(row).toContainText(
    'Try A = 0, B = 1. OR gate 1 gets 0 and 1 and gives 1. So Y is 1, but the task wants 0.',
  );
  await press(row.getByTestId('set-row'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: on/);
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

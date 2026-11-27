/** Prediction mode (Lesson 4): fill in the truth table before the circuit shows it. */
import { expect, test, type Page } from '@playwright/test';
import { light, press, seedProgress } from './helpers';

const lesson4 = ['count-the-rows', 'predict-two', 'find-the-row'];

async function openLesson4(page: Page, step: number, done: string[] = []) {
  await seedProgress(page, [
    'not-and/challenge',
    'or-xor/exactly-one',
    ...done.map((s) => `circuit-to-table/${s}`),
  ]);
  await page.goto(`#/lesson/circuit-to-table/${step}`);
}

/** Choose 0 or 1 for each row of a one-output table. */
async function predict(page: Page, id: string, bits: number[]) {
  for (const [row, bit] of bits.entries()) {
    await page.getByTestId(`predict-${id}-r${row}-o0-${bit}`).check();
  }
}

test('a guided prediction: blanks are pointed out, then the answers appear', async ({ page }) => {
  await openLesson4(page, 2, ['count-the-rows']);
  // The light is hidden until the prediction is checked.
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /hidden until you check/);
  await page.getByTestId('predict-predict-two-r0-o0-0').check();
  await page.getByTestId('check-predictions').click();
  await expect(page.getByTestId('predict-message')).toHaveText('3 rows still need a prediction.');
  await expect(page.getByTestId('predict-predict-two-r1-o0-0')).toBeFocused();

  // Y = (NOT A) AND B is 0, 1, 0, 0. Get one row wrong on purpose.
  await predict(page, 'predict-two', [0, 1, 1, 0]);
  await page.getByTestId('check-predictions').click();
  await expect(page.getByTestId('predict-message')).toHaveText(
    '3 of 4 rows right. The wrong rows are marked.',
  );
  await expect(page.getByTestId('predict-predict-two-row-2')).toContainText('✗ wrong');
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: (on|off)/);
  await expect(page.getByTestId('next-step')).toBeVisible(); // a guided step is done
});

test('a prediction challenge needs every row right; after a miss, a new circuit', async ({
  page,
}) => {
  await openLesson4(page, 4, lesson4);
  // Circuit 1: (A OR B) AND NOT C = 0,0,1,0,1,0,1,0. Miss the first row.
  await predict(page, 'challenge', [1, 0, 1, 0, 1, 0, 1, 0]);
  await page.getByTestId('check-predictions').click();
  await expect(page.getByTestId('predict-message')).toContainText('7 of 8 rows right');
  await expect(page.getByTestId('next-step')).toHaveCount(0);

  await page.getByTestId('try-another').click();
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /hidden until you check/);
  // Circuit 2: (A AND B) OR NOT C = 1,0,1,0,1,0,1,1.
  await predict(page, 'challenge', [1, 0, 1, 0, 1, 0, 1, 1]);
  await page.getByTestId('check-predictions').click();
  await expect(page.getByTestId('predict-message')).toHaveText('All 8 rows right!');
  await expect(page.getByTestId('next-step')).toHaveText('Finish lesson ✔');
});

test('a prediction in progress survives a reload', async ({ page }) => {
  await openLesson4(page, 2, ['count-the-rows']);
  await predict(page, 'predict-two', [0, 1]);
  await page.reload();
  await expect(page.getByTestId('predict-predict-two-r1-o0-1')).toBeChecked();
  await expect(page.getByTestId('predict-predict-two-count')).toHaveText('2 of 4 rows filled in');
});

test('predictions can be made with the keyboard', async ({ page, hasTouch }) => {
  test.skip(!!hasTouch, 'keyboard flow');
  await openLesson4(page, 2, ['count-the-rows']);
  const first = page.getByTestId('predict-predict-two-r0-o0-0');
  await first.focus();
  await page.keyboard.press('Space'); // choose 0
  await expect(first).toBeChecked();
  await page.keyboard.press('ArrowRight'); // move to 1 in the same cell
  await expect(page.getByTestId('predict-predict-two-r0-o0-1')).toBeChecked();
});

test('a prediction can be tapped (or clicked) in', async ({ page }, testInfo) => {
  await openLesson4(page, 2, ['count-the-rows']);
  // Tap the "1" choice in row 0 (the visible label, as a finger would).
  await press(
    page.getByTestId('predict-predict-two-row-0').locator('.predict-choice', { hasText: '1' }),
    testInfo,
  );
  await expect(page.getByTestId('predict-predict-two-r0-o0-1')).toBeChecked();
  await expect(page.getByTestId('predict-predict-two-count')).toHaveText(/1 of 4 rows filled in/);
});

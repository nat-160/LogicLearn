/**
 * Teacher tools: the teacher view (code, answer key, unlock codes, checking completion
 * codes), the student's progress report, and unit test-outs.
 *
 * The real teacher code isn't in the repository (only its hash), so these tests turn the
 * teacher view on directly – except the one that checks a wrong code is turned away.
 */
import { expect, test, type Page } from '@playwright/test';
import { press, seedProgress } from './helpers';

async function teacherView(page: Page) {
  await page.addInitScript(() => localStorage.setItem('logiclearn:teacher', '1'));
}

test('the teacher view turns away a wrong code', async ({ page }) => {
  await page.goto('#/teacher');
  await page.getByTestId('teacher-code').fill('TEACH-WRONG1');
  await page.getByRole('button', { name: 'Open teacher view' }).click();
  await expect(page.getByTestId('teacher-code-wrong')).toBeVisible();
  await expect(page.getByTestId('answer-key')).toHaveCount(0);
});

test("a lesson's unlock code, from the teacher view, opens it for a student", async ({
  page,
}, testInfo) => {
  await teacherView(page);
  await page.goto('#/teacher');
  const cell = page.getByTestId('unlock-code-for-nand-nor');
  await expect(cell).toHaveText(/^[0-9A-Z]{6}$/);
  const code = (await cell.textContent())!;

  await page.goto('#/lessons');
  await expect(page.getByRole('link', { name: /NAND and NOR/ })).toHaveCount(0); // locked
  const card = page.locator('.lesson-card', { hasText: 'NAND and NOR' });
  await press(card.getByText('Have a code from your teacher?'), testInfo);
  await card.getByTestId('unlock-code-nand-nor').fill('WRONG1');
  await press(card.getByRole('button', { name: 'Open Lesson 5' }), testInfo);
  await expect(card).toContainText("That code doesn't open this lesson.");
  await card.getByTestId('unlock-code-nand-nor').fill(code.toLowerCase());
  await press(card.getByRole('button', { name: 'Open Lesson 5' }), testInfo);
  await expect(page.getByRole('link', { name: /NAND and NOR/ })).toBeVisible();
});

test('the progress report has a completion code that the teacher view checks', async ({ page }) => {
  await seedProgress(page, ['not-and/challenge']);
  await page.goto('#/report');
  const table = page.getByTestId('report-table');
  await expect(table.getByRole('row', { name: /Lesson 2: NOT and AND/ })).toContainText('Done');
  await expect(table.getByRole('row', { name: /Lesson 3: OR and XOR/ })).toContainText(
    'Not started',
  );
  const code = page.getByTestId('completion-code');
  await expect(code).toHaveText(/^LL-[0-9A-Z]{6}-[0-9A-Z]{4}$/);
  const text = (await code.textContent())!;

  await page.evaluate(() => localStorage.setItem('logiclearn:teacher', '1'));
  await page.goto('#/teacher');
  await page.reload();
  await page.getByTestId('check-code-input').fill(text);
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  const result = page.getByTestId('check-code-result');
  await expect(result).toContainText('The code checks out');
  await expect(result).toContainText('Lesson 1: Signals');
  await expect(result).toContainText('Lesson 2: NOT and AND');

  // One changed character, and it no longer checks out.
  const changed = text.slice(0, 3) + (text[3] === '2' ? '3' : '2') + text.slice(4);
  await page.getByTestId('check-code-input').fill(changed);
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await expect(result).toContainText("doesn't check out");
});

test('the answer key gives each solution in words, with a link to open it', async ({ page }) => {
  await teacherView(page);
  await page.goto('#/teacher');
  await page.getByTestId('answer-key-lesson').selectOption('or-xor');
  const step = page.getByTestId('answer-key').locator('details', { hasText: 'Build it: XOR' });
  await step.locator('summary').click();
  await expect(step).toContainText('XOR gate');
  await expect(step.getByRole('link', { name: /Open this circuit in the sandbox/ })).toBeVisible();
});

test('passing the Unit 1 test-out opens Unit 2 and the Unit 1 project', async ({ page }) => {
  await seedProgress(page, [
    'test-out-1/and-not',
    'test-out-1/exactly-one',
    'test-out-1/predict-table',
  ]);
  await page.goto('#/lessons');
  await expect(page.locator('.lesson-card', { hasText: 'OR and XOR' })).toContainText('Tested out');
  // The optional editor tour isn't part of the test-out.
  await expect(page.locator('.lesson-card', { hasText: 'Editor tour' })).not.toContainText(
    'Tested out',
  );
  await expect(page.getByRole('link', { name: /NAND and NOR/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Unit 1 project/ })).toBeVisible();
});

test('a test-out has no hints', async ({ page }) => {
  await page.goto('#/lesson/test-out-1/1');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByTestId('hint-button')).toHaveCount(0);
});

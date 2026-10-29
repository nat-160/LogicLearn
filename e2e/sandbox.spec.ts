import { expect, test } from '@playwright/test';
import { addPart, connect, light, press, switchButton } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('#/sandbox');
  await expect(page.getByTestId('canvas')).toBeVisible();
});

test('the example AND circuit responds to its switches', async ({ page }, testInfo) => {
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
  await press(switchButton(page, 'A'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
  await press(switchButton(page, 'B'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
});

test('build a half adder from scratch', async ({ page }, testInfo) => {
  await press(page.getByRole('button', { name: /New/ }), testInfo);
  await expect(page.locator('.react-flow__node')).toHaveCount(0);

  await addPart(page, testInfo, 'SWITCH'); // switch-1, label A
  await addPart(page, testInfo, 'SWITCH'); // switch-2, label B
  await addPart(page, testInfo, 'XOR'); // xor-1
  await addPart(page, testInfo, 'AND'); // and-1
  await addPart(page, testInfo, 'LIGHT'); // light-1, label Y
  await addPart(page, testInfo, 'LIGHT'); // light-2, label Z

  await connect(page, testInfo, ['switch-1', 'out'], ['xor-1', 'in0']);
  await connect(page, testInfo, ['switch-2', 'out'], ['xor-1', 'in1']);
  await connect(page, testInfo, ['switch-1', 'out'], ['and-1', 'in0']);
  await connect(page, testInfo, ['switch-2', 'out'], ['and-1', 'in1']);
  await connect(page, testInfo, ['xor-1', 'out'], ['light-1', 'in']);
  await connect(page, testInfo, ['and-1', 'out'], ['light-2', 'in']);
  await expect(page.locator('.react-flow__edge')).toHaveCount(6);

  // Y = sum (XOR), Z = carry (AND)
  await press(switchButton(page, 'A'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
  await expect(light(page, 'Z')).toHaveAttribute('aria-label', /off/);
  await press(switchButton(page, 'B'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
  await expect(light(page, 'Z')).toHaveAttribute('aria-label', /on/);

  // The truth table agrees, row by row.
  const rows = page.getByTestId('truth-table').locator('tbody tr');
  await expect(rows).toHaveCount(4);
  // Columns: tried, A, B, Y, Z
  await expect(rows.nth(0).locator('td')).toHaveText(['✓', '0', '0', '0', '0']);
  await expect(rows.nth(2).locator('td')).toHaveText(['✓', '1', '0', '1', '0']);
  // Row 3 is the current row, so its first cell also says so (for screen readers).
  await expect(rows.nth(3).locator('td')).toHaveText(['✓current row', '1', '1', '0', '1']);
});

test('checking OR against the XOR target marks only the 1,1 row', async ({ page }, testInfo) => {
  // Turn the example's AND into OR: delete the AND gate, add an OR, rewire.
  await press(page.getByTestId('part-and-1'), testInfo);
  await press(page.getByTestId('delete-selected'), testInfo);
  await addPart(page, testInfo, 'OR');
  await connect(page, testInfo, ['A', 'out'], ['or-1', 'in0']);
  await connect(page, testInfo, ['B', 'out'], ['or-1', 'in1']);
  await connect(page, testInfo, ['or-1', 'out'], ['Y', 'in']);

  await page.getByTestId('target-select').selectOption('xor');
  await press(page.getByTestId('check-button'), testInfo);
  const result = page.getByTestId('check-result');
  await expect(result).toContainText('1 of 4 rows are wrong');
  await expect(result).toContainText('What should happen when both inputs are 1?');
  await expect(page.locator('tr.is-wrong')).toHaveCount(1);
  await expect(page.getByTestId('tt-row-3')).toHaveClass(/is-wrong/);
});

test('undo and redo', async ({ page }, testInfo) => {
  await addPart(page, testInfo, 'NOT');
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
  await press(page.getByRole('button', { name: /Undo/ }), testInfo);
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await press(page.getByRole('button', { name: /Redo/ }), testInfo);
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
});

test('tapping a truth-table row sets the switches', async ({ page }, testInfo) => {
  await press(page.getByTestId('tt-row-3'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
  await expect(page.getByTestId('tried-count')).toHaveText('tried 2 of 4');
});

test('a circuit that never settles is reported', async ({ page }, testInfo) => {
  // NAND with its output fed back into itself: flips forever once A is on.
  await addPart(page, testInfo, 'NAND'); // nand-1
  await connect(page, testInfo, ['A', 'out'], ['nand-1', 'in0']);
  await connect(page, testInfo, ['nand-1', 'out'], ['nand-1', 'in1']);
  await expect(page.getByRole('alert')).toHaveCount(0);
  await press(switchButton(page, 'A'), testInfo);
  await expect(page.getByRole('alert')).toContainText('never settles');
});

test('a share link opens a copy without touching the sandbox', async ({ page }, testInfo) => {
  await press(page.getByTestId('share-button'), testInfo);
  const link = await page.getByTestId('share-link').inputValue();
  expect(link).toContain('#/share/');

  await page.goto(link);
  await expect(page.getByText("You're looking at a shared circuit")).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
  await addPart(page, testInfo, 'NOT'); // edit the copy...

  await page.goto('#/sandbox'); // ...the sandbox still has its 4 parts
  await expect(page.locator('.react-flow__node')).toHaveCount(4);
});

test('the sandbox is saved across reloads', async ({ page }, testInfo) => {
  await addPart(page, testInfo, 'XOR');
  await page.waitForTimeout(500); // autosave runs shortly after a change
  await page.reload();
  await expect(page.locator('.react-flow__node')).toHaveCount(5);
});

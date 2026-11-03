/** Unit 2 smoke tests: an "only NAND" step, a target table, the number display project. */
import { expect, test } from '@playwright/test';
import { addPart, connect, light, press, seedProgress } from './helpers';

/** Unit 1 finished, so Unit 2 is open. */
const UNIT_1 = ['not-and/challenge', 'or-xor/exactly-one', 'circuit-to-table/challenge'];

test('an "only NAND" step offers only NAND, and NOT from NAND passes', async ({
  page,
}, testInfo) => {
  await seedProgress(page, [...UNIT_1, 'nand-nor/not-both', 'nand-nor/build-not-both']);
  await page.goto('#/lesson/nand-nor/3');
  await expect(page.locator('[data-testid^="palette-"]')).toHaveCount(1);
  await expect(page.getByTestId('palette-NAND')).toBeVisible();

  await addPart(page, testInfo, 'NAND'); // nand-1
  await connect(page, testInfo, ['A', 'out'], ['nand-1', 'in0']);
  await connect(page, testInfo, ['A', 'out'], ['nand-1', 'in1']);
  await connect(page, testInfo, ['nand-1', 'out'], ['Y', 'in']);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
  await press(page.getByTestId('tt-row-1'), testInfo);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.getByTestId('check-result')).toContainText('Correct');
});

test('a "build this table" challenge shows the target while the values stay hidden', async ({
  page,
}) => {
  await seedProgress(page, [
    ...UNIT_1,
    'table-to-circuit/one-row-at-a-time',
    'table-to-circuit/by-itself',
    'table-to-circuit/two-rows',
    'xnor-if-then/three-rules',
    'nand-nor/neither',
  ]);
  await page.goto('#/lesson/table-to-circuit/4');
  const target = page.getByTestId('target-table');
  await expect(target.locator('tbody tr')).toHaveCount(8);
  // Row A, B, C = 0, 0, 1 is wanted on.
  await expect(target.locator('tbody tr').nth(1)).toHaveText('0011');
  await expect(page.getByTestId('truth-table')).toHaveCount(0);
});

test('the number display project: one brief, a fixed rule, and a checklist', async ({ page }) => {
  await seedProgress(page, [
    ...UNIT_1,
    'nand-nor/neither',
    'xnor-if-then/three-rules',
    'table-to-circuit/any-table',
    'adders/two-bit-adder',
    'unit-2-project/brief',
  ]);
  await page.goto('#/lesson/unit-2-project/2');
  await expect(page.getByRole('heading', { level: 2, name: 'The rule' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Choose your project' })).toHaveCount(0);
  await page.getByTestId('check-project').click();
  // Nothing is connected yet: one checklist item, and the checker's message below it.
  await expect(page.getByTestId('project-result').locator('li')).toHaveText([
    '✗ Not yet: Your circuit isn’t finished yet – see the messages below.',
    /Is everything connected\?/,
  ]);
});

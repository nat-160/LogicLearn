/**
 * Regression tests for defects found by an independent review of the UI.
 */
import { expect, test } from '@playwright/test';
import { addPart, light, press, switchButton } from './helpers';

const nodes = (page: import('@playwright/test').Page) => page.locator('.react-flow__node');

test.describe('keyboard (mouse project only)', () => {
  test.skip(({ hasTouch }) => !!hasTouch, 'keyboard shortcuts are for keyboards');

  test('Ctrl+Z undoes a delete even though focus left the canvas', async ({ page }) => {
    await page.goto('#/sandbox');
    await page.getByTestId('part-and-1').click();
    await page.keyboard.press('Delete');
    await expect(nodes(page)).toHaveCount(3);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(nodes(page)).toHaveCount(4);
  });

  test('Enter then Backspace in the label field edits text, not the circuit', async ({ page }) => {
    await page.goto('#/sandbox');
    await page.getByTestId('part-Y').click();
    const label = page.getByTestId('label-input');
    await label.fill('Q');
    await label.press('Enter');
    await page.keyboard.press('Backspace');
    await expect(nodes(page)).toHaveCount(4);
    await expect(label).toBeFocused();
  });

  test('a click with a tiny mouse movement still flips a switch', async ({ page }) => {
    await page.goto('#/sandbox');
    const box = (await switchButton(page, 'A').boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 22, box.y + 21);
    await page.mouse.up();
    await expect(switchButton(page, 'A')).toHaveAttribute('aria-pressed', 'true');
  });
});

test('changing the target clears the marked rows', async ({ page }, testInfo) => {
  await page.goto('#/sandbox');
  await page.getByTestId('target-select').selectOption('xor');
  await press(page.getByTestId('check-button'), testInfo);
  await expect(page.locator('tr.is-wrong')).toHaveCount(3);
  await page.getByTestId('target-select').selectOption('');
  await expect(page.locator('tr.is-wrong')).toHaveCount(0);
});

test('wrong rows are marked correctly when the circuit has an extra input', async ({
  page,
}, testInfo) => {
  await page.goto('#/sandbox');
  await addPart(page, testInfo, 'SWITCH'); // label C, not used by the target
  await page.getByTestId('target-select').selectOption('xor');
  await press(page.getByTestId('check-button'), testInfo);
  // AND vs XOR is wrong at A,B = 01, 10, 11, with C held at 0 → rows 010, 100, 110.
  for (const row of [2, 4, 6])
    await expect(page.getByTestId(`tt-row-${row}`)).toHaveClass(/is-wrong/);
  await expect(page.locator('tr.is-wrong')).toHaveCount(3);
});

test('an idle sandbox tab does not overwrite work saved in another tab', async ({
  context,
}, testInfo) => {
  const tab1 = await context.newPage();
  await tab1.goto('#/sandbox');
  await expect(nodes(tab1)).toHaveCount(4);

  const tab2 = await context.newPage();
  await tab2.goto('#/sandbox');
  await addPart(tab2, testInfo, 'XOR');
  await tab2.waitForTimeout(500); // autosave

  await tab1.goto('#/lessons'); // leaving the idle tab must not save its old circuit
  await tab1.goto('#/sandbox');
  await expect(nodes(tab1)).toHaveCount(5);
});

test('lesson progress from another tab is kept', async ({ context }, testInfo) => {
  const tab1 = await context.newPage();
  await tab1.goto('#/lessons');

  const tab2 = await context.newPage();
  await tab2.goto('#/lesson/not-and/1');
  await press(tab2.getByTestId('continue'), testInfo); // step 1 done in tab 2

  await tab1.goto('#/lesson/not-and/1'); // tab 1 visits the lesson afterwards
  await expect(tab1.getByRole('link', { name: /Step 1: .*\(done\)/ })).toBeVisible();
  await tab1.reload();
  await expect(tab1.getByRole('link', { name: /Step 1: .*\(done\)/ })).toBeVisible();
});

test('a light in a predict-first step cannot be read through the truth table', async ({ page }) => {
  // Covered by the challenge test; here: Start over hides values again.
  await page.addInitScript(() => {
    const done = {
      done: true,
      attempts: 1,
      hintsUsed: 0,
      triedRows: [],
      firstSeen: '',
      lastSeen: '',
    };
    const steps = ['what-is-a-gate', 'build-not', 'meet-and', 'build-and'];
    localStorage.setItem(
      'logiclearn:progress:v1',
      JSON.stringify(Object.fromEntries(steps.map((s) => [`not-and/${s}`, done]))),
    );
  });
  await page.goto('#/lesson/not-and/5');
  await page.getByTestId('check-button').click();
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: (on|off|unknown)/);
  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /hidden until you check/);
  await expect(page.getByTestId('truth-table')).toHaveCount(0);
});

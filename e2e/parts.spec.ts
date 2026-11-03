/**
 * The push button (1 only while held) and the seven-segment display, in the sandbox.
 * Each test starts from an empty sandbox with a push button P wired to a light.
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { addPart, connect, light, press } from './helpers';

const button = (page: Page) => page.getByRole('button', { name: /^Push button A: (up|held down)/ });

async function buttonAndLight(page: Page, testInfo: TestInfo) {
  await page.goto('#/sandbox');
  await press(page.getByRole('button', { name: /New/ }), testInfo);
  await addPart(page, testInfo, 'PUSH_BUTTON'); // push_button-1, labelled A
  await addPart(page, testInfo, 'LIGHT'); // light-1, labelled Y
  await connect(page, testInfo, ['push_button-1', 'out'], ['light-1', 'in']);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
}

test('a push button is 1 only while held down (mouse or touch)', async ({ page }, testInfo) => {
  await buttonAndLight(page, testInfo);
  const box = (await button(page).boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (testInfo.project.use.hasTouch) {
    // Playwright's touchscreen can only tap, so hold with touch-type pointer events.
    const target = button(page);
    await target.dispatchEvent('pointerdown', { button: 0, pointerType: 'touch', pointerId: 7 });
    await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
    await target.dispatchEvent('pointerup', { button: 0, pointerType: 'touch', pointerId: 7 });
  } else {
    await page.mouse.move(x, y);
    await page.mouse.down();
    await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
    await expect(button(page)).toHaveAccessibleName(/held down 1/);
    await page.mouse.up();
  }
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
});

test('a push button is held with Space and let go when the key comes up', async ({
  page,
}, testInfo) => {
  test.skip(!!testInfo.project.use.hasTouch, 'keyboard');
  await buttonAndLight(page, testInfo);
  await button(page).focus();
  await page.keyboard.down('Space');
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
  await page.keyboard.up('Space');
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
  // Holding Space must not pan the canvas or leave the button down.
  await expect(button(page)).toHaveAccessibleName(/up 0/);
});

test('a screen reader click latches the button down, and the next one lets go', async ({
  page,
}, testInfo) => {
  await buttonAndLight(page, testInfo);
  await button(page).dispatchEvent('click', { detail: 0 });
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /on/);
  await expect(page.getByTestId('announcer')).toHaveText(/held down\. Activate it again to let go/);
  await button(page).dispatchEvent('click', { detail: 0 });
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /off/);
});

test('a seven-segment display says which digit it shows', async ({ page }, testInfo) => {
  await page.goto('#/sandbox');
  await press(page.getByRole('button', { name: /New/ }), testInfo);
  await addPart(page, testInfo, 'SWITCH'); // switch-1, A
  await addPart(page, testInfo, 'SEVEN_SEG'); // seven_seg-1
  for (const segment of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
    await connect(page, testInfo, ['switch-1', 'out'], ['seven_seg-1', segment]);
  }
  const display = page.getByRole('img', { name: /^Seven-segment display / });
  await expect(display).toHaveAttribute('aria-label', /blank$/);
  await press(page.getByRole('button', { name: /^Switch A: / }), testInfo);
  await expect(display).toHaveAttribute('aria-label', /shows 8$/);
  await expect(page.getByTestId('announcer')).toContainText('now shows 8');
});

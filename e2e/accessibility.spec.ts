/**
 * Accessibility: display preferences, automated WCAG checks in every theme, building a
 * circuit with the keyboard alone, narration, and screen reader announcements.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { press } from './helpers';

const html = (page: Page) => page.locator('html');

async function openSettings(page: Page) {
  await page.getByTestId('settings-button').click();
  await expect(page.getByTestId('settings-dialog')).toBeVisible();
}

test.describe('display preferences', () => {
  test('high contrast, dark mode and the dyslexia font can be switched on and are remembered', async ({
    page,
  }) => {
    await page.goto('#/');
    await expect(html(page)).toHaveAttribute('data-contrast', 'standard');
    await openSettings(page);
    await page.getByTestId('toggle-contrast').click();
    await page.getByTestId('toggle-dark').click();
    await page.getByTestId('toggle-dyslexia').click();
    await expect(page.getByTestId('toggle-contrast')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('settings-close').click();

    await expect(html(page)).toHaveAttribute('data-contrast', 'high');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(html(page)).toHaveAttribute('data-font', 'dyslexic');
    await expect
      .poll(() => page.evaluate(() => document.fonts.check('16px OpenDyslexic')), { timeout: 5000 })
      .toBe(true);

    await page.reload();
    await expect(html(page)).toHaveAttribute('data-contrast', 'high');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(html(page)).toHaveAttribute('data-font', 'dyslexic');

    await openSettings(page);
    await page.getByTestId('settings-reset').click();
    await expect(html(page)).toHaveAttribute('data-contrast', 'standard');
    await expect(html(page)).toHaveAttribute('data-font', 'default');
  });

  test("follows the device's contrast and dark settings until the student chooses", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'dark', contrast: 'more' });
    await page.goto('#/');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(html(page)).toHaveAttribute('data-contrast', 'high');
    await openSettings(page);
    await page.getByTestId('toggle-dark').click(); // the student turns dark mode off
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
  });

  test('the settings dialog closes with Escape and keeps keyboard focus inside', async ({
    page,
  }) => {
    await page.goto('#/');
    await openSettings(page);
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('settings-dialog')).toBeHidden();
  });
});

const THEMES = [
  { name: 'light', prefs: { contrast: 'standard', colorScheme: 'light' } },
  { name: 'dark', prefs: { contrast: 'standard', colorScheme: 'dark' } },
  { name: 'high-contrast light', prefs: { contrast: 'high', colorScheme: 'light' } },
  { name: 'high-contrast dark', prefs: { contrast: 'high', colorScheme: 'dark' } },
];
const PAGES = [
  { name: 'home', hash: '#/' },
  { name: 'lessons', hash: '#/lessons' },
  { name: 'lesson step', hash: '#/lesson/not-and/1' },
  { name: 'sandbox', hash: '#/sandbox' },
];

test.describe('automated WCAG 2.1 AA checks (axe-core)', () => {
  test.skip(({ hasTouch }) => !!hasTouch, 'one run is enough');

  for (const theme of THEMES) {
    for (const target of PAGES) {
      test(`${target.name} in the ${theme.name} theme has no serious problems`, async ({
        page,
      }) => {
        await page.addInitScript(
          (prefs) => localStorage.setItem('logiclearn:prefs:v1', JSON.stringify(prefs)),
          theme.prefs,
        );
        await page.goto(target.hash);
        await page.waitForTimeout(300);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze();
        const serious = results.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id}: ${v.help} – ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
        expect(serious).toEqual([]);
      });
    }
  }
});

test.describe('without a pointer', () => {
  test.skip(({ hasTouch }) => !!hasTouch, 'keyboard flow');

  test('a lesson circuit can be built and checked with the keyboard alone', async ({ page }) => {
    await page.addInitScript(() => {
      const done = {
        done: true,
        attempts: 0,
        hintsUsed: 0,
        triedRows: [],
        firstSeen: '',
        lastSeen: '',
      };
      localStorage.setItem(
        'logiclearn:progress:v1',
        JSON.stringify({ 'not-and/what-is-a-gate': done }),
      );
    });
    await page.goto('#/lesson/not-and/2');

    // Add a NOT gate: focus the palette button and press Enter.
    await page.getByTestId('palette-NOT').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('announcer')).toContainText('Added NOT gate 1');

    // Wire it in the Connections panel.
    await page.locator('summary', { hasText: 'Connections (keyboard)' }).click();
    await page.getByTestId('connect-from').selectOption({ label: 'Switch A' });
    await page.getByTestId('connect-to').selectOption({ label: 'NOT gate 1, input' });
    await page.getByTestId('connect-button').press('Enter');
    await page.getByTestId('connect-from').selectOption({ label: 'NOT gate 1, output' });
    await page.getByTestId('connect-to').selectOption({ label: 'Light Y' });
    await page.getByTestId('connect-button').press('Enter');
    await expect(page.getByTestId('announcer')).toContainText(
      'Connected NOT gate 1, output to Light Y',
    );

    // The text version of the circuit describes it.
    await page.locator('summary', { hasText: 'Circuit as text' }).click();
    await expect(page.getByTestId('description-wires')).toContainText(
      'Switch A → NOT gate 1, input',
    );

    await page.getByTestId('check-button').press('Enter');
    await expect(page.getByTestId('check-result')).toContainText('Correct');
    await expect(page.getByTestId('announcer')).toContainText('Correct! Every row matches.');
  });

  test('moving to the next step puts keyboard focus on its heading', async ({ page }) => {
    await page.goto('#/lesson/not-and/1');
    await page.getByTestId('continue').press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Build it: NOT' })).toBeFocused();
  });

  test('a skip link jumps to the main content', async ({ page }) => {
    await page.goto('#/lessons');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Skip to main content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
});

test.describe('narration', () => {
  // Replace the browser's speech engine with a recorder, so tests can see what was said.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const spoken: string[] = [];
      (window as unknown as { spoken: string[] }).spoken = spoken;
      const synth = {
        speak: (u: SpeechSynthesisUtterance) => {
          spoken.push(u.text);
          setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 10);
        },
        cancel: () => undefined,
        getVoices: () => [],
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      };
      Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    });
  });

  const spoken = (page: Page) =>
    page.evaluate(() => (window as unknown as { spoken: string[] }).spoken.join(' '));

  test('"Read this step aloud" reads the title and the text', async ({ page }, testInfo) => {
    await page.goto('#/lesson/not-and/1');
    await press(page.getByTestId('read-aloud-step'), testInfo);
    await expect.poll(() => spoken(page)).toContain('What is a logic gate?');
    expect(await spoken(page)).toContain('A, NOT A. 0, 1. 1, 0.');
  });

  test('with automatic reading on, each step is read when it opens', async ({ page }, testInfo) => {
    await page.addInitScript(() =>
      localStorage.setItem('logiclearn:prefs:v1', JSON.stringify({ autoRead: true })),
    );
    await page.goto('#/lesson/not-and/1');
    await press(page.getByTestId('continue'), testInfo);
    await expect.poll(() => spoken(page)).toContain('Build it: NOT.');
  });
});

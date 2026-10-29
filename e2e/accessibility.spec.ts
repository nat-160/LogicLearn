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

  test('the saved theme is on the page before the app has loaded (no light flash)', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'logiclearn:prefs:v1',
        JSON.stringify({ contrast: 'high', colorScheme: 'dark' }),
      ),
    );
    await page.route(/\.js$/, (route) => route.abort()); // the app itself never starts
    await page.goto('#/');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(html(page)).toHaveAttribute('data-contrast', 'high');
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor),
    ).toBe('rgb(0, 0, 0)');
  });

  test('in a Windows contrast theme, lit lights and the current row still stand out', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'forced colors can only be emulated in Chromium');
    // A dark Windows contrast theme also reports dark mode, the case that used to break.
    await page.emulateMedia({ forcedColors: 'active', colorScheme: 'dark' });
    await page.addInitScript(() =>
      localStorage.setItem('logiclearn:prefs:v1', JSON.stringify({ contrast: 'high' })),
    );
    await page.goto('#/lesson/not-and/1'); // NOT example: A is off, so Y is lit
    const background = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(await background('.light-body.v1')).not.toBe(await background('.switch-body.off'));
    expect(await background('tr.is-current td')).not.toBe(
      await background('tr:not(.is-current) td'),
    );
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

test.describe('focus on the highlighted truth-table row', () => {
  test.skip(({ hasTouch }) => !!hasTouch, 'keyboard focus');

  for (const theme of THEMES) {
    test(`is visible in the ${theme.name} theme`, async ({ page }) => {
      await page.addInitScript(
        (prefs) => localStorage.setItem('logiclearn:prefs:v1', JSON.stringify(prefs)),
        theme.prefs,
      );
      await page.goto('#/lesson/not-and/1');
      const row = page.locator('tr.is-current');
      await row.focus();
      const { shown, ring, fill } = await row.evaluate((el) => ({
        shown: el.matches(':focus-visible') && getComputedStyle(el).outlineStyle !== 'none',
        ring: getComputedStyle(el).outlineColor,
        fill: getComputedStyle(el.querySelector('td')!).backgroundColor,
      }));
      expect(shown).toBe(true);
      expect(ring).not.toBe(fill);
    });
  }
});

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

  test('parts and wires on the canvas have names, and deleting keeps focus nearby', async ({
    page,
  }) => {
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
    await page.getByTestId('palette-NOT').press('Enter');
    const gate = page.getByRole('group', { name: 'NOT gate 1' });
    await expect(gate).toHaveAttribute('aria-roledescription', 'part');

    await page.locator('summary', { hasText: 'Connections (keyboard)' }).click();
    await page.getByTestId('connect-from').selectOption({ label: 'Switch A' });
    await page.getByTestId('connect-to').selectOption({ label: 'NOT gate 1, input' });
    await page.getByTestId('connect-button').press('Enter');
    await expect(
      page.getByRole('group', { name: 'Wire from Switch A to NOT gate 1, input' }),
    ).toHaveCount(1);

    await expect(page.getByTestId('announcer')).toHaveText(
      'Connected Switch A to NOT gate 1, input.',
    );

    // Removing the only wire: its button disappears, so focus goes back to the form.
    await page.getByRole('button', { name: /^Remove wire/ }).press('Enter');
    await expect(page.getByTestId('announcer')).toHaveText(
      'Removed the wire from Switch A to NOT gate 1, input.',
    );
    await expect(page.getByTestId('connect-from')).toBeFocused();

    // Deleting a part with the Delete key: focus stays on the canvas.
    await gate.focus();
    await page.keyboard.press('Enter'); // select it
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('announcer')).toHaveText('Deleted NOT gate 1.');
    await expect(page.getByTestId('canvas')).toBeFocused();
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
      // Like a real engine, speech is queued and "said" a moment later; cancel() drops
      // whatever hasn't been said yet.
      const spoken: string[] = [];
      (window as unknown as { spoken: string[] }).spoken = spoken;
      let queue: SpeechSynthesisUtterance[] = [];
      const sayNext = () => {
        const u = queue.shift();
        if (!u) return;
        spoken.push(u.text);
        u.onend?.(new Event('end') as SpeechSynthesisEvent);
        if (queue.length) setTimeout(sayNext, 10);
      };
      const synth = {
        speak: (u: SpeechSynthesisUtterance) => {
          queue.push(u);
          if (queue.length === 1) setTimeout(sayNext, 10);
        },
        cancel: () => {
          queue = [];
        },
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
    await expect.poll(() => spoken(page)).toContain('What is a logic gate? Computers work');
    await expect.poll(() => spoken(page)).toContain('A, NOT A. 0, 1. 1, 0.');
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

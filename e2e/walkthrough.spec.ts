/** Walkthroughs: a step-by-step explanation, offered after a failed check, paced by the student. */
import { expect, test } from '@playwright/test';
import { addPart, connect, light, press, seedProgress } from './helpers';

test('a failed check offers the walkthrough, which steps through the rows', async ({
  page,
}, testInfo) => {
  await seedProgress(page, [
    'not-and/challenge',
    'or-xor/meet-or',
    'or-xor/build-or',
    'or-xor/exclusive-or',
  ]);
  await page.goto('#/lesson/or-xor/4');
  await addPart(page, testInfo, 'OR'); // or-1, the wrong gate for XOR
  await connect(page, testInfo, ['A', 'out'], ['or-1', 'in0']);
  await connect(page, testInfo, ['B', 'out'], ['or-1', 'in1']);
  await connect(page, testInfo, ['or-1', 'out'], ['Y', 'in']);
  for (const row of [1, 2, 3]) await press(page.getByTestId(`tt-row-${row}`), testInfo);
  await press(page.getByTestId('check-button'), testInfo);
  await press(page.getByTestId('walkthrough-offer').getByRole('link'), testInfo);

  await expect(page).toHaveURL(/#\/lesson\/or-xor\/walkthrough$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('OR or XOR?');
  await expect(page.getByTestId('frame-count')).toHaveText('Frame 1 of 5');
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: off/);
  await press(page.getByTestId('frame-next'), testInfo); // only B on: XOR gives 1
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: on/);

  // On to "both on": XOR gives 0 (where OR would give 1).
  for (let i = 0; i < 2; i++) await press(page.getByTestId('frame-next'), testInfo);
  await expect(page.getByTestId('frame-count')).toHaveText('Frame 4 of 5');
  await expect(page.getByTestId('frame-caption')).toContainText('Both on.');
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: off/);
  await expect(page.getByTestId('announcer')).toContainText('Frame 4 of 5. Both on.');

  await press(page.getByRole('button', { name: '← Back' }), testInfo);
  await expect(page.getByTestId('frame-count')).toHaveText('Frame 3 of 5');

  for (let i = 0; i < 2; i++) await press(page.getByTestId('frame-next'), testInfo);
  await expect(page.getByTestId('walkthrough-done')).toHaveText('Back to step 4 →');
  // The last frame: Next stays in place (marked unavailable), so keyboard focus isn't lost.
  await expect(page.getByTestId('frame-next')).toHaveAttribute('aria-disabled', 'true');
  if (!testInfo.project.use.hasTouch) await expect(page.getByTestId('frame-next')).toBeFocused();
  await press(page.getByTestId('walkthrough-done'), testInfo);
  await expect(page).toHaveURL(/#\/lesson\/or-xor\/4$/);
});

test('explain steps offer the walkthrough too', async ({ page }) => {
  await seedProgress(page, ['not-and/challenge']);
  await page.goto('#/lesson/or-xor/1');
  await expect(page.getByTestId('walkthrough-offer')).toContainText('Watch how it works');
});

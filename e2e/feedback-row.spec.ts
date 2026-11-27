/** A failed check shows one wrong row in words, and can set the switches to it. */
import { expect, test } from '@playwright/test';
import { addPart, connect, light, press, seedProgress, switchButton } from './helpers';

test('OR built for AND: the example row, and "Set the switches to this row"', async ({
  page,
}, testInfo) => {
  await seedProgress(page, ['not-and/what-is-a-gate', 'not-and/build-not', 'not-and/meet-and']);
  await page.goto('#/lesson/not-and/4');
  await addPart(page, testInfo, 'OR'); // or-1
  await connect(page, testInfo, ['A', 'out'], ['or-1', 'in0']);
  await connect(page, testInfo, ['B', 'out'], ['or-1', 'in1']);
  await connect(page, testInfo, ['or-1', 'out'], ['Y', 'in']);
  for (const row of [1, 2, 3]) await press(page.getByTestId(`tt-row-${row}`), testInfo);
  await press(page.getByTestId('check-button'), testInfo);

  await expect(page.getByTestId('check-example')).toContainText(
    'For example, with A = 0, B = 1, your circuit gives Y = 1, but the task wants Y = 0.',
  );
  await press(page.getByTestId('tt-row-0'), testInfo); // move the switches away first
  await press(page.getByTestId('set-row'), testInfo);
  await expect(switchButton(page, 'B')).toHaveAccessibleName(/^Switch B: on/);
  await expect(light(page, 'Y')).toHaveAttribute('aria-label', /Light Y: on/);
  await expect(page.getByTestId('announcer')).toContainText('Switches set: A = 0, B = 1.');
});

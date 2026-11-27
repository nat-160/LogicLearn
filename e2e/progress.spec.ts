/**
 * Saving progress to a file and loading it back (for shared Chromebooks and Safari, which
 * can erase what a browser stores).
 */
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { addPart, press } from './helpers';

test('progress and saved circuits survive being erased, via a progress file', async ({
  page,
}, testInfo) => {
  // Finish step 1, and start building on step 2.
  await page.goto('#/lesson/not-and/1');
  await press(page.getByTestId('continue'), testInfo);
  await addPart(page, testInfo, 'NOT');
  await page.waitForTimeout(500); // autosave

  // Save the progress file.
  await page.goto('#/lessons');
  const downloading = page.waitForEvent('download');
  await press(page.getByTestId('save-progress'), testInfo);
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^logiclearn-progress-\d{4}-\d\d-\d\d\.json$/);
  const file = readFileSync((await download.path())!, 'utf8');

  // The browser forgets everything.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('link', { name: /NOT and AND/ })).toHaveCount(0); // locked again

  // Load the file.
  await page.getByTestId('progress-file-input').setInputFiles({
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(file),
  });
  await expect(page.getByTestId('progress-message')).toHaveText(
    /Progress loaded: \d+ steps? added.*1 saved circuit restored/,
  );
  await expect(page.getByRole('link', { name: /NOT and AND.*1 of 5 steps/ })).toBeVisible();

  // The circuit on step 2 is back.
  await page.goto('#/lesson/not-and/2');
  await expect(page.locator('.react-flow__node[data-id="not-1"]')).toBeVisible();
});

test('a file that is not a progress file is refused with a message', async ({ page }) => {
  await page.goto('#/lessons');
  await page.getByTestId('progress-file-input').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"hello": "world"}'),
  });
  await expect(page.getByTestId('progress-message')).toHaveText(
    /Couldn't load that file: That file isn't a LogicLearn progress file\./,
  );
});

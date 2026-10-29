import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

/** Click with a mouse, or tap on the touch-only project. Every action has a tap version. */
export async function press(target: Locator, testInfo: TestInfo): Promise<void> {
  if (testInfo.project.use.hasTouch) await target.tap();
  else await target.click();
}

/** Connect two pins the touch-friendly way: tap (or click) one, then the other. */
export async function connect(
  page: Page,
  testInfo: TestInfo,
  from: [string, string],
  to: [string, string],
): Promise<void> {
  await press(page.getByTestId(`pin-${from[0]}-${from[1]}`), testInfo);
  await press(page.getByTestId(`pin-${to[0]}-${to[1]}`), testInfo);
}

/** Add a part by tapping it in the palette. Returns nothing; ids are predictable. */
export async function addPart(page: Page, testInfo: TestInfo, type: string): Promise<void> {
  const before = await page.locator('.react-flow__node').count();
  await press(page.getByTestId(`palette-${type}`), testInfo);
  await expect(page.locator('.react-flow__node')).toHaveCount(before + 1);
}

export function light(page: Page, label: string): Locator {
  return page.getByRole('img', { name: new RegExp(`^Light ${label}:`) });
}

export function switchButton(page: Page, label: string): Locator {
  return page.getByRole('button', { name: new RegExp(`^Switch ${label}: (on|off)`) });
}

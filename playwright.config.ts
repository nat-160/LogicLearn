import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against the production build (vite preview).
 *
 * Projects:
 *  - chromium:        desktop, mouse
 *  - chromium-touch:  tablet-sized, touch only (taps – Playwright's touchscreen API has
 *                     no drag, which suits us: every action has a tap alternative)
 *  - firefox, webkit: desktop, in CI only (CI installs those browsers)
 */
const ci = !!process.env.CI;
const baseURL = 'http://localhost:4173/';

/**
 * Lessons open in order, and most tests use Lesson 2 ("NOT and AND"). So every test starts
 * in a browser where Lesson 1 is finished. Tests about gating start with an empty browser
 * instead (see e2e/gating.spec.ts).
 */
const LESSON_1_DONE = {
  cookies: [],
  origins: [
    {
      origin: new URL(baseURL).origin,
      localStorage: [
        {
          name: 'logiclearn:progress:v1',
          value: JSON.stringify({
            'signals/fan-out': {
              done: true,
              attempts: 1,
              hintsUsed: 0,
              triedRows: [],
              firstSeen: '',
              lastSeen: '',
            },
          }),
        },
      ],
    },
  ],
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: ci ? 1 : 0,
  reporter: ci ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    storageState: LESSON_1_DONE,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: !ci,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'chromium-touch',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1180, height: 820 },
        hasTouch: true,
        isMobile: false,
      },
    },
    ...(ci
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['Desktop Safari'] } },
        ]
      : []),
  ],
});

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

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: ci ? 1 : 0,
  reporter: ci ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173/',
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

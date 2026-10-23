import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end journeys run against the STAGING Supabase project from .env.local (never production).
 * Global setup creates a temporary admin + teacher and opens one quiz and one class; global
 * teardown deletes everything the run created.
 *
 *   npm run test:e2e                 (starts `npm run dev` automatically, or reuses a running server)
 *   E2E_BASE_URL=https://staging.example.com npm run test:e2e   (an already-deployed staging site)
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000,
  expect: { timeout: 8000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? 'npm run build && npm run start' : 'npm run dev',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
      },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});

import { defineConfig, devices } from '@playwright/test';

const PLAYWRIGHT_BASE_URL = 'http://localhost:3000';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  webServer: {
    command: process.env.PRODUCTION_READY ? 'pnpm preview' : 'pnpm dev', // In production ready environments, use `pnpm preview` to simulate production environments.
    url: PLAYWRIGHT_BASE_URL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    colorScheme: 'light',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'Desktop Safari',
      use: {
        ...devices['Desktop Safari'],
      },
    },
    {
      name: 'Desktop Edge',
      use: {
        ...devices['Desktop Edge'],
      },
    },
  ],
});

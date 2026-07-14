import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'integration_tests/e2e',
  outputDir: 'test-results',
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  reporter: [['list'], ['junit', { outputFile: 'test_results/playwright/results.xml' }], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3007',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: 'npm run build && npm run start-feature',
    url: 'http://localhost:3007/ping',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})

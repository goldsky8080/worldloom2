import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 15000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5187',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } },
  ],
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5187 --strictPort',
        url: 'http://127.0.0.1:5187',
        env: { WORLDLOOM_VITE_CACHE_DIR: '.cache/vite-playwright' },
        reuseExistingServer: false,
        timeout: 30000,
      },
});

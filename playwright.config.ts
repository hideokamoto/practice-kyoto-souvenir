import { defineConfig } from '@playwright/test';

// 事前に `npm run build` しておくこと（CI では build の後に実行する）。
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4310/kyoto-ikezu-quiz/',
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    launchOptions: process.env['PW_CHROMIUM_PATH']
      ? { executablePath: process.env['PW_CHROMIUM_PATH'] }
      : undefined,
  },
  webServer: {
    command: 'node tools/e2e-server.mjs',
    url: 'http://localhost:4310/kyoto-ikezu-quiz/',
    reuseExistingServer: !process.env['CI'],
  },
});

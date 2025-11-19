import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2Eテスト設定
 * 
 * この設定は、Ionic AngularアプリケーションのE2Eテスト用です。
 * 再発防止のための重要なテストが含まれています：
 * - ion-router-outletの重複チェック
 * - スクロール機能の検証
 * - ナビゲーション機能の検証
 */
export default defineConfig({
  testDir: './e2e/playwright',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});


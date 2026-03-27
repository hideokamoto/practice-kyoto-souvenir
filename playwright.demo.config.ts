import { defineConfig, devices } from '@playwright/test';

/**
 * デモ録画専用のPlaywright設定
 *
 * 通常のE2Eテストとは別に、Remotion用のデモ動画を録画するための設定。
 * - video.mode: 'on' で全テストを録画
 * - 1920x1080の高解像度で録画
 * - 並列実行なし（順番に録画するため）
 */
export default defineConfig({
  testDir: './e2e/demo',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 120000,

  projects: [
    {
      name: 'demo',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
        viewport: { width: 1920, height: 1080 },
        video: {
          mode: 'on',
          size: { width: 1920, height: 1080 },
        },
      },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});

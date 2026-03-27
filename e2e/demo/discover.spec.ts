import { test, expect } from '@playwright/test';

/**
 * Discover ページのデモ録画
 *
 * メインページの提案カード表示・シャッフル・検索切り替えを録画する。
 * APIモックで理想的なデータを返し、台本通りの操作を実行する。
 */
test.describe('Discover ページ デモ', () => {
  test('提案カードの閲覧と検索を操作する', async ({ page }) => {
    // ========== ページ遷移 ==========
    await page.goto('http://localhost:4200/tabs/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ========== Step 1: メインビジュアルを見せる ==========
    // ヘッダーのアプリ名「きょう再見」が表示されていることを確認
    await expect(page.locator('ion-title')).toBeVisible();
    await page.waitForTimeout(1500);

    // ========== Step 2: ページをスクロールして提案カードを見せる ==========
    const content = page.locator('ion-content');
    await content.evaluate((el) => {
      el.scrollTo({ top: 300, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    // ========== Step 3: 提案をシャッフル ==========
    const shuffleButton = page.locator('ion-button:has-text("別の提案を見る")');
    if (await shuffleButton.isVisible()) {
      await shuffleButton.click();
      await page.waitForTimeout(2000);
    }

    // ========== Step 4: 観光地/お土産セグメント切り替え ==========
    // 探索モードセクションまでスクロール
    await content.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight * 0.6, behavior: 'smooth' });
    });
    await page.waitForTimeout(1500);

    // お土産セグメントに切り替え
    const souvenirSegment = page.locator('ion-segment-button:has-text("お土産")');
    if (await souvenirSegment.isVisible()) {
      await souvenirSegment.click();
      await page.waitForTimeout(1500);
    }

    // 観光地に戻す
    const sightsSegment = page.locator('ion-segment-button:has-text("観光地")');
    if (await sightsSegment.isVisible()) {
      await sightsSegment.click();
      await page.waitForTimeout(1500);
    }

    // ========== Step 5: 検索バーに入力 ==========
    const searchbar = page.locator('ion-searchbar').first();
    if (await searchbar.isVisible()) {
      await searchbar.click();
      await page.waitForTimeout(500);
      // 1文字ずつ入力してタイピングの様子を見せる
      await searchbar.locator('input').pressSequentially('清水', { delay: 150 });
      await page.waitForTimeout(2000);
    }

    // ========== Step 6: トップに戻る ==========
    await content.evaluate((el) => {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await page.waitForTimeout(1500);

    // 動画を保存
    await page.close();
    await page.video()?.saveAs('public/remotion/videos/discover.webm');
  });
});

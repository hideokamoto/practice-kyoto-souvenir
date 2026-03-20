import { test, expect } from '@playwright/test';

/**
 * 観光地詳細ページのデモ録画
 *
 * 観光地リストから詳細ページへ遷移し、お気に入り・訪問済み登録、
 * プラン作成の操作を録画する。
 */
test.describe('観光地詳細 デモ', () => {
  test('観光地を閲覧しお気に入り・プランに追加する', async ({ page }) => {
    // ========== Step 1: Discover ページから開始 ==========
    await page.goto('http://localhost:4200/tabs/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ========== Step 2: 探索モードセクションまでスクロール ==========
    const content = page.locator('ion-content');
    await content.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight * 0.5, behavior: 'smooth' });
    });
    await page.waitForTimeout(1500);

    // ========== Step 3: 観光地リストの最初のアイテムをクリック ==========
    const firstSight = page.locator('app-list-sight-item ion-item').first();
    if (await firstSight.isVisible()) {
      await firstSight.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // ========== Step 4: 詳細ページの内容を見せる（スクロール） ==========
    const detailContent = page.locator('ion-content');
    await detailContent.evaluate((el) => {
      el.scrollTo({ top: 400, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    // ========== Step 5: お気に入りボタンをクリック ==========
    const favoriteButton = page.locator('ion-button:has-text("お気に入りに追加")').first();
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(1500);
    }

    // ========== Step 6: 訪問済みボタンをクリック ==========
    const visitedButton = page.locator('ion-button:has-text("行ったことがあるにする")').first();
    if (await visitedButton.isVisible()) {
      await visitedButton.click();
      await page.waitForTimeout(1500);
    }

    // ========== Step 7: さらにスクロールしてアクセス情報を見せる ==========
    await detailContent.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight * 0.7, behavior: 'smooth' });
    });
    await page.waitForTimeout(2000);

    // ========== Step 8: プラン追加ボタン ==========
    const planButton = page.locator('ion-button:has-text("プランを作る")').first();
    if (await planButton.isVisible()) {
      await planButton.click();
      await page.waitForTimeout(1500);

      // ダイアログが出たら「新しいプランを作成」を選択
      const newPlanButton = page.locator('button:has-text("新しいプラン"), .alert-button:has-text("作成")').first();
      if (await newPlanButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await newPlanButton.click();
        await page.waitForTimeout(1500);
      }

      // ダイアログを閉じる（キャンセル）
      const cancelButton = page.locator('.alert-button:has-text("キャンセル")').first();
      if (await cancelButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await cancelButton.click();
        await page.waitForTimeout(1000);
      }
    }

    // ========== Step 9: 次の観光地へ ==========
    const nextButton = page.locator('ion-button:has-text("次の観光地")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(2000);
    }

    // 動画を保存
    await page.close();
    await page.video()?.saveAs('public/remotion/videos/sight-detail.webm');
  });
});

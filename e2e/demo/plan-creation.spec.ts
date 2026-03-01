import { test, expect } from '@playwright/test';

/**
 * プラン作成ページのデモ録画
 *
 * プランの新規作成・ランダム生成・詳細管理を録画する。
 */
test.describe('プラン作成 デモ', () => {
  test('プランの作成と管理を操作する', async ({ page }) => {
    // ========== Step 1: プランタブへ遷移 ==========
    await page.goto('http://localhost:4200/tabs/plans');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ========== Step 2: 空の状態を見せる ==========
    await expect(page.locator('ion-content')).toBeVisible();
    await page.waitForTimeout(1500);

    // ========== Step 3: プランを作成 ==========
    const createButton = page.locator('ion-button:has-text("プランを作成")');
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // ダイアログにプラン名を入力
      const alertInput = page.locator('ion-alert input, .alert-input');
      if (await alertInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await alertInput.clear();
        await alertInput.pressSequentially('京都一日観光プラン', { delay: 100 });
        await page.waitForTimeout(1000);

        // 作成ボタンをクリック
        const confirmButton = page.locator('.alert-button:has-text("作成"), .alert-button:has-text("OK")').first();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // ========== Step 4: ランダムプラン作成 ==========
    // プランページに戻る（もしプラン詳細にいたら）
    const backButton = page.locator('ion-back-button').first();
    if (await backButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await backButton.click();
      await page.waitForTimeout(1500);
    }

    const randomButton = page.locator('ion-button:has-text("ランダムプラン")');
    if (await randomButton.isVisible()) {
      await randomButton.click();
      await page.waitForTimeout(1500);

      // ダイアログの確認
      const confirmRandom = page.locator('.alert-button:has-text("作成"), .alert-button:has-text("OK")').first();
      if (await confirmRandom.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmRandom.click();
        await page.waitForTimeout(2000);
      }
    }

    // ========== Step 5: プランリストを見せる ==========
    await page.waitForTimeout(1500);

    // ========== Step 6: プラン詳細を開く ==========
    const planItem = page.locator('ion-item').first();
    if (await planItem.isVisible()) {
      await planItem.click();
      await page.waitForTimeout(2000);

      // プラン詳細のスクロール
      const detailContent = page.locator('ion-content');
      await detailContent.evaluate((el) => {
        el.scrollTo({ top: 300, behavior: 'smooth' });
      });
      await page.waitForTimeout(2000);
    }

    // ========== Step 7: FABボタンを見せる ==========
    const fab = page.locator('ion-fab-button');
    if (await fab.isVisible()) {
      await page.waitForTimeout(1000);
    }

    // 動画を保存
    await page.close();
    await page.video()?.saveAs('public/remotion/videos/plan-creation.webm');
  });
});

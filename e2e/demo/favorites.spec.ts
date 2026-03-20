import { test, expect } from '@playwright/test';

/**
 * お気に入りページのデモ録画
 *
 * お気に入りの追加・一覧表示・スワイプ削除を録画する。
 */
test.describe('お気に入り デモ', () => {
  test('お気に入りの追加と管理を操作する', async ({ page }) => {
    // ========== Step 1: Discover ページで事前にお気に入り登録 ==========
    await page.goto('http://localhost:4200/tabs/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 提案カードのアクションボタンをクリックして詳細へ
    const actionButton = page.locator('ion-card ion-button').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // お気に入りに追加
      const favButton = page.locator('ion-button:has-text("お気に入りに追加")').first();
      if (await favButton.isVisible()) {
        await favButton.click();
        await page.waitForTimeout(1000);
      }

      // 戻る
      await page.locator('ion-back-button, ion-button[slot="start"]').first().click();
      await page.waitForTimeout(1500);
    }

    // ========== Step 2: お気に入りタブへ遷移 ==========
    const favoritesTab = page.locator('ion-tab-button:has-text("お気に入り")');
    if (await favoritesTab.isVisible()) {
      await favoritesTab.click();
      await page.waitForTimeout(2000);
    } else {
      await page.goto('http://localhost:4200/tabs/favorites');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }

    // ========== Step 3: お気に入りリストを見せる ==========
    await expect(page.locator('ion-content')).toBeVisible();
    await page.waitForTimeout(2000);

    // ========== Step 4: アイテムをタップして詳細を確認 ==========
    const firstItem = page.locator('ion-item').first();
    if (await firstItem.isVisible()) {
      await firstItem.click();
      await page.waitForTimeout(2000);

      // 戻る
      const backButton = page.locator('ion-back-button').first();
      if (await backButton.isVisible()) {
        await backButton.click();
        await page.waitForTimeout(1500);
      }
    }

    // ========== Step 5: スワイプ削除のデモ ==========
    const slidingItem = page.locator('ion-item-sliding').first();
    if (await slidingItem.isVisible()) {
      // スワイプをシミュレート
      const box = await slidingItem.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 20 });
        await page.mouse.up();
        await page.waitForTimeout(1500);

        // 削除ボタンが表示されたらクリック
        const deleteButton = page.locator('ion-item-option:has-text("削除"), ion-item-option ion-icon[name="trash"]').first();
        if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await deleteButton.click();
          await page.waitForTimeout(1500);
        }
      }
    }

    await page.waitForTimeout(1500);

    // 動画を保存
    await page.close();
    await page.video()?.saveAs('public/remotion/videos/favorites.webm');
  });
});

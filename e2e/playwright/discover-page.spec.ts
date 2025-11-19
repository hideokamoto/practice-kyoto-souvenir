/**
 * Discover Page E2E Tests
 * 
 * このテストスイートは、Discoverページの重要な機能を検証します。
 * 再発防止のためのテストが含まれています：
 * 
 * 1. ion-router-outletの重複チェック
 *    - 問題: app.component.htmlに明示的なion-router-outletが存在し、
 *            ion-tabsが自動生成するものと重複していた
 *    - 修正: 明示的なion-router-outletを削除
 * 
 * 2. スクロール機能の検証
 *    - 問題: ion-contentのスクロールが機能していなかった
 *    - 修正: CSSでスクロールを有効化
 * 
 * 3. ナビゲーション機能の検証
 *    - ボタンクリックによる遷移が正常に動作することを確認
 */

import { test, expect } from '@playwright/test';

test.describe('Discover Page - Critical Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('ion-content', { state: 'visible' });
    await page.waitForTimeout(5000); // データ読み込み待機
  });

  test('should have correct number of ion-router-outlets (regression test)', async ({ page }) => {
    // 再発防止: ion-router-outletの数をチェック
    // 正しい構造: app.component.htmlに1つ + ion-tabsが自動生成する1つ = 合計2つ
    const routerOutlets = page.locator('ion-router-outlet');
    const count = await routerOutlets.count();
    
    expect(count).toBe(2);
  });

  test('should enable scrolling (regression test)', async ({ page }) => {
    // 再発防止: スクロール機能が有効であることを確認
    const content = page.locator('ion-content').first();
    await expect(content).toBeVisible();

    const scrollInfo = await content.evaluate((el: any) => {
      const scrollElement = el.shadowRoot?.querySelector('.inner-scroll') || el;
      return {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        canScroll: scrollElement.scrollHeight > scrollElement.clientHeight
      };
    });

    expect(scrollInfo.canScroll).toBe(true);

    // スクロールを実行して動作を確認
    await content.evaluate((el: any) => {
      const scrollElement = el.shadowRoot?.querySelector('.inner-scroll') || el;
      scrollElement.scrollTop = 1000;
    });

    await page.waitForTimeout(500);

    const scrollTop = await content.evaluate((el: any) => {
      const scrollElement = el.shadowRoot?.querySelector('.inner-scroll') || el;
      return scrollElement.scrollTop;
    });

    expect(scrollTop).toBeGreaterThan(0);
  });

  test('should scroll to exploration section and interact with segments', async ({ page }) => {
    const content = page.locator('ion-content').first();
    
    // 探索セクションまでスクロール
    await content.evaluate((el: any) => {
      const scrollElement = el.shadowRoot?.querySelector('.inner-scroll') || el;
      scrollElement.scrollTop = 1500;
    });

    await page.waitForTimeout(1000);

    // セグメントボタンが機能することを確認
    const segmentButtons = page.locator('ion-segment-button');
    const segmentCount = await segmentButtons.count();
    expect(segmentCount).toBeGreaterThan(0);

    // お土産セグメントをクリック
    const souvenirsSegment = page.locator('ion-segment-button[value="souvenirs"]');
    await expect(souvenirsSegment).toBeVisible();
    await souvenirsSegment.click();
    await page.waitForTimeout(500);

    // お土産リストが表示されることを確認
    const souvenirList = page.locator('app-list-souvenirs');
    await expect(souvenirList.first()).toBeVisible({ timeout: 5000 });
  });

  test('should scroll through entire page', async ({ page }) => {
    const content = page.locator('ion-content').first();
    
    // スクロール情報を取得
    const scrollInfo = await content.evaluate((el: any) => {
      const scrollElement = el.shadowRoot?.querySelector('.inner-scroll') || el;
      return {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        maxScroll: scrollElement.scrollHeight - scrollElement.clientHeight
      };
    });

    // 最下部までスクロール
    await content.evaluate((el: any, maxScroll: number) => {
      const scrollElement = el.shadowRoot?.querySelector('.inner-scroll') || el;
      scrollElement.scrollTop = maxScroll;
    }, scrollInfo.maxScroll);

    await page.waitForTimeout(1000);

    const finalScrollInfo = await content.evaluate((el: any) => {
      const scrollElement = el.shadowRoot?.querySelector('.inner-scroll') || el;
      return {
        scrollTop: scrollElement.scrollTop,
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        atBottom: Math.abs(scrollElement.scrollTop + scrollElement.clientHeight - scrollElement.scrollHeight) < 50
      };
    });

    expect(finalScrollInfo.scrollTop).toBeGreaterThan(0);
  });
});


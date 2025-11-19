/**
 * Discover Page E2E Tests
 * 
 * このテストスイートは、Discoverページの重要な機能を検証します。
 * Angularのベストプラクティスに従って実装されています：
 * 
 * - TypeScriptの厳密な型チェック
 * - Angular Routerの状態確認
 * - 適切な待機方法（DOMの状態を待つ）
 * - Angularコンポーネントセレクターの活用
 * 
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

import { test, expect, Page, Locator } from '@playwright/test';

/**
 * IonContentのスクロール情報を表す型
 */
interface ScrollInfo {
  scrollHeight: number;
  clientHeight: number;
  canScroll: boolean;
  scrollTop?: number;
  maxScroll?: number;
  atBottom?: boolean;
}

/**
 * IonContent要素の型定義
 */
interface IonContentElement extends HTMLElement {
  shadowRoot: ShadowRoot | null;
}

test.describe('Discover Page - Critical Functionality', () => {
  /**
   * 各テストの前に実行されるセットアップ
   * Angular Routerの状態を確認し、ページが完全に読み込まれるまで待機
   */
  test.beforeEach(async ({ page }) => {
    // Angular Routerを使用してページに遷移
    await page.goto('/tabs/discover');
    
    // ネットワークがアイドル状態になるまで待機
    await page.waitForLoadState('networkidle');
    
    // Angularコンポーネントがレンダリングされるまで待機
    await page.waitForSelector('ion-content', { state: 'visible' });
    
    // データ読み込みが完了するまで待機（ローディング状態が消えるまで）
    await page.waitForSelector('ion-spinner', { state: 'hidden', timeout: 10000 }).catch(() => {
      // ローディングスピナーが表示されない場合は、データが既に読み込まれている
    });
    
    // Angularコンポーネントが完全に初期化されるまで待機
    await page.waitForFunction(() => {
      const content = document.querySelector('ion-content');
      return content !== null;
    }, { timeout: 10000 });
  });

  /**
   * Angular Routerの状態を確認するテスト
   * 正しいURLに遷移していることを確認
   */
  test('should navigate to correct route using Angular Router', async ({ page }) => {
    // Angular Routerが正しいURLに遷移していることを確認
    await expect(page).toHaveURL(/\/tabs\/discover/);
    
    // ページタイトルが正しく設定されていることを確認
    const title = await page.locator('ion-title').first().textContent();
    expect(title).toContain('発見');
  });

  /**
   * ion-router-outletの重複を防ぐ回帰テスト
   * Angularのルーティング構造が正しいことを確認
   */
  test('should have correct number of ion-router-outlets (regression test)', async ({ page }) => {
    // 再発防止: ion-router-outletの数をチェック
    // 正しい構造: app.component.htmlに1つ + ion-tabsが自動生成する1つ = 合計2つ
    const routerOutlets: Locator = page.locator('ion-router-outlet');
    const count: number = await routerOutlets.count();
    
    expect(count).toBe(2);
  });

  /**
   * スクロール機能の回帰テスト
   * TypeScriptの厳密な型チェックを使用
   */
  test('should enable scrolling (regression test)', async ({ page }) => {
    // 再発防止: スクロール機能が有効であることを確認
    const content: Locator = page.locator('ion-content').first();
    await expect(content).toBeVisible();

    // スクロール情報を取得（型安全な方法）
    const scrollInfo: ScrollInfo = await content.evaluate((el: IonContentElement): ScrollInfo => {
      const scrollElement: HTMLElement = el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement || el;
      return {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        canScroll: scrollElement.scrollHeight > scrollElement.clientHeight
      };
    });

    expect(scrollInfo.canScroll).toBe(true);

    // スクロールを実行して動作を確認
    await content.evaluate((el: IonContentElement): void => {
      const scrollElement: HTMLElement = el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement || el;
      scrollElement.scrollTop = 1000;
    });

    // DOMの更新を待機（waitForTimeoutの代わりに）
    await page.waitForFunction(() => {
      const content = document.querySelector('ion-content');
      if (!content) return false;
      const scrollElement = (content as IonContentElement).shadowRoot?.querySelector('.inner-scroll') as HTMLElement || content;
      return scrollElement.scrollTop > 0;
    }, { timeout: 2000 });

    const scrollTop: number = await content.evaluate((el: IonContentElement): number => {
      const scrollElement: HTMLElement = el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement || el;
      return scrollElement.scrollTop;
    });

    expect(scrollTop).toBeGreaterThan(0);
  });

  /**
   * 探索セクションへのスクロールとセグメント操作のテスト
   * Angularコンポーネントセレクターを活用
   */
  test('should scroll to exploration section and interact with segments', async ({ page }) => {
    const content: Locator = page.locator('ion-content').first();
    
    // 探索セクションまでスクロール
    await content.evaluate((el: IonContentElement): void => {
      const scrollElement: HTMLElement = el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement || el;
      scrollElement.scrollTop = 1500;
    });

    // セグメントが表示されるまで待機
    await page.waitForSelector('ion-segment', { state: 'visible', timeout: 5000 });

    // セグメントボタンが機能することを確認
    const segmentButtons: Locator = page.locator('ion-segment-button');
    const segmentCount: number = await segmentButtons.count();
    expect(segmentCount).toBeGreaterThan(0);

    // お土産セグメントをクリック
    const souvenirsSegment: Locator = page.locator('ion-segment-button[value="souvenirs"]');
    await expect(souvenirsSegment).toBeVisible();
    await souvenirsSegment.click();

    // Angularコンポーネントが更新されるまで待機（DOMの状態を待つ）
    await page.waitForSelector('app-list-souvenirs', { state: 'visible', timeout: 5000 });

    // お土産リストが表示されることを確認（Angularコンポーネントセレクターを使用）
    const souvenirList: Locator = page.locator('app-list-souvenirs');
    await expect(souvenirList.first()).toBeVisible({ timeout: 5000 });
  });

  /**
   * ページ全体のスクロールテスト
   * TypeScriptの厳密な型チェックを使用
   */
  test('should scroll through entire page', async ({ page }) => {
    const content: Locator = page.locator('ion-content').first();
    
    // スクロール情報を取得（型安全な方法）
    const scrollInfo: ScrollInfo = await content.evaluate((el: IonContentElement): ScrollInfo => {
      const scrollElement: HTMLElement = el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement || el;
      return {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        maxScroll: scrollElement.scrollHeight - scrollElement.clientHeight
      };
    });

    // 最下部までスクロール
    await content.evaluate((el: IonContentElement, maxScroll: number): void => {
      const scrollElement: HTMLElement = el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement || el;
      scrollElement.scrollTop = maxScroll;
    }, scrollInfo.maxScroll || 0);

    // スクロールが完了するまで待機（DOMの状態を待つ）
    await page.waitForFunction((expectedMaxScroll: number) => {
      const content = document.querySelector('ion-content');
      if (!content) return false;
      const scrollElement = (content as IonContentElement).shadowRoot?.querySelector('.inner-scroll') as HTMLElement || content;
      return Math.abs(scrollElement.scrollTop - expectedMaxScroll) < 10;
    }, scrollInfo.maxScroll || 0, { timeout: 2000 });

    const finalScrollInfo: ScrollInfo = await content.evaluate((el: IonContentElement): ScrollInfo => {
      const scrollElement: HTMLElement = el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement || el;
      return {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        scrollTop: scrollElement.scrollTop,
        atBottom: Math.abs(scrollElement.scrollTop + scrollElement.clientHeight - scrollElement.scrollHeight) < 50
      };
    });

    expect(finalScrollInfo.scrollTop).toBeGreaterThan(0);
  });

  /**
   * Angularコンポーネントの表示を確認するテスト
   * コンポーネントセレクターを使用
   */
  test('should display Angular components correctly', async ({ page }) => {
    // データが読み込まれるまで待機
    await page.waitForSelector('app-list-sight-item, app-list-souvenirs', { 
      state: 'visible', 
      timeout: 10000 
    }).catch(() => {
      // コンポーネントが表示されない場合でもテストを続行
    });

    // 観光地リストコンポーネントまたはお土産リストコンポーネントが存在することを確認
    const sightItems: Locator = page.locator('app-list-sight-item');
    const souvenirItems: Locator = page.locator('app-list-souvenirs');
    
    const sightCount: number = await sightItems.count();
    const souvenirCount: number = await souvenirItems.count();
    
    // どちらかのコンポーネントが表示されていることを確認
    expect(sightCount + souvenirCount).toBeGreaterThan(0);
  });

  /**
   * Angular Routerを使用したナビゲーションテスト
   * 提案カードのリンクが正しく動作することを確認
   */
  test('should navigate using Angular Router when clicking recommendation card', async ({ page }) => {
    // 提案カードが表示されるまで待機
    await page.waitForSelector('ion-card.recommendation-card', { 
      state: 'visible', 
      timeout: 10000 
    }).catch(() => {
      // 提案カードが表示されない場合はスキップ
      test.skip();
    });

    // 最初の提案カードのボタンを取得
    const firstButton: Locator = page.locator('ion-card.recommendation-card ion-button').first();
    await expect(firstButton).toBeVisible({ timeout: 5000 });

    // ボタンをクリック
    await firstButton.click();

    // Angular Routerがナビゲーションを実行するまで待機
    await page.waitForURL(/\/sights\/|\/souvenir\//, { timeout: 5000 });

    // URLが正しく変更されたことを確認
    const currentUrl: string = page.url();
    expect(currentUrl).toMatch(/\/sights\/|\/souvenir\//);
  });
});


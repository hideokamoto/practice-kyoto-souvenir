/**
 * UX Investigation Script
 *
 * アプリのユーザー体験を詳細に調査し、
 * DESIGN.mdで定義された理想状態と現状の乖離を特定するためのスクリプト。
 */

import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const SCREENSHOT_DIR = '/tmp/ux-investigation';

// スクリーンショットディレクトリを作成
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('ion-content', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('ion-spinner', { state: 'hidden', timeout: 15000 }).catch(() => {});
  // Angularの変更検知が完了するのを待つ
  await page.waitForTimeout(1000);
}

test.describe('UX Investigation: 発見ページ (Discover Page)', () => {
  test('【調査1】初回訪問時の第一印象 - アプリ起動直後の画面', async ({ page }) => {
    // localStorageをクリアして初回訪問を再現
    await page.goto('/tabs/discover');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-first-visit.png'), fullPage: false });

    // スクロール前に見える要素（above the fold）を調査
    const viewport = page.viewportSize();
    console.log(`[調査1] ビューポートサイズ: ${viewport?.width}x${viewport?.height}`);

    // ヘッダーの確認
    const headerTitle = await page.locator('ion-title').first().textContent();
    console.log(`[調査1] ヘッダータイトル: "${headerTitle}"`);

    // バリュープロポジションの確認
    const valueProposition = await page.locator('.value-proposition').isVisible();
    console.log(`[調査1] バリュープロポジション表示: ${valueProposition}`);

    if (valueProposition) {
      const vpText = await page.locator('.value-proposition').textContent();
      console.log(`[調査1] バリュープロポジション内容: "${vpText?.trim()}"`);
    }

    // メインアクション（提案）の確認
    const mainAction = await page.locator('.main-action-container').isVisible();
    console.log(`[調査1] メインアクションコンテナ表示: ${mainAction}`);

    const suggestionCards = await page.locator('.recommendation-card').count();
    console.log(`[調査1] 提案カード数: ${suggestionCards}`);

    // 探索モードの確認（DESIGN.mdでは折りたたみ可能であるべき）
    const explorationMode = await page.locator('.exploration-mode-container').isVisible();
    console.log(`[調査1] 探索モード表示: ${explorationMode}`);

    // Above the foldで何が見えているか
    const visibleElements = await page.evaluate(() => {
      const viewport = window.innerHeight;
      const elements: string[] = [];
      document.querySelectorAll('[class]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < viewport && rect.height > 0) {
          elements.push(`${el.tagName}.${Array.from(el.classList).join('.')}: top=${Math.round(rect.top)}, height=${Math.round(rect.height)}`);
        }
      });
      return elements.slice(0, 20); // 最初の20要素のみ
    });
    console.log('[調査1] Above-the-foldで見える要素:');
    visibleElements.forEach(el => console.log(`  - ${el}`));
  });

  test('【調査2】提案カードのUX - コンテンツと行動導線', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    const cards = await page.locator('.recommendation-card').count();
    console.log(`[調査2] 提案カード数: ${cards}`);

    if (cards > 0) {
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-recommendation-cards.png'), fullPage: false });

      // 最初のカードの詳細を調査
      const firstCard = page.locator('.recommendation-card').first();

      // カードタイトル
      const title = await firstCard.locator('ion-card-title').textContent();
      console.log(`[調査2] 1番目のカードタイトル: "${title}"`);

      // 推薦理由の表示
      const reasonText = await firstCard.locator('.recommendation-reason').textContent();
      console.log(`[調査2] 推薦理由テキスト: "${reasonText?.trim()}"`);

      // アクションボタン
      const actionBtn = firstCard.locator('.primary-button');
      const actionBtnVisible = await actionBtn.isVisible();
      const actionBtnText = await actionBtn.textContent();
      console.log(`[調査2] アクションボタン表示: ${actionBtnVisible}, テキスト: "${actionBtnText?.trim()}"`);

      // カードのサイズ・位置
      const cardRect = await firstCard.boundingBox();
      console.log(`[調査2] カードサイズ: ${cardRect?.width}x${cardRect?.height}, 位置: (${cardRect?.x}, ${cardRect?.y})`);

      // 説明文の表示状態
      const descriptionVisible = await firstCard.locator('.description-container').isVisible();
      console.log(`[調査2] 説明文コンテナ表示: ${descriptionVisible}`);

      // カード内の写真
      const photoExists = await firstCard.locator('img').isVisible().catch(() => false);
      console.log(`[調査2] カード内写真表示: ${photoExists}`);

      // ステータスバッジ
      const badges = await firstCard.locator('ion-badge').count();
      console.log(`[調査2] ステータスバッジ数: ${badges}`);
    }

    // 「別の提案を見る」ボタン
    const refreshBtn = page.locator('.refresh-button');
    const refreshBtnVisible = await refreshBtn.isVisible();
    console.log(`[調査2] 「別の提案を見る」ボタン表示: ${refreshBtnVisible}`);
  });

  test('【調査3】「別の提案を見る」ボタンのインタラクション', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    const refreshBtn = page.locator('.refresh-button');
    if (await refreshBtn.isVisible()) {
      // ボタンクリック前の提案を記録
      const beforeTitles: string[] = [];
      const beforeCards = page.locator('.recommendation-card ion-card-title');
      const beforeCount = await beforeCards.count();
      for (let i = 0; i < beforeCount; i++) {
        const title = await beforeCards.nth(i).textContent();
        beforeTitles.push(title || '');
      }
      console.log(`[調査3] クリック前の提案: ${beforeTitles.join(', ')}`);

      await refreshBtn.click();
      await page.waitForTimeout(500);

      // クリック後の提案を記録
      const afterTitles: string[] = [];
      const afterCards = page.locator('.recommendation-card ion-card-title');
      const afterCount = await afterCards.count();
      for (let i = 0; i < afterCount; i++) {
        const title = await afterCards.nth(i).textContent();
        afterTitles.push(title || '');
      }
      console.log(`[調査3] クリック後の提案: ${afterTitles.join(', ')}`);

      const changed = JSON.stringify(beforeTitles) !== JSON.stringify(afterTitles);
      console.log(`[調査3] 提案が変わったか: ${changed}`);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-after-refresh.png'), fullPage: false });
    } else {
      console.log('[調査3] 「別の提案を見る」ボタンが表示されていません');
    }
  });

  test('【調査4】探索モード - セグメント切り替えとリスト表示', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    // 探索モードまでスクロール
    const explorationContainer = page.locator('.exploration-mode-container');
    if (await explorationContainer.isVisible()) {
      await explorationContainer.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-exploration-mode.png'), fullPage: false });

      console.log('[調査4] 探索モードは常時表示（折りたたみ不可）');

      // 探索ヘッダーテキスト
      const explorationHeader = await page.locator('.exploration-header h3').textContent();
      console.log(`[調査4] 探索ヘッダー: "${explorationHeader}"`);

      // セグメント
      const segment = page.locator('ion-segment');
      const segmentVisible = await segment.isVisible();
      console.log(`[調査4] セグメント表示: ${segmentVisible}`);

      // 観光地リストの状態
      const sightsList = page.locator('app-list-sight-item');
      const sightsCount = await sightsList.count();
      console.log(`[調査4] 観光地リストアイテム数: ${sightsCount}`);

      // お土産に切り替え
      const souvenirsSegment = page.locator('ion-segment-button[value="souvenirs"]');
      if (await souvenirsSegment.isVisible()) {
        await souvenirsSegment.click();
        await page.waitForTimeout(500);
        const souvenirsList = page.locator('app-list-souvenirs');
        const souvenirsCount = await souvenirsList.count();
        console.log(`[調査4] お土産リストアイテム数: ${souvenirsCount}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-souvenirs-segment.png'), fullPage: false });
      }
    } else {
      console.log('[調査4] 探索モードコンテナが表示されていません');
    }
  });

  test('【調査5】検索機能のUX', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    // 探索モードまでスクロール
    await page.evaluate(() => {
      const el = document.querySelector('.exploration-mode-container');
      el?.scrollIntoView();
    });
    await page.waitForTimeout(500);

    // 検索バーを探す
    const searchInput = page.locator('ion-searchbar');
    const searchCount = await searchInput.count();
    console.log(`[調査5] 検索バー数: ${searchCount}`);

    if (searchCount > 0) {
      const firstSearch = searchInput.first();
      const searchVisible = await firstSearch.isVisible();
      console.log(`[調査5] 検索バー表示: ${searchVisible}`);

      if (searchVisible) {
        await firstSearch.click();
        await firstSearch.fill('清水');
        await page.waitForTimeout(1000);

        const filteredItems = await page.locator('app-list-sight-item').count();
        console.log(`[調査5] 「清水」検索後の結果数: ${filteredItems}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-search-result.png'), fullPage: false });
      }
    }
  });

  test('【調査6】詳細ページへの遷移とバックナビゲーション', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    const firstCard = page.locator('.recommendation-card').first();
    if (await firstCard.isVisible()) {
      const actionBtn = firstCard.locator('.primary-button');
      if (await actionBtn.isVisible()) {
        await actionBtn.click();
        await page.waitForURL(/\/sights\/|\/souvenir\//, { timeout: 5000 });

        const currentUrl = page.url();
        console.log(`[調査6] 遷移先URL: ${currentUrl}`);

        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-detail-page.png'), fullPage: false });

        // 詳細ページの要素を調査
        const backBtn = page.locator('ion-back-button');
        console.log(`[調査6] 戻るボタン表示: ${await backBtn.isVisible()}`);

        const favoriteBtn = page.locator('[aria-label*="お気に入り"], [aria-label*="favorite"]');
        console.log(`[調査6] お気に入りボタン表示: ${await favoriteBtn.isVisible().catch(() => false)}`);

        const visitBtn = page.locator('[aria-label*="訪問"], button:has-text("訪問"), ion-button:has-text("訪問")');
        console.log(`[調査6] 訪問記録ボタン表示: ${await visitBtn.isVisible().catch(() => false)}`);
      }
    }
  });
});

test.describe('UX Investigation: お気に入りページ (Favorites Page)', () => {
  test('【調査7】お気に入り空状態のUX', async ({ page }) => {
    await page.goto('/tabs/favorites');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await waitForAppReady(page);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-favorites-empty.png'), fullPage: false });

    const emptyState = page.locator('.empty-state');
    console.log(`[調査7] 空状態表示: ${await emptyState.isVisible()}`);
    if (await emptyState.isVisible()) {
      const emptyText = await emptyState.textContent();
      console.log(`[調査7] 空状態テキスト: "${emptyText?.trim()}"`);
    }

    const navigateBtn = page.locator('ion-button[routerLink]');
    console.log(`[調査7] 発見ページへのナビゲーションボタン: ${await navigateBtn.isVisible()}`);
  });
});

test.describe('UX Investigation: プランページ (Plans Page)', () => {
  test('【調査8】プランページのUX', async ({ page }) => {
    await page.goto('/tabs/plans');
    await waitForAppReady(page);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08-plans-page.png'), fullPage: false });

    const title = await page.locator('ion-title').first().textContent();
    console.log(`[調査8] プランページタイトル: "${title}"`);

    const emptyState = page.locator('.empty-state, [class*="empty"]');
    console.log(`[調査8] 空状態要素数: ${await emptyState.count()}`);
  });
});

test.describe('UX Investigation: 全体的なナビゲーションと情報アーキテクチャ', () => {
  test('【調査9】タブナビゲーションの確認', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-tab-navigation.png'), fullPage: false });

    const tabBar = page.locator('ion-tab-bar');
    console.log(`[調査9] タブバー表示: ${await tabBar.isVisible()}`);

    const tabButtons = page.locator('ion-tab-button');
    const tabCount = await tabButtons.count();
    console.log(`[調査9] タブ数: ${tabCount}`);

    for (let i = 0; i < tabCount; i++) {
      const tab = tabButtons.nth(i);
      const label = await tab.locator('ion-label').textContent();
      console.log(`[調査9] タブ${i + 1}: "${label}"`);
    }
  });

  test('【調査10】ページ全体のスクロール量調査 - コンテンツの長さ', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    // データが読み込まれるまで少し待つ
    await page.waitForTimeout(2000);

    const scrollInfo = await page.evaluate(() => {
      const content = document.querySelector('ion-content');
      if (!content) return null;
      const scrollEl = (content as any).shadowRoot?.querySelector('.inner-scroll') || content;
      return {
        scrollHeight: scrollEl.scrollHeight,
        clientHeight: scrollEl.clientHeight,
        viewportRatio: scrollEl.scrollHeight / scrollEl.clientHeight
      };
    });

    console.log(`[調査10] スクロール情報:`);
    console.log(`  - コンテンツ総高さ: ${scrollInfo?.scrollHeight}px`);
    console.log(`  - ビューポート高さ: ${scrollInfo?.clientHeight}px`);
    console.log(`  - ビューポート比率: ${scrollInfo?.viewportRatio?.toFixed(1)}x (1.0 = スクロール不要)`);

    // 全体のフルページスクリーンショット
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-full-page.png'), fullPage: true });
  });

  test('【調査11】観光地詳細ページの要素確認', async ({ page }) => {
    // 観光地の詳細ページに直接アクセス
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    // 最初のリストアイテムをクリック
    await page.waitForSelector('app-list-sight-item', { timeout: 10000 }).catch(() => {});

    const firstSightItem = page.locator('app-list-sight-item').first();
    if (await firstSightItem.isVisible()) {
      await firstSightItem.click();
      await page.waitForURL(/\/sights\//, { timeout: 5000 }).catch(() => {});

      if (page.url().includes('/sights/')) {
        await waitForAppReady(page);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-sight-detail.png'), fullPage: false });

        // 詳細ページの要素を詳しく調査
        const elements = {
          photo: await page.locator('img, ion-img').first().isVisible().catch(() => false),
          name: await page.locator('ion-title, h1, h2').first().textContent().catch(() => ''),
          description: await page.locator('[class*="description"], .description').first().isVisible().catch(() => false),
          address: await page.locator('[class*="address"], .address').first().isVisible().catch(() => false),
          price: await page.locator('[class*="price"], .price').first().isVisible().catch(() => false),
          favoriteBtn: await page.locator('ion-button:has(ion-icon[name*="heart"])').first().isVisible().catch(() => false),
          visitBtn: await page.locator('ion-button:has-text("訪問"), ion-button:has(ion-icon[name*="checkmark"])').first().isVisible().catch(() => false),
          mapLink: await page.locator('a[href*="maps"], ion-button:has-text("地図")').first().isVisible().catch(() => false),
          backBtn: await page.locator('ion-back-button').isVisible().catch(() => false),
        };

        console.log('[調査11] 詳細ページ要素:');
        Object.entries(elements).forEach(([key, value]) => {
          console.log(`  - ${key}: ${value}`);
        });
      }
    }
  });

  test('【調査12】モバイルUX - タップターゲットサイズの確認', async ({ page }) => {
    await page.goto('/tabs/discover');
    await waitForAppReady(page);

    // タップターゲットサイズをチェック (WCAG AA: 最小44x44px)
    const buttonSizes = await page.evaluate(() => {
      const results: Array<{text: string, width: number, height: number, isTooSmall: boolean}> = [];
      document.querySelectorAll('ion-button, button, ion-tab-button').forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          results.push({
            text: (btn.textContent || '').trim().slice(0, 30),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            isTooSmall: rect.width < 44 || rect.height < 44
          });
        }
      });
      return results.slice(0, 15);
    });

    console.log('[調査12] ボタンサイズ調査 (WCAG AA最小: 44x44px):');
    buttonSizes.forEach(btn => {
      const status = btn.isTooSmall ? '⚠️ 小さすぎ' : '✓ OK';
      console.log(`  ${status} "${btn.text}" - ${btn.width}x${btn.height}px`);
    });

    const tooSmallCount = buttonSizes.filter(b => b.isTooSmall).length;
    console.log(`[調査12] タップターゲット不足のボタン数: ${tooSmallCount}/${buttonSizes.length}`);
  });
});

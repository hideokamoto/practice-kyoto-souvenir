/**
 * Discover Page E2E Tests
 *
 * 再発防止:
 * 1. ion-router-outlet の重複チェック
 * 2. スクロール機能
 * 3. ナビゲーション（おすすめカード）
 * 4. 探索モード（段階的開示）のセグメント操作
 */

import { test, expect, Page, Locator } from '@playwright/test';

interface ScrollInfo {
  scrollHeight: number;
  clientHeight: number;
  canScroll: boolean;
  scrollTop?: number;
  maxScroll?: number;
  atBottom?: boolean;
}

interface IonContentElement extends HTMLElement {
  shadowRoot: ShadowRoot | null;
}

async function expandExploration(page: Page): Promise<void> {
  const toggle = page.locator('.exploration-toggle');
  await expect(toggle).toBeVisible({ timeout: 10000 });
  const expanded = await toggle.getAttribute('aria-expanded');
  if (expanded !== 'true') {
    await toggle.click();
  }
  await page.waitForSelector('#exploration-panel', { state: 'visible', timeout: 5000 });
}

test.describe('Discover Page - Critical Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tabs/discover');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('ion-content', { state: 'visible' });
    await page.waitForSelector('ion-spinner', { state: 'hidden', timeout: 10000 }).catch(() => {
      // already loaded
    });
    await page.waitForFunction(() => document.querySelector('ion-content') !== null, {
      timeout: 10000,
    });
  });

  test('should navigate to correct route using Angular Router', async ({ page }) => {
    await expect(page).toHaveURL(/\/tabs\/discover/);
    const title = await page.locator('ion-title').first().textContent();
    expect(title).toContain('発見');
  });

  test('should have correct number of ion-router-outlets (regression test)', async ({ page }) => {
    const routerOutlets: Locator = page.locator('ion-router-outlet');
    const count: number = await routerOutlets.count();
    expect(count).toBe(2);
  });

  test('should enable scrolling (regression test)', async ({ page }) => {
    await expandExploration(page);

    const content: Locator = page.locator('ion-content').first();
    await expect(content).toBeVisible();

    const scrollInfo: ScrollInfo = await content.evaluate((el: IonContentElement): ScrollInfo => {
      const scrollElement: HTMLElement =
        (el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement) || el;
      return {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        canScroll: scrollElement.scrollHeight > scrollElement.clientHeight,
      };
    });

    expect(scrollInfo.canScroll).toBe(true);

    await content.evaluate((el: IonContentElement): void => {
      const scrollElement: HTMLElement =
        (el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement) || el;
      scrollElement.scrollTop = 1000;
    });

    await page.waitForFunction(() => {
      const contentEl = document.querySelector('ion-content');
      if (!contentEl) return false;
      const scrollElement =
        ((contentEl as IonContentElement).shadowRoot?.querySelector(
          '.inner-scroll'
        ) as HTMLElement) || contentEl;
      return scrollElement.scrollTop > 0;
    }, { timeout: 2000 });

    const scrollTop: number = await content.evaluate((el: IonContentElement): number => {
      const scrollElement: HTMLElement =
        (el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement) || el;
      return scrollElement.scrollTop;
    });

    expect(scrollTop).toBeGreaterThan(0);
  });

  test('should scroll to exploration section and interact with segments', async ({ page }) => {
    await expandExploration(page);

    const segmentButtons: Locator = page.locator('#exploration-panel ion-segment-button');
    const segmentCount: number = await segmentButtons.count();
    expect(segmentCount).toBeGreaterThan(0);

    const souvenirsSegment: Locator = page.locator(
      '#exploration-panel ion-segment-button[value="souvenirs"]'
    );
    await expect(souvenirsSegment).toBeVisible();
    await souvenirsSegment.click();

    await page.waitForSelector('app-list-souvenirs', { state: 'visible', timeout: 5000 });
    const souvenirList: Locator = page.locator('app-list-souvenirs');
    await expect(souvenirList.first()).toBeVisible({ timeout: 5000 });
  });

  test('should scroll through entire page', async ({ page }) => {
    await expandExploration(page);

    const content: Locator = page.locator('ion-content').first();

    const scrollInfo: ScrollInfo = await content.evaluate((el: IonContentElement): ScrollInfo => {
      const scrollElement: HTMLElement =
        (el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement) || el;
      return {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        maxScroll: scrollElement.scrollHeight - scrollElement.clientHeight,
      };
    });

    await content.evaluate((el: IonContentElement, maxScroll: number): void => {
      const scrollElement: HTMLElement =
        (el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement) || el;
      scrollElement.scrollTop = maxScroll;
    }, scrollInfo.maxScroll || 0);

    await page.waitForFunction(
      (expectedMaxScroll: number) => {
        const contentEl = document.querySelector('ion-content');
        if (!contentEl) return false;
        const scrollElement =
          ((contentEl as IonContentElement).shadowRoot?.querySelector(
            '.inner-scroll'
          ) as HTMLElement) || contentEl;
        return Math.abs(scrollElement.scrollTop - expectedMaxScroll) < 10;
      },
      scrollInfo.maxScroll || 0,
      { timeout: 2000 }
    );

    const finalScrollInfo: ScrollInfo = await content.evaluate(
      (el: IonContentElement): ScrollInfo => {
        const scrollElement: HTMLElement =
          (el.shadowRoot?.querySelector('.inner-scroll') as HTMLElement) || el;
        return {
          scrollHeight: scrollElement.scrollHeight,
          clientHeight: scrollElement.clientHeight,
          scrollTop: scrollElement.scrollTop,
          atBottom:
            Math.abs(
              scrollElement.scrollTop + scrollElement.clientHeight - scrollElement.scrollHeight
            ) < 50,
        };
      }
    );

    expect(finalScrollInfo.scrollTop).toBeGreaterThan(0);
  });

  test('should display Angular components correctly', async ({ page }) => {
    await expandExploration(page);

    await page
      .waitForSelector('app-list-sight-item, app-list-souvenirs', {
        state: 'visible',
        timeout: 10000,
      })
      .catch(() => {
        // continue
      });

    const sightItems: Locator = page.locator('app-list-sight-item');
    const souvenirItems: Locator = page.locator('app-list-souvenirs');

    const sightCount: number = await sightItems.count();
    const souvenirCount: number = await souvenirItems.count();

    expect(sightCount + souvenirCount).toBeGreaterThan(0);
  });

  test('should navigate using Angular Router when clicking recommendation card', async ({
    page,
  }) => {
    const card = page.locator('.recommendation-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });

    const firstButton: Locator = page.locator('.recommendation-card .primary-action').first();
    await expect(firstButton).toBeVisible({ timeout: 5000 });
    await firstButton.click();

    await page.waitForURL(/\/sights\/|\/souvenir\//, { timeout: 5000 });
    expect(page.url()).toMatch(/\/sights\/|\/souvenir\//);
  });
});

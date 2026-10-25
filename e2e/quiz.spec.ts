import { expect, test, type Page } from '@playwright/test';

const MODES = [
  'みやげ鑑定',
  '名所めぐり',
  '京都人の台所',
  '空から当てる',
  '寺社の写真',
  '京の産業',
  '今日の5問',
];

/** 外部の画像（Commons・地理院タイル）は取りに行かない。CSP 違反は記録して最後に確かめる。 */
async function prepare(page: Page): Promise<string[]> {
  const violations: string[] = [];
  await page.route(/^https:\/\/(upload\.wikimedia\.org|cyberjapandata\.gsi\.go\.jp)\//, (r) =>
    r.fulfill({ status: 204, body: '' }),
  );
  page.on('console', (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      console.error(`Refused to load (CSP): ${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  return violations;
}

async function playThrough(page: Page, label: string): Promise<void> {
  await page.goto('./');
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).click();
  await expect(page).toHaveURL(/#\/quiz$/);
  for (let i = 1; i <= 5; i++) {
    await expect(page.locator('.progress')).toContainText(`${i} / 5`);
    await page.locator('button.choice').first().click();
    await expect(page.locator('.feedback .verdict')).toBeVisible();
    await expect(page.locator('.feedback .explanation')).not.toBeEmpty();
    await expect(page.locator('.feedback .sources li').first()).toBeVisible();
    await page.getByRole('button', { name: i === 5 ? '結果を見る' : '次の問題へ' }).click();
  }
  await expect(page).toHaveURL(/#\/result$/);
  await expect(page.locator('.score')).toContainText('/ 5');
  await expect(page.locator('.rank')).toContainText('称号');
  await expect(page.locator('.review > li')).toHaveCount(5);
}

test('ホームに 7 モードが並ぶ', async ({ page }) => {
  const violations = await prepare(page);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('京都いけず問答');
  await expect(page.locator('.mode-name')).toHaveText(MODES);
  expect(violations).toEqual([]);
});

for (const label of MODES) {
  test(`${label}: 5 問を最後まで遊べる（CSP 違反なし）`, async ({ page }) => {
    const violations = await prepare(page);
    await playThrough(page, label);
    expect(violations).toEqual([]);
  });
}

test('空から当てる: 航空写真は地理院タイル 9 枚と中心の印で出る', async ({ page }) => {
  await prepare(page);
  await page.goto('./');
  await page.getByRole('button', { name: /^空から当てる/ }).click();
  let seen = false;
  for (let i = 1; i <= 5; i++) {
    // 前の問題の DOM を数えないよう、問題が切り替わるのを待つ
    await expect(page.locator('.progress')).toContainText(`${i} / 5`);
    if (await page.locator('.aerial').count()) {
      seen = true;
      const srcs = await page
        .locator('.aerial img')
        .evaluateAll((els) => els.map((e) => (e as HTMLImageElement).src));
      expect(srcs).toHaveLength(9);
      for (const s of srcs)
        expect(s).toMatch(
          /^https:\/\/cyberjapandata\.gsi\.go\.jp\/xyz\/seamlessphoto\/17\/\d+\/\d+\.jpg$/,
        );
      await expect(page.locator('.aerial .marker')).toBeAttached();
      await expect(page.locator('.aerial figcaption')).toContainText('国土地理院');
    }
    await page.locator('button.choice').first().click();
    await page.getByRole('button', { name: i === 5 ? '結果を見る' : '次の問題へ' }).click();
  }
  expect(seen).toBe(true);
});

test('寺社の写真: 写真の下に作者・ライセンス・Commons へのリンクが出る', async ({ page }) => {
  await prepare(page);
  await page.goto('./');
  await page.getByRole('button', { name: /^寺社の写真/ }).click();
  let seen = false;
  for (let i = 1; i <= 5; i++) {
    await expect(page.locator('.progress')).toContainText(`${i} / 5`);
    if (await page.locator('figure.photo').count()) {
      seen = true;
      const cap = page.locator('figure.photo figcaption');
      await expect(cap).toContainText('写真：');
      await expect(cap.getByRole('link', { name: 'Wikimedia Commons' })).toHaveAttribute(
        'href',
        /^https:\/\/commons\.wikimedia\.org\//,
      );
      expect(await page.locator('figure.photo img').getAttribute('src')).toMatch(
        /^https:\/\/upload\.wikimedia\.org\//,
      );
    }
    await page.locator('button.choice').first().click();
    await page.getByRole('button', { name: i === 5 ? '結果を見る' : '次の問題へ' }).click();
  }
  expect(seen).toBe(true);
});

test('今日の5問: 同じ日なら別のブラウザでも同じ問題、結果はホームに出る', async ({ browser }) => {
  const prompts: string[][] = [];
  for (let k = 0; k < 2; k++) {
    const ctx = await browser.newContext({ locale: 'ja-JP', timezoneId: 'Asia/Tokyo' });
    const page = await ctx.newPage();
    await page.clock.setFixedTime(new Date('2026-10-25T03:00:00Z'));
    await prepare(page);
    await page.goto('./');
    await page.getByRole('button', { name: /^今日の5問/ }).click();
    const ps: string[] = [];
    for (let i = 1; i <= 5; i++) {
      await expect(page.locator('.progress')).toContainText(`${i} / 5`);
      ps.push((await page.locator('h2').textContent()) ?? '');
      await page.locator('button.choice').first().click();
      await page.getByRole('button', { name: i === 5 ? '結果を見る' : '次の問題へ' }).click();
    }
    prompts.push(ps);
    await page.getByRole('link', { name: 'モード選択へ' }).click();
    await expect(page.getByRole('button', { name: /^今日の5問/ })).toContainText('今日は');
    await ctx.close();
  }
  expect(prompts[0]).toEqual(prompts[1]);
});

test('クレジットに全データの出典が出る', async ({ page }) => {
  const violations = await prepare(page);
  await page.goto('./#/credits');
  for (const t of [
    '京都観光Navi',
    '観光施設一覧',
    '家計調査',
    'Wikidata',
    'Wikimedia Commons',
    '酒類製造業',
    '地域特産野菜',
    '国宝・重要文化財',
    '地理院タイル',
  ]) {
    await expect(page.locator('.metas')).toContainText(t);
  }
  expect(violations).toEqual([]);
});

test('ライセンス画面に同梱ライブラリのライセンスが出る', async ({ page }) => {
  await prepare(page);
  await page.goto('./#/licenses');
  await expect(page.locator('pre')).toContainText('@angular/core');
});

test('出題中にリロードしたらホームに戻る', async ({ page }) => {
  await prepare(page);
  await page.goto('./#/quiz');
  await expect(page).toHaveURL(/#\/$/);
});

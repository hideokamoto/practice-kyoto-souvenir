// 動作確認用の録画とスクリーンショットを撮る。全モード（難易度 3 つと今日の5問）を 5 問ずつ遊び、
// モードごとに動画を残す。難易度ごとの違いを見比べられるよう、乱数の種を固定する
// （どのモードも全部の型から同じ順に出るので、同じ型の問題が難易度ごとにどう変わるかが分かる）。
// 実行: node tools/demo/record.mjs [URL] [出力先]
//   URL の既定は Netlify のデプロイプレビュー。出力先の既定は demo-out/（git 管理外）。
//   別途用意したブラウザを使うときは PW_CHROMIUM_PATH=/path/to/chrome を付ける。
import { chromium } from '@playwright/test';
import { mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.argv[2] ?? 'https://deploy-preview-15--kyoto-app.netlify.app/';
const OUT = process.argv[3] ?? 'demo-out';
const VIEWPORT = { width: 430, height: 860 };
const MODES = [
  ['easy', 'かんたん'],
  ['normal', 'ふつう'],
  ['hard', 'むずかしい'],
  ['daily', '今日の5問'],
];
const SEED = Number(process.env.DEMO_SEED ?? 7);

mkdirSync(join(OUT, 'video'), { recursive: true });
mkdirSync(join(OUT, 'shots'), { recursive: true });

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const log = [];

/** 画像（航空写真・Commons の写真）の読み込みが終わるか失敗するまで待つ */
async function settleImages(page) {
  await page
    .waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 })
    .catch(() => {});
}

for (const [id, label] of MODES) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    recordVideo: { dir: join(OUT, 'video'), size: VIEWPORT },
  });
  const page = await ctx.newPage();
  await page.addInitScript((seed) => {
    let a = seed;
    Math.random = () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, SEED);
  // Netlify のデプロイプレビューは右下に「Collaborate / Log in」のツールバー（body 直下の div）を重ねる。
  // アプリの表示ではないので、撮影時だけ隠す（アプリは body 直下に div を置いていない）。
  if (new URL(BASE).host.endsWith('netlify.app')) {
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = 'body > div { display: none !important; }';
        document.head.append(s);
      });
    });
  }
  await page.goto(BASE);
  await page.waitForTimeout(800);
  if (id === 'easy')
    await page.screenshot({ path: join(OUT, 'shots', '00-home.png'), fullPage: true });
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).click();
  for (let i = 1; i <= 5; i++) {
    await page
      .locator('.progress')
      .filter({ hasText: `${i} / 5` })
      .waitFor();
    await settleImages(page);
    await page.waitForTimeout(1200);
    const prompt = (await page.locator('h2').textContent())?.trim();
    await page.locator('button.choice').first().click();
    await page.locator('.feedback').waitFor();
    await page.waitForTimeout(1500);
    const verdict = (await page.locator('.verdict').textContent())?.trim();
    const photoFailed = await page.locator('figure.photo .failed').count();
    log.push({ mode: label, q: i, prompt, verdict, photoFailed: photoFailed > 0 });
    await page.screenshot({ path: join(OUT, 'shots', `${id}-q${i}.png`), fullPage: true });
    await page.getByRole('button', { name: i === 5 ? '結果を見る' : '次の問題へ' }).click();
  }
  await page.locator('.score').waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(OUT, 'shots', `${id}-result.png`), fullPage: true });
  const video = page.video();
  await ctx.close();
  renameSync(
    await video.path(),
    join(OUT, 'video', `${MODES.findIndex((m) => m[0] === id) + 1}-${id}.webm`),
  );
}
await browser.close();
console.log(JSON.stringify(log, null, 1));

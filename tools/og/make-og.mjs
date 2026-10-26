// OGP 画像（public/og-image.png）を tools/og/og-image.html から撮影する。
// 実行: node tools/og/make-og.mjs（別途用意したブラウザを使うときは PW_CHROMIUM_PATH=/path/to/chrome を付ける）
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const html = new URL('./og-image.html', import.meta.url).href;
const out = fileURLToPath(new URL('../../public/og-image.png', import.meta.url));
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(html);
await page.screenshot({ path: out });
await browser.close();
console.log(`wrote ${out}`);

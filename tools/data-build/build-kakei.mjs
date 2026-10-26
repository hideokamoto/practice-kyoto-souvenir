// 家計調査 都市別ランキング（総務省統計局）の xlsx から public/data/kakei.json を作る。
// 実行: node tools/data-build/build-kakei.mjs
// 入力: tools/data-build/raw/kakei/rank01.xlsx〜rank14.xlsx
//   取得元: https://www.stat.go.jp/data/kakei/5.html（https://www.stat.go.jp/data/kakei/zuhyou/rankNN.xlsx）
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ExcelJS from 'exceljs';
import { buildKakeiData } from './lib/kakei.mjs';

const RAW_DIR = fileURLToPath(new URL('./raw/kakei/', import.meta.url));
const OUT = fileURLToPath(new URL('../../public/data/kakei.json', import.meta.url));
/** raw/kakei/ の xlsx を取得した日 */
export const RETRIEVED_AT = '2026-10-25';

function cellValue(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'object') {
    if ('result' in v) return v.result ?? null; // 数式
    if ('richText' in v) return v.richText.map((t) => t.text).join('');
    if ('text' in v) return v.text;
  }
  return v;
}

/** xlsx の 1 枚目のシートを rows[行][列]（0 始まり）にする。 */
async function readSheet(path) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.worksheets[0];
  const rows = [];
  ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const cells = [];
    // row.values は 1 始まり（[0] は空）
    const values = Array.isArray(row.values) ? row.values : [];
    for (let c = 1; c < values.length; c++) cells[c - 1] = cellValue(values[c]);
    rows[rowNumber - 1] = cells;
  });
  for (let r = 0; r < rows.length; r++) rows[r] ??= [];
  return { group: ws.name.trim(), rows };
}

export async function loadKakei(dir = RAW_DIR, { retrievedAt = RETRIEVED_AT } = {}) {
  const files = readdirSync(dir)
    .filter((f) => /^rank\d{2}\.xlsx$/.test(f))
    .sort();
  if (files.length === 0) throw new Error(`${dir} に rankNN.xlsx がありません`);
  const sheets = [];
  for (const f of files) sheets.push(await readSheet(join(dir, f)));
  return buildKakeiData(sheets, { retrievedAt });
}

async function main() {
  const { skipped, ...data } = await loadKakei();
  mkdirSync(fileURLToPath(new URL('../../public/data/', import.meta.url)), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${OUT}: ${data.items.length} items (${data.period})`);
  if (skipped.length) {
    console.log(`skipped ${skipped.length} (同値で順位が決まらない):`);
    for (const s of skipped) console.log(`  ${s.group}/${s.item}/${s.measure}: ${s.reason}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

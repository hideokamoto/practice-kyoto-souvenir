// 京の産業（都道府県別の指標）の原資料から public/data/sangyo.json を作る。
// 実行: node tools/data-build/build-sangyo.mjs
// 入力: tools/data-build/raw/sangyo/
//   nta-sake-r07-04.pdf / nta-sake-r07-04.txt
//     国税庁「酒類製造業及び酒類卸売業の概況（令和7年アンケート）」の 04.pdf（清酒製造業）
//     https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seizo_oroshiuri/r07/pdf/04.pdf
//     .txt は `pdftotext -layout nta-sake-r07-04.pdf nta-sake-r07-04.txt`（poppler）で作ったもの。
//     ビルドは .txt だけを読むので、CI に poppler は要らない。
//   maff-yasai-r6/*.xlsx
//     農林水産省「令和6年産 地域特産野菜生産状況調査」表2（品目ごと 1 ファイル）。e-Stat から取得
//     https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&lid=000001484235
//     （000040469178.xlsx は全国表なので読まない。gaiyo.pdf は記号の定義を確かめた「利用者のために」）
//   bunka-shitei-94443301_01.xlsx
//     文化庁「国宝・重要文化財等都道府県別指定件数一覧 1．国宝・重要文化財」
//     https://www.bunka.go.jp/seisaku/bunkazai/shokai/excel/94443301_01.xlsx
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ExcelJS from 'exceljs';
import { parseNtaSakeTable, parseMaffSheet, parseBunkaSheet, buildSangyoData, rankOf } from './lib/sangyo.mjs';

const RAW_DIR = fileURLToPath(new URL('./raw/sangyo/', import.meta.url));
const OUT = fileURLToPath(new URL('../../public/data/sangyo.json', import.meta.url));
/** raw/sangyo/ の原資料を取得した日 */
export const RETRIEVED_AT = '2026-10-25';
const MAFF_NATIONAL_TABLE = '000040469178.xlsx';

function cellValue(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'object') {
    if ('result' in v) return v.result ?? null;
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
    const values = Array.isArray(row.values) ? row.values : [];
    const cells = [];
    for (let c = 1; c < values.length; c++) cells[c - 1] = cellValue(values[c]);
    rows[rowNumber - 1] = cells;
  });
  for (let r = 0; r < rows.length; r++) rows[r] ??= [];
  return { name: ws.name.trim(), rows };
}

export async function loadSangyo(dir = RAW_DIR, { retrievedAt = RETRIEVED_AT } = {}) {
  const nta = parseNtaSakeTable(readFileSync(join(dir, 'nta-sake-r07-04.txt'), 'utf8'));

  const maffDir = join(dir, 'maff-yasai-r6');
  const maff = [];
  for (const f of readdirSync(maffDir).filter((f) => f.endsWith('.xlsx') && f !== MAFF_NATIONAL_TABLE).sort()) {
    const { name, rows } = await readSheet(join(maffDir, f));
    maff.push(parseMaffSheet(name, rows));
  }

  const { rows: bunkaRows } = await readSheet(join(dir, 'bunka-shitei-94443301_01.xlsx'));
  const bunka = parseBunkaSheet(bunkaRows);

  return buildSangyoData({ nta, maff, bunka, retrievedAt });
}

async function main() {
  const data = await loadSangyo();
  mkdirSync(fileURLToPath(new URL('../../public/data/', import.meta.url)), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${OUT}: ${data.indicators.length} indicators`);
  for (const ind of data.indicators) {
    const k = rankOf(ind.values, '京都府');
    const kv = ind.values.find((v) => v.pref === '京都府').value;
    console.log(
      `  ${ind.id}: ${ind.values.length} 都道府県 / 1位 ${ind.values[0].pref} ${ind.values[0].value}${ind.unit} / 京都府 ${k}位 ${kv}${ind.unit}`,
    );
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

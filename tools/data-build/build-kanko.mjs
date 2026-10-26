// 京都府「観光施設一覧」（BODIK 掲載の推奨データセット）から、京都市内の施設を public/data/kanko.json にする。
// 実行: node tools/data-build/build-kanko.mjs
// 入力: tools/data-build/raw/kyoto-pref-kanko-shisetsu.csv
//   取得元: https://data.bodik.jp/dataset/260002_kankou_shisetsu（CSV「260002kankoushisetsu.csv」、最終更新 2022-04-18）
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeText, parseCsvObjects } from './lib/csv.mjs';
import { buildKanko } from './lib/navi.mjs';

export const KANKO_META = {
  id: 'kyoto-kanko',
  title: '観光施設一覧（京都府観光連盟「京都府観光ガイド」掲載スポット）',
  publisher: '京都府',
  url: 'https://data.bodik.jp/dataset/260002_kankou_shisetsu',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/deed.ja',
  retrievedAt: '2026-10-25',
  note:
    '京都府の推奨データセット「観光施設一覧」（2022-04-18 更新）を加工して作成。京都市内で緯度経度と説明文があるものを抽出し、同名の施設は 1 件にまとめた。',
};

function main() {
  const rows = parseCsvObjects(
    decodeText(readFileSync(new URL('./raw/kyoto-pref-kanko-shisetsu.csv', import.meta.url))),
  );
  const items = buildKanko(rows);
  const outDir = fileURLToPath(new URL('../../public/data/', import.meta.url));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(`${outDir}kanko.json`, JSON.stringify({ meta: [KANKO_META], items }, null, 1) + '\n');
  const byWard = items.reduce((m, x) => ((m[x.ward] = (m[x.ward] ?? 0) + 1), m), {});
  console.log(`kanko: ${rows.length} rows -> ${items.length} items`, byWard);
}

main();

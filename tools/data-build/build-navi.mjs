// 京都観光Navi（京都市オープンデータ）の CSV から public/data/meisho.json と omiyage.json を作る。
// 実行: node tools/data-build/build-navi.mjs
// 入力: tools/data-build/raw/kyoto-navi-mimono.csv（京都観光見もの情報）
//       tools/data-build/raw/kyoto-navi-omiyage.csv（京都観光お土産情報）
//   旧アプリの assets/sights/DSIGHT_1.csv・assets/souvenirs/DSOURVENIR_0.csv を移したもの（内容は同一）。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { decodeText, parseCsv } from './lib/csv.mjs';
import { buildMeisho, buildOmiyage } from './lib/navi.mjs';

const raw = (f) => decodeText(readFileSync(new URL(`./raw/${f}`, import.meta.url)));
const out = (f) => fileURLToPath(new URL(`../../public/data/${f}`, import.meta.url));

export const NAVI_META = {
  id: 'kyoto-navi',
  title: '京都観光Navi（京都観光見もの情報・京都観光お土産情報）',
  publisher: '京都市',
  url: 'https://data.city.kyoto.lg.jp/',
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/deed.ja',
  // 旧アプリが取り込んだ CSV（ポータルの最終更新 2021-03-26）。2026-10-25 時点でポータルは応答しない。
  retrievedAt: '2021-03-26',
  note:
    '京都市オープンデータポータルサイト「KYOTO OPEN DATA」のデータセット「京都観光Navi」を加工して作成。' +
    '説明文から交通案内等を除き、分類コードから種類、説明文の定型句から時代と国宝・重要文化財の別、住所から区を取り出した。' +
    '内容はデータ公開時点（2021年3月）のもの。',
};

function main() {
  const meisho = buildMeisho(parseCsv(raw('kyoto-navi-mimono.csv')));
  const omiyage = buildOmiyage(parseCsv(raw('kyoto-navi-omiyage.csv')));
  mkdirSync(out(''), { recursive: true });
  writeFileSync(out('meisho.json'), JSON.stringify({ meta: [NAVI_META], items: meisho }, null, 1) + '\n');
  writeFileSync(out('omiyage.json'), JSON.stringify({ meta: [NAVI_META], items: omiyage }, null, 1) + '\n');
  const count = (xs, k) => xs.reduce((m, x) => ((m[x[k] ?? 'null'] = (m[x[k] ?? 'null'] ?? 0) + 1), m), {});
  console.log(`meisho: ${meisho.length}`, count(meisho, 'genre'));
  console.log('  era', count(meisho, 'era'));
  console.log('  designation', count(meisho, 'designation'));
  console.log('  ward', count(meisho, 'ward'));
  console.log(`omiyage: ${omiyage.length}`, count(omiyage, 'genre'));
}

main();

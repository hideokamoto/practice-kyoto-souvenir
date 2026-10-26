// 家計調査 都市別ランキング（総務省統計局）のパーサのテスト。
// 実行: node --test tools/data-build/kakei.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizePeriod, parseUnit, parseSheet, buildKakeiData } from './lib/kakei.mjs';
import { loadKakei } from './build-kakei.mjs';

const RAW_DIR = fileURLToPath(new URL('./raw/kakei/', import.meta.url));

// 実ファイル rank01.xlsx（穀類）の見出し構造を写した小さな表。
// 1 行目: 期間 / 3 行目: 品目名（金額・数量の 2 組に同じ名前） / 4 行目: 単位 / 5 行目〜: 順位, 都市, 値, 都市, 値 …
// 列は「都市, 値」の 2 列 1 組。品目名と単位は都市の列（値の左）に入る。
function fixture({ kyotoAt = 3, cities = 5 } = {}) {
  const names = [null, '穀類', null, 'パン', null, 'パン', null];
  const units = [
    null,
    '----------<金　額>-',
    null,
    '----------<金　額>-',
    null,
    '--------<数量：　ｇ>-',
    null,
  ];
  const others = ['堺市', '浜松市', '神戸市', '奈良市', '大津市', '大阪市'];
  const rows = [
    ['2023年（令和５年）～2025年（令和７年）平均'],
    [],
    names,
    units,
    [0, '全国', 91820, '全国', 34242, '全国', 42398],
  ];
  let o = 0;
  for (let rank = 1; rank <= cities; rank++) {
    const city = rank === kyotoAt ? '京都市' : others[o++];
    // 値は順位が下がるほど小さくする（同値を作らない）
    rows.push([rank, city, 1000 - rank, city, 500 - rank, city, 200 - rank]);
  }
  return rows;
}

test('normalizePeriod は全角数字を半角にする', () => {
  assert.equal(
    normalizePeriod('2023年（令和５年）～2025年（令和７年）平均'),
    '2023年（令和5年）～2025年（令和7年）平均',
  );
});

test('parseUnit は金額と数量の見出しを measure と unit に分ける', () => {
  assert.deepEqual(parseUnit('----------<金　額>-'), { measure: 'amount', unit: '円' });
  assert.deepEqual(parseUnit('--------<数量：　ｇ>-'), { measure: 'quantity', unit: 'g' });
  assert.deepEqual(parseUnit('--------<数量：ｋｇ>-'), { measure: 'quantity', unit: 'kg' });
  assert.deepEqual(parseUnit('--------<数量：ｍｌ>-'), { measure: 'quantity', unit: 'ml' });
  assert.deepEqual(parseUnit('--------<数量：ℓ>-'), { measure: 'quantity', unit: 'L' });
  assert.deepEqual(parseUnit('--------<数量：丁>-'), { measure: 'quantity', unit: '丁' });
  assert.deepEqual(parseUnit('--------<数量：kWh>-'), { measure: 'quantity', unit: 'kWh' });
  assert.deepEqual(parseUnit('--------<数量：㎥>-'), { measure: 'quantity', unit: 'm³' });
  assert.equal(parseUnit('なにか別の文字列'), null);
});

test('parseSheet は品目名と単位を同じ組の列で対応させる', () => {
  const { items } = parseSheet(fixture(), '穀類');
  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((i) => [i.item, i.measure, i.unit]),
    [
      ['穀類', 'amount', '円'],
      ['パン', 'amount', '円'],
      ['パン', 'quantity', 'g'],
    ],
  );
  const pan = items[1];
  assert.equal(pan.group, '穀類');
  assert.equal(pan.kyotoRank, 3);
  assert.equal(pan.kyotoValue, 497);
  assert.deepEqual(pan.top, { city: '堺市', value: 499 });
  assert.equal(pan.cities, 5);
});

test('parseSheet は全国の行（順位 0）を順位に数えない', () => {
  const { items } = parseSheet(fixture({ kyotoAt: 1 }), '穀類');
  assert.equal(items[0].kyotoRank, 1);
  assert.deepEqual(items[0].top, { city: '京都市', value: 999 });
});

test('parseSheet は期間を 1 行目から取る', () => {
  assert.equal(parseSheet(fixture(), '穀類').period, '2023年（令和5年）～2025年（令和7年）平均');
});

test('parseSheet は品目名が無い列を捨てる', () => {
  const rows = fixture();
  rows[2] = [...rows[2]];
  rows[2][5] = null; // パン（数量）の品目名を消す
  const { items } = parseSheet(rows, '穀類');
  assert.deepEqual(
    items.map((i) => `${i.item}:${i.measure}`),
    ['穀類:amount', 'パン:amount'],
  );
});

test('parseSheet は 1 位が同値で並ぶ品目と、京都市が前後と同値の品目を除き、除いた理由を返す', () => {
  const rows = fixture();
  rows[5] = [...rows[5]];
  rows[6] = [...rows[6]];
  rows[6][2] = rows[5][2]; // 穀類（金額）: 1 位と 2 位を同値にする
  rows[8] = [...rows[8]];
  rows[8][4] = rows[7][4]; // パン（金額）: 京都市（3 位）と 4 位を同値にする
  const { items, skipped } = parseSheet(rows, '穀類');
  assert.deepEqual(
    items.map((i) => `${i.item}:${i.measure}`),
    ['パン:quantity'],
  );
  assert.deepEqual(
    skipped.map((s) => `${s.item}:${s.measure}:${s.reason}`),
    ['穀類:amount:top-tie', 'パン:amount:kyoto-tie'],
  );
});

test('parseSheet は京都市が載っていない列があれば例外にする', () => {
  const rows = fixture().map((r) => r.map((c) => (c === '京都市' ? '大阪市' : c)));
  assert.throws(() => parseSheet(rows, '穀類'), /京都市/);
});

test('buildKakeiData は期間が食い違うシートを例外にする', () => {
  const a = fixture();
  const b = fixture();
  b[0] = ['2022年（令和４年）～2024年（令和６年）平均'];
  assert.throws(
    () =>
      buildKakeiData(
        [
          { group: '穀類', rows: a },
          { group: '肉類', rows: b },
        ],
        { retrievedAt: '2026-10-25' },
      ),
    /期間/,
  );
});

test('buildKakeiData は meta を 1 件だけ持ち、出典と利用規約を書く', () => {
  const data = buildKakeiData([{ group: '穀類', rows: fixture() }], {
    retrievedAt: '2026-10-25',
  });
  assert.equal(data.meta.length, 1);
  const m = data.meta[0];
  assert.equal(m.id, 'kakei');
  assert.equal(m.publisher, '総務省統計局');
  assert.equal(m.url, 'https://www.stat.go.jp/data/kakei/5.html');
  assert.match(m.license, /公共データ利用規約/);
  assert.equal(m.licenseUrl, 'https://www.stat.go.jp/info/riyou.html');
  assert.equal(m.retrievedAt, '2026-10-25');
  assert.ok(m.note.length > 0);
  assert.equal(data.period, '2023年（令和5年）～2025年（令和7年）平均');
  assert.equal(data.items.length, 3);
});

// ---- 実ファイルを読む統合テスト ----

const hasRaw = existsSync(`${RAW_DIR}rank01.xlsx`);

test('実ファイル: 14 シートすべてを読み、どの品目も 52 都市の順位表になっている', { skip: !hasRaw }, async () => {
  const data = await loadKakei(RAW_DIR, { retrievedAt: '2026-10-25' });
  const groups = new Set(data.items.map((i) => i.group));
  assert.equal(groups.size, 14);
  assert.ok(data.items.length > 300, `items=${data.items.length}`);
  for (const i of data.items) {
    assert.equal(i.cities, 52, `${i.group}/${i.item}/${i.measure}`);
    assert.ok(i.kyotoRank >= 1 && i.kyotoRank <= i.cities);
    assert.ok(Number.isFinite(i.kyotoValue));
    assert.ok(i.item.length > 0);
    assert.ok(i.unit.length > 0);
  }
  assert.equal(data.period, '2023年（令和5年）～2025年（令和7年）平均');
});

test('実ファイル: 先の粗解析でずれていた「パン」の金額と数量が正しく対応している', { skip: !hasRaw }, async () => {
  const data = await loadKakei(RAW_DIR, { retrievedAt: '2026-10-25' });
  const pan = data.items.filter((i) => i.group === '穀類' && i.item === 'パン');
  assert.deepEqual(
    pan.map((p) => p.measure).sort(),
    ['amount', 'quantity'],
  );
  const amount = pan.find((p) => p.measure === 'amount');
  // rank01.xlsx の 8 列目（H 列）〜 9 列目（I 列）: 1 位 神戸市 41967、京都市 3 位 39347
  assert.equal(amount.unit, '円');
  assert.deepEqual(amount.top, { city: '神戸市', value: 41967 });
  assert.equal(amount.kyotoRank, 3);
  assert.equal(amount.kyotoValue, 39347);
  const quantity = pan.find((p) => p.measure === 'quantity');
  assert.equal(quantity.unit, 'g');
});

test('実ファイル: 同じ group・item・measure の組は重複しない', { skip: !hasRaw }, async () => {
  const data = await loadKakei(RAW_DIR, { retrievedAt: '2026-10-25' });
  const keys = data.items.map((i) => `${i.group}/${i.item}/${i.measure}`);
  assert.equal(new Set(keys).size, keys.length);
});

// 京の産業（都道府県別の指標）のパーサのテスト。
// 実行: node --test tools/data-build/sangyo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  PREFECTURES,
  prefFromShort,
  rankOf,
  excelSerialToDate,
  parseNtaSakeTable,
  parseMaffSheet,
  parseBunkaSheet,
  toIndicator,
  buildSangyoData,
} from './lib/sangyo.mjs';
import { loadSangyo } from './build-sangyo.mjs';

const RAW_DIR = fileURLToPath(new URL('./raw/sangyo/', import.meta.url));

test('PREFECTURES は 47 都道府県', () => {
  assert.equal(PREFECTURES.length, 47);
  assert.equal(new Set(PREFECTURES).size, 47);
  assert.ok(PREFECTURES.includes('京都府'));
});

test('prefFromShort: 空白入りの略称を正式名にする', () => {
  assert.equal(prefFromShort('京　都'), '京都府');
  assert.equal(prefFromShort('京   都'), '京都府');
  assert.equal(prefFromShort('北 海 道'), '北海道');
  assert.equal(prefFromShort('東京'), '東京都');
  assert.equal(prefFromShort('大　阪'), '大阪府');
  assert.equal(prefFromShort('神奈川'), '神奈川県');
  assert.equal(prefFromShort('鹿 児 島'), '鹿児島県');
  assert.equal(prefFromShort('京都府'), '京都府');
});

test('prefFromShort: 都道府県でないものは null', () => {
  assert.equal(prefFromShort('補　遺'), null);
  assert.equal(prefFromShort('全国'), null);
  assert.equal(prefFromShort('合計'), null);
  assert.equal(prefFromShort(''), null);
  assert.equal(prefFromShort(null), null);
});

test('rankOf: 同値は同順位（1, 2, 2, 4）', () => {
  const values = [
    { pref: 'A', value: 10 },
    { pref: 'B', value: 5 },
    { pref: 'C', value: 5 },
    { pref: 'D', value: 1 },
  ];
  assert.equal(rankOf(values, 'A'), 1);
  assert.equal(rankOf(values, 'C'), 2);
  assert.equal(rankOf(values, 'D'), 4);
  assert.equal(rankOf(values, 'Z'), null);
});

test('excelSerialToDate: 46296 は 2026-10-01', () => {
  assert.equal(excelSerialToDate(46296), '2026-10-01');
});

// pdftotext -layout の出力（令和7年アンケート 04.pdf 表20）を写したもの。
// 国税局名が都道府県名と同じ行に入る行（「金 沢 石 川」「広 島 岡 山」）、局名だけの行、秘匿（X）、該当なし（-）を含む。
const NTA_TEXT = [
  '１   清酒製造業',
  '表 20     都道府県別の回答者数及び取引状況',
  '                               国内(A)                   輸出(B)                輸出割合 (B/(A+B))',
  '局所名     都道府県別   事業者数',
  '                   者              kl      百万円             kl       百万円            ％            ％',
  '札   幌   北 海 道      14         3,143        4,165          181        261          5.4          5.9',
  '        新   潟      86        33,053       35,679      1,745        1,701          5.0          4.5',
  '金   沢   石   川      22         4,358        5,157           88        179          2.0          3.4',
  '        京   都      37        86,078       46,840      3,236        1,887          3.6          3.9',
  '大   阪',
  '        兵   庫      57        77,780       42,417      6,754        3,947          8.0          8.5',
  '広   島   岡   山      33         1,828        2,149           66         84          3.5          3.8',
  '        宮   崎          2            X          X            X          X            X            X',
  '沖   縄   沖   縄          -            -          -            -          -            -            -',
  '                                                     25',
  '表 21    清酒製造業の欠損及び低収益事業者数',
  '清酒製造業者                 1,233       100.0',
].join('\n');

test('parseNtaSakeTable: 表20の都道府県行だけを読む', () => {
  const rows = parseNtaSakeTable(NTA_TEXT);
  assert.deepEqual(
    rows.map((r) => r.pref),
    ['北海道', '新潟県', '石川県', '京都府', '兵庫県', '岡山県', '宮崎県', '沖縄県'],
  );
  const kyoto = rows.find((r) => r.pref === '京都府');
  assert.deepEqual(kyoto, {
    pref: '京都府',
    respondents: 37,
    domesticVolume: 86078,
    domesticSales: 46840,
    exportVolume: 3236,
    exportSales: 1887,
  });
});

test('parseNtaSakeTable: X と - は値なし（null）', () => {
  const rows = parseNtaSakeTable(NTA_TEXT);
  const miyazaki = rows.find((r) => r.pref === '宮崎県');
  assert.equal(miyazaki.respondents, 2);
  assert.equal(miyazaki.domesticVolume, null);
  const okinawa = rows.find((r) => r.pref === '沖縄県');
  assert.equal(okinawa.respondents, null);
  assert.equal(okinawa.domesticVolume, null);
});

test('parseNtaSakeTable: 表20が無ければ例外', () => {
  assert.throws(() => parseNtaSakeTable('表 21 なにか'), /表 ?20/);
});

// 地域特産野菜生産状況調査 表2（とうがらし（辛味種））の構造を写した小さな表。
function maffFixture() {
  const rows = [
    [null, null, null, null, null],
    [null, '２　令和６年産都道府県別の作付面積、収穫量及び出荷量', null, null, null],
    [null, ' (4)  香辛野菜及びつまもの類', null, null, null],
    [null, '　　ウ　とうがらし（辛味種）', null, null, null],
    [null, null, null, null, null],
    [null, '全　　　国\n・\n都道府県', '作付面積', '収穫量', '出荷量'],
    [null, null, null, null, null],
    [null, null, 'ha', 'ｔ', 'ｔ'],
    [null, '全国', 68, 227, 212],
    [null, '（都道府県）', null, null, null],
  ];
  const body = {
    北海道: '-',
    千葉: 22,
    京都: 35,
    大阪: 1,
    大分: 56,
    滋賀: 0,
    青森: '…',
    岩手: 'x',
  };
  for (const [k, v] of Object.entries(body)) rows.push([null, k, null, v, null]);
  return rows;
}

test('parseMaffSheet: 収穫量の列を都道府県別に読む', () => {
  const r = parseMaffSheet('とうがらし（辛味種）', maffFixture());
  assert.equal(r.item, 'とうがらし（辛味種）');
  assert.equal(r.unit, 't');
  assert.equal(r.national, 227);
  assert.deepEqual(r.values[0], { pref: '大分県', value: 56 });
  assert.deepEqual(r.values[1], { pref: '京都府', value: 35 });
});

test('parseMaffSheet: 「－」は 0、「…」「x」は値なしとして除外する', () => {
  const r = parseMaffSheet('とうがらし（辛味種）', maffFixture());
  assert.deepEqual(r.values.find((v) => v.pref === '北海道'), { pref: '北海道', value: 0 });
  assert.equal(r.values.find((v) => v.pref === '青森県'), undefined);
  assert.equal(r.values.find((v) => v.pref === '岩手県'), undefined);
  assert.deepEqual(r.excluded.sort(), ['岩手県', '青森県']);
});

// 国宝・重要文化財都道府県別指定件数一覧の構造を写した小さな表（0 始まりの列）。
// 左半分: 0=都道府県, 1〜7=美術工芸品の分類, 8=美術工芸品計, 9=建造物件数, 10=建造物棟数, 11=国宝計
// 右半分: 13=都道府県, 14〜20=分類, 21=美術工芸品計, 22=建造物件数, 23=棟数, 24=重要文化財計
// 分類の列（1 と 14）に美術工芸品の件数を入れ、計の列（8, 11, 21, 24）には表と同じ計算結果を入れる。
function bunkaRow(name, k8, k9, k10, k11, j21, j22, j23, j24) {
  const r = new Array(26).fill(null);
  r[0] = name;
  r[1] = k8;
  r[14] = j21;
  r[8] = k8;
  r[9] = k9;
  r[10] = k10;
  r[11] = k11;
  r[13] = name;
  r[21] = j21;
  r[22] = j22;
  r[23] = j23;
  r[24] = j24;
  return r;
}

function bunkaFixture() {
  const head = new Array(26).fill(null);
  head[17] = 46296;
  head[23] = '現在';
  const cols = new Array(26).fill(null);
  cols[1] = '絵画';
  cols[8] = '計';
  cols[9] = '件数';
  cols[10] = '棟数';
  return [
    ['国 宝 ・ 重 要 文 化 財 都 道 府 県 別 指 定 件 数 一 覧'],
    [],
    ['１．国宝・重要文化財'],
    head,
    [],
    [],
    [],
    cols,
    bunkaRow('北海道', 2, null, null, 2, 31, 34, 85, 65),
    bunkaRow('京　都', 188, 54, 81, 242, 1932, 310, 764, 2242),
    bunkaRow('奈　良', 144, 64, 71, 208, 1072, 268, 439, 1340),
    bunkaRow('補　遺', 0, null, null, 0, 16, null, null, 16),
    bunkaRow(null, 0, null, null, 0, 0, null, null, 0),
    bunkaRow('合計', 334, 117, 151, 451, 3051, 611, 1287, 3662), // 二重計上の補正で和より 1 少ない
  ];
}

test('parseBunkaSheet: 都道府県行の国宝・重要文化財の件数を読む（空欄は 0）', () => {
  const r = parseBunkaSheet(bunkaFixture());
  assert.equal(r.asOf, '2026-10-01');
  assert.deepEqual(
    r.rows.map((x) => x.pref),
    ['北海道', '京都府', '奈良県'],
  );
  assert.deepEqual(r.rows[1], {
    pref: '京都府',
    kokuhoBijutsu: 188,
    kokuhoKenzobutsu: 54,
    kokuhoTotal: 242,
    jubunTotal: 2242,
  });
  assert.equal(r.rows[0].kokuhoKenzobutsu, 0);
  assert.deepEqual(r.totals, { kokuhoBijutsu: 334, kokuhoKenzobutsu: 117, kokuhoTotal: 451, jubunTotal: 3662 });
  assert.deepEqual(r.supplement, { kokuhoBijutsu: 0, kokuhoKenzobutsu: 0, kokuhoTotal: 0, jubunTotal: 16 });
});

test('parseBunkaSheet: 計の列が欠けていても分類の列から計算する', () => {
  const rows = bunkaFixture();
  rows[9][8] = { sharedFormula: 'I9' }; // exceljs で計算結果が欠けた共有数式
  rows[9][11] = null;
  const r = parseBunkaSheet(rows.map((row) => row.map((v) => (typeof v === 'object' && v !== null ? null : v))));
  assert.equal(r.rows[1].kokuhoBijutsu, 188);
  assert.equal(r.rows[1].kokuhoTotal, 242);
});

test('parseBunkaSheet: 分類の合計と表の計が食い違えば例外', () => {
  const rows = bunkaFixture();
  rows[9][11] = 999;
  assert.throws(() => parseBunkaSheet(rows), /一致しません/);
});

test('toIndicator: 値の大きい順に並べ、null を除く', () => {
  const ind = toIndicator(
    { id: 'x', label: 'X', unit: 'kl', period: 'p', source: 's' },
    [
      { pref: '京都府', value: 5 },
      { pref: '兵庫県', value: 9 },
      { pref: '宮崎県', value: null },
    ],
  );
  assert.deepEqual(ind.values, [
    { pref: '兵庫県', value: 9 },
    { pref: '京都府', value: 5 },
  ]);
  assert.equal(ind.id, 'x');
});

test('buildSangyoData: 京都府が 1〜3 位の野菜だけ指標にし、meta は使ったソースだけ', () => {
  const nta = parseNtaSakeTable(NTA_TEXT);
  const maff = [
    parseMaffSheet('とうがらし（辛味種）', maffFixture()),
    {
      item: 'くわい',
      unit: 't',
      national: 112,
      values: [
        { pref: '広島県', value: 79 },
        { pref: '埼玉県', value: 11 },
        { pref: '茨城県', value: 8 },
        { pref: '大阪府', value: 8 },
        { pref: '京都府', value: 0 },
      ],
      excluded: [],
    },
  ];
  const bunka = parseBunkaSheet(bunkaFixture());
  const data = buildSangyoData({ nta, maff, bunka, retrievedAt: '2026-10-25' });
  const ids = data.indicators.map((i) => i.id);
  assert.ok(ids.includes('maff-yasai-とうがらし（辛味種）'));
  assert.ok(!ids.includes('maff-yasai-くわい'));
  assert.ok(ids.includes('nta-sake-domestic-volume'));
  // アンケートの回答者数は製造業者数ではなく、出題すると誤解を招くので指標にしない
  assert.ok(!ids.includes('nta-sake-respondents'));
  assert.ok(ids.includes('bunka-kokuho-kenzobutsu'));
  for (const ind of data.indicators) {
    assert.ok(data.meta.some((m) => m.id === ind.source), `${ind.id} の出典が meta に無い`);
    assert.ok(ind.values.length > 0);
    for (let i = 1; i < ind.values.length; i++) assert.ok(ind.values[i - 1].value >= ind.values[i].value);
  }
  assert.deepEqual(data.meta.map((m) => m.id).sort(), ['bunka-shitei', 'maff-yasai', 'nta-sake']);
  for (const m of data.meta) {
    assert.equal(m.retrievedAt, '2026-10-25');
    assert.match(m.url, /^https:\/\//);
    assert.ok(m.license && m.note && m.title && m.publisher);
  }
});

// ---- 実データ（raw/sangyo/ がある環境だけ） ----

test('実データ: 全指標が 1 位単独・京都府を含み、原資料の値と一致する', { skip: !existsSync(RAW_DIR) }, async () => {
  const data = await loadSangyo(RAW_DIR, { retrievedAt: '2026-10-25' });
  const byId = Object.fromEntries(data.indicators.map((i) => [i.id, i]));

  // 清酒（令和7年アンケート 表20。pdftotext と目視で確認した値）
  const vol = byId['nta-sake-domestic-volume'];
  assert.deepEqual(vol.values[0], { pref: '京都府', value: 86078 });
  assert.deepEqual(vol.values[1], { pref: '兵庫県', value: 77780 });
  assert.equal(vol.values.length, 44); // 47 から宮崎・鹿児島（X）と沖縄（-）を除く
  const exp = byId['nta-sake-export-volume'];
  assert.deepEqual(exp.values[0], { pref: '兵庫県', value: 6754 });
  assert.equal(rankOf(exp.values, '京都府'), 2);

  // 地域特産野菜（京都府が 1〜3 位の品目は令和6年産ではとうがらし（辛味種）だけ）
  const yasai = data.indicators.filter((i) => i.source === 'maff-yasai');
  assert.deepEqual(yasai.map((i) => i.id), ['maff-yasai-とうがらし（辛味種）']);
  assert.deepEqual(yasai[0].values.slice(0, 2), [
    { pref: '大分県', value: 56 },
    { pref: '京都府', value: 35 },
  ]);

  // 国宝・重要文化財（令和8年10月1日現在）
  const ken = byId['bunka-kokuho-kenzobutsu'];
  assert.deepEqual(ken.values.slice(0, 2), [
    { pref: '奈良県', value: 64 },
    { pref: '京都府', value: 54 },
  ]);
  const total = byId['bunka-kokuho-total'];
  assert.equal(total.values.length, 47);
  assert.deepEqual(total.values.slice(0, 2), [
    { pref: '東京都', value: 293 },
    { pref: '京都府', value: 242 },
  ]);
  // 都道府県の値の和（表の合計は美術工芸品 916・建造物 234・計 1,150。建造物は 1 件が 2 府県で
  // 計上されていて、表の合計の数式が −1 で補正している。補遺は国宝 0 件）
  const sum = (id) => byId[id].values.reduce((a, v) => a + v.value, 0);
  assert.equal(sum('bunka-kokuho-bijutsu'), 916);
  assert.equal(sum('bunka-kokuho-kenzobutsu'), 235);
  assert.equal(sum('bunka-kokuho-total'), 1151);

  for (const ind of data.indicators) {
    assert.notEqual(rankOf(ind.values, '京都府'), null, `${ind.id} に京都府が無い`);
    assert.ok(ind.values.length < 2 || ind.values[0].value > ind.values[1].value, `${ind.id} の 1 位が同値`);
  }
});

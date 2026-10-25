// lib/shaji.mjs のテスト。フィクスチャは 2026-10-25 に取得した実応答（Wikidata SPARQL / Commons API）から切り出したもの。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildShaji,
  buildWardMap,
  classifyKind,
  isFreeLicense,
  parseCandidates,
  parseWkt,
  pickInception,
  stripHtml,
  toPhoto,
  worldHeritageStatus,
} from './lib/shaji.mjs';

const E = (q) => `http://www.wikidata.org/entity/${q}`;
const TEMPLE = E('Q5393308');
const SHRINE = E('Q845945');
const CASTLE = E('Q23413');

// ---------- 小さな関数 ----------

test('buildWardMap: P150 の行政区ラベルを「区」抜きの Ward にする', () => {
  const map = buildWardMap([
    { w: { value: E('Q580186') }, wLabel: { value: '右京区' } },
    { w: { value: E('Q1203862') }, wLabel: { value: '東山区' } },
  ]);
  assert.deepEqual(map, { Q580186: '右京', Q1203862: '東山' });
});

test('buildWardMap: 11 区以外のラベルが来たら例外', () => {
  assert.throws(() => buildWardMap([{ w: { value: E('Q1') }, wLabel: { value: '宇治市' } }]));
});

test('parseWkt: Point(経度 緯度) を {lat, lon} にする', () => {
  assert.deepEqual(parseWkt('Point(135.715939 35.019158)'), { lat: 35.019158, lon: 135.715939 });
  assert.equal(parseWkt('Point(abc)'), null);
});

test('classifyKind: ルートクラスが 1 種類のときだけ種別を返す', () => {
  assert.equal(classifyKind([TEMPLE]), 'tera');
  assert.equal(classifyKind([SHRINE]), 'jinja');
  assert.equal(classifyKind([CASTLE]), 'shiro');
  assert.equal(classifyKind([TEMPLE, CASTLE]), null); // 山科本願寺（寺院かつ城）
  assert.equal(classifyKind([]), null);
});

test('pickInception: 年精度（9）以上の値だけ使う', () => {
  assert.equal(pickInception([{ time: '0778-01-01T00:00:00Z', precision: 9, rank: 'normal' }]), 778);
  assert.equal(pickInception([{ time: '1397-04-16T00:00:00Z', precision: 11, rank: 'normal' }]), 1397);
  assert.equal(pickInception([{ time: '0800-01-01T00:00:00Z', precision: 7, rank: 'normal' }]), null); // 世紀
});

test('pickInception: preferred があればそれだけ、同順位で年が食い違えば null', () => {
  assert.equal(
    pickInception([
      { time: '0794-01-01T00:00:00Z', precision: 9, rank: 'normal' },
      { time: '0796-01-01T00:00:00Z', precision: 9, rank: 'preferred' },
    ]),
    796,
  );
  assert.equal(
    pickInception([
      { time: '0794-01-01T00:00:00Z', precision: 9, rank: 'normal' },
      { time: '0796-01-01T00:00:00Z', precision: 9, rank: 'normal' },
    ]),
    null,
  );
  assert.equal(
    pickInception([
      { time: '0796-01-01T00:00:00Z', precision: 9, rank: 'normal' },
      { time: '0796-05-01T00:00:00Z', precision: 11, rank: 'normal' },
    ]),
    796,
  );
  assert.equal(pickInception([{ time: '0796-01-01T00:00:00Z', precision: 9, rank: 'deprecated' }]), null);
  assert.equal(pickInception([]), null);
});

test('stripHtml: タグを除いて実体参照を戻し、空白を詰める', () => {
  assert.equal(
    stripHtml('<a href="https://ja.wikipedia.org/wiki/User:New_Japan" class="extiw">New Japan</a>'),
    'New Japan',
  );
  assert.equal(stripHtml('<span>A&amp;B</span>\n  &lt;c&gt; &#39;d&#39; &quot;e&quot;&nbsp;f'), "A&B <c> 'd' \"e\" f");
  assert.equal(stripHtml('&#x41;&#66;'), 'AB');
});

test('isFreeLicense: CC BY / CC BY-SA / CC0 / パブリックドメインだけ通す', () => {
  assert.equal(isFreeLicense({ code: 'cc-by-sa-3.0', shortName: 'CC BY-SA 3.0' }), true);
  assert.equal(isFreeLicense({ code: 'cc-by-4.0', shortName: 'CC BY 4.0' }), true);
  assert.equal(isFreeLicense({ code: 'cc0', shortName: 'CC0' }), true);
  assert.equal(isFreeLicense({ code: 'pd', shortName: 'Public domain' }), true);
  assert.equal(isFreeLicense({ code: '', shortName: 'Public domain' }), true);
  assert.equal(isFreeLicense({ code: 'cc-by-nc-sa-2.0', shortName: 'CC BY-NC-SA 2.0' }), false);
  assert.equal(isFreeLicense({ code: 'cc-by-nd-4.0', shortName: 'CC BY-ND 4.0' }), false);
  assert.equal(isFreeLicense({ code: '', shortName: 'GFDL' }), false);
  assert.equal(isFreeLicense({ code: '', shortName: '' }), false);
});

// ---------- Commons の imageinfo → Photo ----------

const KIYOMIZU_INFO = {
  thumburl:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e4/Kiyomizu-dera_in_Kyoto.jpg/960px-Kiyomizu-dera_in_Kyoto.jpg?utm_source=commons.wikimedia.org&utm_campaign=imageinfo&utm_content=thumbnail',
  thumbwidth: 800,
  thumbheight: 533,
  width: 3072,
  height: 2048,
  url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Kiyomizu-dera_in_Kyoto.jpg?utm_source=commons.wikimedia.org',
  descriptionurl: 'https://commons.wikimedia.org/wiki/File:Kiyomizu-dera_in_Kyoto.jpg',
  extmetadata: {
    Artist: {
      value:
        '<a href="https://ja.wikipedia.org/wiki/User:New_Japan" class="extiw" title="ja:User:New Japan">New Japan</a>',
    },
    LicenseShortName: { value: 'CC BY-SA 3.0' },
    LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0' },
    License: { value: 'cc-by-sa-3.0' },
  },
};

test('toPhoto: サムネイルを upload.wikimedia.org にそろえ、utm を外し、作者とライセンスを入れる', () => {
  assert.deepEqual(toPhoto(KIYOMIZU_INFO), {
    thumb:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Kiyomizu-dera_in_Kyoto.jpg/960px-Kiyomizu-dera_in_Kyoto.jpg',
    width: 960,
    height: 640,
    page: 'https://commons.wikimedia.org/wiki/File:Kiyomizu-dera_in_Kyoto.jpg',
    author: 'New Japan',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
  });
});

test('toPhoto: 元画像が小さくサムネイルが原寸のときは原寸の幅と高さ', () => {
  const info = {
    ...KIYOMIZU_INFO,
    thumburl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Small.jpg',
    width: 640,
    height: 480,
  };
  const photo = toPhoto(info);
  assert.equal(photo.thumb, 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Small.jpg');
  assert.equal(photo.width, 640);
  assert.equal(photo.height, 480);
});

test('toPhoto: 作者が空・非自由ライセンス・Wikimedia 以外のホストなら null', () => {
  const noArtist = { ...KIYOMIZU_INFO, extmetadata: { ...KIYOMIZU_INFO.extmetadata, Artist: { value: '<span> </span>' } } };
  assert.equal(toPhoto(noArtist), null);
  const nc = {
    ...KIYOMIZU_INFO,
    extmetadata: {
      ...KIYOMIZU_INFO.extmetadata,
      License: { value: 'cc-by-nc-2.0' },
      LicenseShortName: { value: 'CC BY-NC 2.0' },
    },
  };
  assert.equal(toPhoto(nc), null);
  assert.equal(toPhoto({ ...KIYOMIZU_INFO, thumburl: 'https://example.com/x/960px-a.jpg' }), null);
  assert.equal(toPhoto(undefined), null);
});

test('toPhoto: LicenseUrl が無ければ null を入れる（PD など）', () => {
  const pd = {
    ...KIYOMIZU_INFO,
    extmetadata: {
      Artist: { value: 'Unknown author' },
      LicenseShortName: { value: 'Public domain' },
      License: { value: 'pd' },
    },
  };
  assert.equal(toPhoto(pd).licenseUrl, null);
  assert.equal(toPhoto(pd).license, 'Public domain');
});

// ---------- 世界遺産 ----------

const SEVENTEEN = Array.from({ length: 17 }, (_, i) => `Q${1000 + i}`);

test('worldHeritageStatus: 構成資産が 17 件そろえば true/false、不足なら null', () => {
  const ok = worldHeritageStatus({ constituents: SEVENTEEN, umbrellas: [] });
  assert.equal(ok('Q1000', []), true);
  assert.equal(ok('Q9', []), false);
  const short = worldHeritageStatus({ constituents: SEVENTEEN.slice(0, 16), umbrellas: [] });
  assert.equal(short('Q1000', []), null);
  assert.equal(short('Q9', []), null);
});

test('worldHeritageStatus: 包括項目（本願寺など）や構成資産の一部は null（境界があいまいなので出題しない）', () => {
  const st = worldHeritageStatus({ constituents: SEVENTEEN, umbrellas: ['Q1627016'] });
  assert.equal(st('Q1627016', []), null);
  assert.equal(st('Q9', ['Q1000']), null); // 構成資産の塔頭など
  assert.equal(st('Q9', ['Q1627016']), null);
});

test('worldHeritageStatus: 構成資産は親が包括項目でも true（賀茂別雷神社 → 賀茂神社）', () => {
  const st = worldHeritageStatus({ constituents: SEVENTEEN, umbrellas: ['Q1306606'] });
  assert.equal(st('Q1000', ['Q1306606', 'Q874027']), true);
});

// ---------- SPARQL 行 → 候補 → Shaji ----------

const row = (q, label, extra = {}) => ({
  i: { value: E(q) },
  ...(label ? { label: { value: label } } : {}),
  roots: { value: extra.roots ?? TEMPLE },
  classes: { value: extra.classes ?? TEMPLE },
  coords: { value: extra.coords ?? 'Point(135.785 34.995)' },
  ...(extra.wards ? { wards: { value: extra.wards } } : {}),
  ...(extra.images ? { images: { value: extra.images } } : {}),
  ...(extra.parents ? { parents: { value: extra.parents } } : {}),
});

test('parseCandidates: GROUP_CONCAT の列を配列にし、欠けた列は空配列', () => {
  const [c] = parseCandidates([
    row('Q221716', '清水寺', {
      wards: E('Q1203862'),
      images: 'http://commons.wikimedia.org/wiki/Special:FilePath/Kiyomizu-dera%20in%20Kyoto.jpg',
    }),
  ]);
  assert.deepEqual(c, {
    qid: 'Q221716',
    label: '清水寺',
    roots: [TEMPLE],
    classes: [TEMPLE],
    coords: ['Point(135.785 34.995)'],
    wards: ['Q1203862'],
    images: ['File:Kiyomizu-dera in Kyoto.jpg'],
    parents: [],
  });
});

const WARD_MAP = { Q1203862: '東山', Q580186: '右京', Q1154970: '北' };

function build(rows, opts = {}) {
  return buildShaji({
    candidates: parseCandidates(rows),
    wardMap: WARD_MAP,
    inceptions: opts.inceptions ?? {},
    heritage: opts.heritage ?? { constituents: SEVENTEEN, umbrellas: [] },
    photos: opts.photos ?? {},
  });
}

test('buildShaji: 清水寺を Shaji 型にする', () => {
  const { items, excluded } = build(
    [
      row('Q1000', '清水寺', {
        wards: E('Q1203862'),
        images: 'http://commons.wikimedia.org/wiki/Special:FilePath/Kiyomizu-dera%20in%20Kyoto.jpg',
      }),
    ],
    {
      inceptions: { Q1000: [{ time: '0778-01-01T00:00:00Z', precision: 9, rank: 'normal' }] },
      photos: { 'File:Kiyomizu-dera in Kyoto.jpg': KIYOMIZU_INFO },
    },
  );
  assert.deepEqual(excluded, []);
  assert.deepEqual(items, [
    {
      qid: 'Q1000',
      name: '清水寺',
      kind: 'tera',
      ward: '東山',
      lat: 34.995,
      lon: 135.785,
      inception: 778,
      worldHeritage: true,
      photo: toPhoto(KIYOMIZU_INFO),
    },
  ]);
});

test('buildShaji: 除外ルール（ラベル無し・種別が複数・建物や境内社・廃寺・候補の一部）', () => {
  const { items, excluded } = build([
    row('Q1', null),
    row('Q2', '山科本願寺', { roots: `${TEMPLE}|${CASTLE}` }),
    row('Q3', '清水寺本堂', { classes: `${TEMPLE}|${E('Q17051413')}` }),
    row('Q4', '某摂社', { roots: SHRINE, classes: E('Q1071160') }),
    row('Q5', '某廃寺', { classes: E('Q11486287') }),
    row('Q6', '仁和寺', {}),
    row('Q7', '某塔頭', { classes: E('Q9769742'), parents: E('Q6') }),
    row('Q8', '大覚寺', { parents: E('Q99999') }), // 候補外の親（霊場の札所グループなど）は除外しない
  ]);
  assert.deepEqual(
    items.map((i) => i.qid),
    ['Q6', 'Q8'],
  );
  assert.deepEqual(
    excluded.map((e) => [e.qid, e.reason]),
    [
      ['Q1', 'no-ja-label'],
      ['Q2', 'ambiguous-kind'],
      ['Q3', 'building-or-subshrine'],
      ['Q4', 'building-or-subshrine'],
      ['Q5', 'abandoned'],
      ['Q7', 'part-of-candidate'],
    ],
  );
});

test('buildShaji: 世界遺産の包括項目（賀茂神社）は除外し、その一部である構成資産は残す', () => {
  const { items, excluded } = build(
    [
      row('Q1306606', '賀茂神社', { roots: SHRINE, classes: SHRINE, parents: E('Q874027') }),
      row('Q1000', '賀茂別雷神社', { roots: SHRINE, classes: SHRINE, parents: `${E('Q874027')}|${E('Q1306606')}` }),
      row('Q40', '某摂社', { roots: SHRINE, classes: SHRINE, parents: E('Q1306606') }),
    ],
    { heritage: { constituents: SEVENTEEN, umbrellas: ['Q1306606'] } },
  );
  assert.deepEqual(items.map((i) => [i.qid, i.worldHeritage]), [['Q40', null], ['Q1000', true]]);
  assert.deepEqual(excluded.map((e) => [e.qid, e.reason]), [['Q1306606', 'heritage-umbrella']]);
});

test('buildShaji: 構成資産から 500m 以内の寺社と塔頭は worldHeritage を null にする（境内の地主神社など、境界があいまい）', () => {
  const { items } = build([
    row('Q1000', '清水寺', { coords: 'Point(135.785 34.995)' }),
    row('Q60', '地主神社', { roots: SHRINE, classes: SHRINE, coords: 'Point(135.7853 34.9952)' }),
    row('Q61', '遠い寺', { coords: 'Point(135.70 35.05)' }),
    row('Q62', '某塔頭', { classes: `${TEMPLE}|${E('Q9769742')}`, coords: 'Point(135.60 35.10)' }),
  ]);
  assert.deepEqual(
    items.map((i) => [i.name, i.worldHeritage]),
    [
      ['地主神社', null],
      ['遠い寺', false],
      ['某塔頭', null],
      ['清水寺', true],
    ],
  );
});

test('buildShaji: 構成資産は他の候補の一部でも除外しない', () => {
  const { items } = build([row('Q50', '某大寺'), row('Q1001', '某構成資産', { parents: E('Q50') })]);
  assert.deepEqual(items.map((i) => i.qid), ['Q50', 'Q1001']);
});

test('buildShaji: 座標が 200m 以上食い違えば除外、近ければ先頭（辞書順）を使う', () => {
  const { items, excluded } = build([
    row('Q10', '法金剛院', { coords: 'Point(135.71594 35.01915)|Point(135.715939 35.019158)' }),
    row('Q11', '遠い寺', { coords: 'Point(135.70 35.00)|Point(135.75 35.05)' }),
  ]);
  assert.deepEqual(items.map((i) => [i.qid, i.lat, i.lon]), [['Q10', 35.019158, 135.715939]]);
  assert.deepEqual(excluded.map((e) => [e.qid, e.reason]), [['Q11', 'conflicting-coords']]);
});

test('buildShaji: 区は 1 つに決まるときだけ、写真は辞書順で先頭のファイル', () => {
  const info2 = { ...KIYOMIZU_INFO, descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg' };
  const { items } = build(
    [
      row('Q20', '某寺', {
        wards: `${E('Q1203862')}|${E('Q580186')}`,
        images:
          'http://commons.wikimedia.org/wiki/Special:FilePath/B.jpg|http://commons.wikimedia.org/wiki/Special:FilePath/A.jpg',
      }),
    ],
    { photos: { 'File:A.jpg': info2, 'File:B.jpg': KIYOMIZU_INFO } },
  );
  assert.equal(items[0].ward, null);
  assert.equal(items[0].photo.page, 'https://commons.wikimedia.org/wiki/File:A.jpg');
});

test('buildShaji: 同名は区を付けて区別し、区で区別できなければ除外', () => {
  const { items, excluded } = build([
    row('Q30', '地蔵院', { wards: E('Q580186') }),
    row('Q31', '地蔵院', { wards: E('Q1154970') }),
    row('Q32', '西方寺', { wards: E('Q580186') }),
    row('Q33', '西方寺', { wards: E('Q580186') }),
    row('Q34', '西方寺', {}),
  ]);
  assert.deepEqual(
    items.map((i) => [i.qid, i.name]),
    [
      ['Q30', '地蔵院（右京区）'],
      ['Q31', '地蔵院（北区）'],
    ],
  );
  assert.deepEqual(
    excluded.map((e) => [e.qid, e.reason]),
    [
      ['Q32', 'duplicate-name'],
      ['Q33', 'duplicate-name'],
      ['Q34', 'duplicate-name'],
    ],
  );
});

test('buildShaji: 曖昧さ回避の括弧（「(京都市)」など）は外し、同名になったら区を付ける', () => {
  const { items } = build([
    row('Q40', '大蓮寺 (京都市)', { wards: E('Q580186') }),
    row('Q41', '実相院 (左京区)', { wards: E('Q580186') }),
    row('Q42', '正法寺 (京都市)', { wards: E('Q580186') }),
    row('Q43', '正法寺', { wards: E('Q1154970') }),
    row('Q44', '西園寺 (京都市上京区)', { wards: E('Q1154970') }),
  ]);
  assert.deepEqual(
    items.map((i) => [i.qid, i.name]),
    [
      ['Q40', '大蓮寺'],
      ['Q41', '実相院'],
      ['Q42', '正法寺（右京区）'],
      ['Q43', '正法寺（北区）'],
      ['Q44', '西園寺'],
    ],
  );
});

test('buildShaji: 出力は qid の数値順で、同じ入力なら同じ出力', () => {
  const rows = [row('Q300', 'C寺'), row('Q20', 'B寺'), row('Q1000', 'A寺')];
  const a = build(rows).items.map((i) => i.qid);
  assert.deepEqual(a, ['Q20', 'Q300', 'Q1000']);
  assert.deepEqual(build([...rows].reverse()).items.map((i) => i.qid), a);
});

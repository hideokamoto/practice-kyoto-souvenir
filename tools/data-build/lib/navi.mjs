// 京都観光Navi（京都市オープンデータ）と京都府観光施設一覧を、アプリ用の形に変換する純粋関数。
// 列の意味は CSV にヘッダが無いため、値の並びから決めている（docs/open-data-survey.md 参照）。

const WARD_NAMES = ['上京', '左京', '中京', '東山', '下京', '右京', '伏見', '山科', '西京', '北', '南'];
const WARD_RE = new RegExp(`^(?:京都府)?(?:京都市)?(${WARD_NAMES.join('|')})区`);

/** 住所から京都市の区を取る。「京都市」が省かれた「東山区林下町400」の形も扱う。 */
export function parseWard(address) {
  const m = WARD_RE.exec((address ?? '').trim());
  return m ? m[1] : null;
}

const ERA = '飛鳥|奈良|平安|鎌倉|南北朝|室町|安土桃山|桃山|江戸|明治|大正|昭和';
const ERA_DES_RE = new RegExp(
  `にある(${ERA})時代(?:初期|前期|中期|後期|末期)?(?:建築|作)?の(国宝|重要文化財)`,
);
const DES_RE = /にある(国宝|重要文化財)(?:建造物|彫刻|絵画|工芸品)|^(国宝|重要文化財)$/;
const ERA_ANY_RE = new RegExp(`(${ERA})時代`, 'g');

/**
 * 説明文の最初の一文にある定型句（「〜にある桃山時代建築の国宝建造物」）から時代と指定を取る。
 * 一文に時代が 2 つ以上あると、どれが答えか決められないので時代も指定も取らない。
 */
export function extractEraDesignation(description) {
  const first = (description ?? '').split('。')[0].trim();
  const eras = first.match(ERA_ANY_RE) ?? [];
  if (eras.length > 1) return { era: null, designation: null };
  const m = ERA_DES_RE.exec(first);
  if (m) return { era: m[1] === '安土桃山' ? '桃山' : m[1], designation: m[2] };
  const d = DES_RE.exec(first);
  return { era: null, designation: d ? (d[1] ?? d[2]) : null };
}

/** 「●交通案内」などの付記を落とし、空行をまとめる。 */
export function cleanDescription(description) {
  const body = (description ?? '').split('●')[0];
  return body
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l !== '')
    .join('\n')
    .trim();
}

/** 「清水寺　本堂」→「清水寺」、「三十三間堂（蓮華王院）南大門」→「三十三間堂（蓮華王院）」 */
export function baseName(name) {
  if (name.includes('　')) return name.split('　')[0].trim();
  // 全角空白が無い「〇〇（別名）南大門」の形は、閉じ括弧の後ろに続く部分を落とす
  const m = /^(.+?[）＞])(?=.)/.exec(name);
  return m ? m[1] : name;
}

/** 名前・読みから、問題文で伏せる語の一覧を作る（長い語から順に置換するため長い順）。 */
export function maskTerms({ name, kana }) {
  const terms = new Set();
  const add = (s) => {
    for (const part of s.split(/[　\s、・]+/)) {
      const bare = part.replace(/[（(＜<][^）)＞>]*[）)＞>]/g, '');
      for (const t of [part, bare]) if (t.length >= 2) terms.add(t);
      for (const m of part.matchAll(/[（(＜<]([^）)＞>]+)[）)＞>]/g)) if (m[1].length >= 2) terms.add(m[1]);
    }
  };
  add(name);
  if (kana) add(kana);
  return [...terms].sort((a, b) => b.length - a.length);
}

// 美術品の名称に出る語。分類コード 2-2-3（建造物）にも絵画が混ざっているため、文化財は名称を先に見る。
// 「書」単独は「書院」（建造物）に当たるので使わない。
const KAIGA_RE = /絹本|紙本|図|画|額|障壁|墨蹟|和歌集|縁起|絵巻|経$/;
const KOGEIHIN_RE = /梵鐘|銅鐘|鐘$|灯籠|太鼓縁|釜|鏡|墓誌/;
const CHOKOKU_RE = /像/;

/** 京都観光Navi 見ものの分類コード（2〜4 列目）と名称から種類を決める。 */
export function meishoGenre([c1, c2, c3], name) {
  const key = `${c1}-${c2}-${c3}`;
  if ((c1 === '2' && c2 === '2') || key === '2-1-7') {
    if (KAIGA_RE.test(name)) return 'kaiga';
    if (KOGEIHIN_RE.test(name)) return 'kogeihin';
    if (CHOKOKU_RE.test(name)) return 'chokoku';
    return key === '2-2-3' || key === '2-1-7' ? 'kenzobutsu' : 'other';
  }
  const simple = {
    '2-3-1': 'meiboku',
    '2-5-1': 'geino',
    '3-4-1': 'bungaku',
    '8-1-1': 'chimei',
    '8-2-1': 'yama',
    '8-2-2': 'kawa',
    '8-2-3': 'mizu',
    '8-3-2': 'machinami',
    '8-5-1': 'komainu',
    '8-6-1': 'kofun',
  };
  if (simple[key]) return simple[key];
  if (c1 === '5' && c2 === '3') return 'shoku';
  if (key === '8-2-4') return /池$/.test(name) ? 'ike' : 'other';
  return 'other';
}

/** 京都観光Navi お土産の分類コード（5 列目）から種類を決める。 */
export function omiyageGenre(code) {
  const map = { 5050200: 'kogei', 5050100: 'meibutsu', 5050300: 'ryori' };
  const g = map[code];
  if (!g) throw new Error(`未知のお土産分類コード: ${code}`);
  return g;
}

export function toHiragana(s) {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

function assertUniqueIds(items) {
  const seen = new Set();
  for (const i of items) {
    if (seen.has(i.id)) throw new Error(`ID が重複しています: ${i.id}`);
    seen.add(i.id);
  }
  return items;
}

/** 京都観光見もの情報の CSV 行（配列）→ Meisho[] */
export function buildMeisho(rows) {
  const items = [];
  for (const r of rows) {
    const name = (r[8] ?? '').trim();
    const description = cleanDescription(r[12]);
    if (!name || !description) continue;
    const { era, designation } = extractEraDesignation(description);
    items.push({
      id: r[0].trim(),
      name,
      kana: (r[9] ?? '').trim(),
      base: baseName(name),
      description,
      genre: meishoGenre([r[1], r[2], r[3]], name),
      era,
      designation,
      ward: parseWard(r[17]),
    });
  }
  return assertUniqueIds(items);
}

/** 京都観光お土産情報の CSV 行（配列）→ Omiyage[] */
export function buildOmiyage(rows) {
  const items = [];
  for (const r of rows) {
    const name = (r[8] ?? '').trim();
    const description = cleanDescription(r[12]);
    if (!name || !description) continue;
    items.push({
      id: r[0].trim(),
      name,
      kana: (r[9] ?? '').trim(),
      description,
      genre: omiyageGenre(r[4].trim()),
    });
  }
  return assertUniqueIds(items);
}

// 京都市の範囲（緯度経度のおおよその外接矩形）。明らかに外れた座標を捨てるためだけに使う。
const KYOTO_CITY_BBOX = { latMin: 34.85, latMax: 35.33, lonMin: 135.55, lonMax: 135.95 };

/** 京都府観光施設一覧の CSV 行（ヘッダ付きのオブジェクト）→ Kanko[]（京都市内のみ） */
export function buildKanko(rows) {
  const items = [];
  const names = new Set();
  for (const r of rows) {
    const ward = parseWard(r['市区町村名']);
    const lat = Number.parseFloat(r['緯度']);
    const lon = Number.parseFloat(r['経度']);
    const description = cleanDescription(r['説明']);
    const name = (r['名称'] ?? '').trim();
    if (!ward || !name || !description || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const b = KYOTO_CITY_BBOX;
    if (lat < b.latMin || lat > b.latMax || lon < b.lonMin || lon > b.lonMax) continue;
    if (names.has(name)) continue;
    names.add(name);
    items.push({
      id: r['NO'].trim(),
      name,
      kana: toHiragana((r['名称_カナ'] ?? '').trim()),
      ward,
      lat,
      lon,
      description,
    });
  }
  return assertUniqueIds(items);
}

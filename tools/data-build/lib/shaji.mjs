// Wikidata（SPARQL）と Wikimedia Commons（imageinfo）の応答を、src/app/data/types.ts の Shaji 型に変換する純粋関数。
// ネットワークには触らない（取得とキャッシュは build-shaji.mjs）。

/** src/app/data/types.ts の WARDS と同じ並び。 */
export const WARDS = ['北', '上京', '左京', '中京', '東山', '下京', '南', '右京', '伏見', '山科', '西京'];

const ENTITY = 'http://www.wikidata.org/entity/';

/** P31/P279* でたどり着くルートクラス → 種別。 */
export const KIND_ROOTS = {
  [`${ENTITY}Q5393308`]: 'tera', // 仏教寺院
  [`${ENTITY}Q845945`]: 'jinja', // 神社
  [`${ENTITY}Q23413`]: 'shiro', // 城
};

/**
 * 寺社そのものではなく境内の建物・境内社として分類されている項目。
 * 写真問題で親の寺社と見分けがつかなくなるので出題対象から外す。
 */
export const BUILDING_OR_SUBSHRINE_CLASSES = new Set(
  [
    'Q17051413', // 本堂
    'Q11377515', // 仏堂
    'Q3192000', // 開山堂
    'Q11657414', // 阿弥陀堂
    'Q124684324', // 観音堂
    'Q11435234', // 大師堂
    'Q11622438', // 薬師堂
    'Q11644528', // 釈迦堂
    'Q17992799', // 持仏堂
    'Q1071160', // 摂末社
    'Q135009904', // 摂社
    'Q13479654', // 鎮守社
  ].map((q) => ENTITY + q),
);

/** 廃寺（現存しない寺院）。 */
export const ABANDONED_CLASSES = new Set([`${ENTITY}Q11486287`]);

/** 世界遺産「古都京都の文化財」の構成資産の件数（UNESCO 登録 688） */
export const WORLD_HERITAGE_COUNT = 17;

/** 塔頭（寺院の境内・周辺にある子院）。 */
export const TATCHU_CLASS = `${ENTITY}Q9769742`;

/** 構成資産からこの距離（m）以内の寺社は、構成資産の範囲に入るか判断できないので worldHeritage を null にする。 */
const NEAR_HERITAGE_M = 500;

/** 座標が複数あるとき、この距離（m）を超えて食い違えば除外する。 */
const COORD_TOLERANCE_M = 200;

const qidOf = (uri) => uri.slice(uri.lastIndexOf('/') + 1);
const split = (binding) => (binding?.value ? binding.value.split('|') : []);

export function buildWardMap(bindings) {
  const map = {};
  for (const b of bindings) {
    const label = b.wLabel?.value ?? '';
    const m = label.match(/^(.+)区$/);
    if (!m || !WARDS.includes(m[1])) throw new Error(`京都市の行政区ではないラベル: ${label}`);
    map[qidOf(b.w.value)] = m[1];
  }
  return map;
}

export function parseWkt(wkt) {
  const m = /^Point\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)$/.exec(wkt ?? '');
  if (!m) return null;
  return { lat: Number(m[2]), lon: Number(m[1]) };
}

export function classifyKind(roots) {
  const kinds = new Set(roots.map((r) => KIND_ROOTS[r]).filter(Boolean));
  return kinds.size === 1 ? [...kinds][0] : null;
}

function yearOf(time) {
  const m = /^([+-]?\d+)-/.exec(time);
  return m ? Number(m[1]) : null;
}

/** P571 の文の一覧から創建年を 1 つに決める。決められなければ null。 */
export function pickInception(statements) {
  const live = statements.filter((s) => s.rank !== 'deprecated');
  const preferred = live.filter((s) => s.rank === 'preferred');
  const pool = (preferred.length ? preferred : live).filter((s) => s.precision >= 9);
  const years = new Set(pool.map((s) => yearOf(s.time)).filter((y) => y !== null));
  return years.size === 1 ? [...years][0] : null;
}

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function stripHtml(html) {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, ent) => {
      if (ent[0] === '#') {
        const code = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : all;
      }
      return NAMED_ENTITIES[ent.toLowerCase()] ?? all;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** CC BY / CC BY-SA / CC0 / パブリックドメインだけを「表示して使ってよい」とみなす。 */
export function isFreeLicense({ code = '', shortName = '' }) {
  const both = `${code} ${shortName}`;
  if (/\bnc\b|non-?commercial|\bnd\b|no-?deriv/i.test(both)) return false;
  const c = code.trim().toLowerCase();
  if (/^cc-by(-sa)?(-\d(\.\d)?)?$/.test(c) || /^cc0/.test(c) || /^pd($|-)/.test(c)) return true;
  const s = shortName.trim();
  return /^CC[ -]BY(-SA)?( \d(\.\d)?)?$/i.test(s) || /^CC0/i.test(s) || /^Public domain$/i.test(s);
}

const COMMONS_HOSTS = new Set(['upload.wikimedia.org', 'thumb.wikimedia.org']);

/** Commons の imageinfo（extmetadata・url・size 付き）を Photo にする。使えなければ null。 */
export function toPhoto(info) {
  if (!info) return null;
  const em = info.extmetadata ?? {};
  const author = stripHtml(em.Artist?.value);
  const license = stripHtml(em.LicenseShortName?.value);
  const code = stripHtml(em.License?.value);
  if (!author || !license || !isFreeLicense({ code, shortName: license })) return null;

  let url;
  try {
    url = new URL(info.thumburl ?? info.url);
  } catch {
    return null;
  }
  if (!COMMONS_HOSTS.has(url.hostname) || !url.pathname.startsWith('/wikipedia/commons/')) return null;
  // 2026-10 時点の API は thumb.wikimedia.org を返すが、同じパスが upload.wikimedia.org でも配信される。
  // games.hidetaka.dev の CSP で許可するホストを 1 つにするため upload.wikimedia.org にそろえる。
  const thumb = `https://upload.wikimedia.org${url.pathname}`;

  if (!(info.width > 0 && info.height > 0)) return null;
  const px = /\/(\d+)px-[^/]+$/.exec(url.pathname);
  const width = px ? Number(px[1]) : info.width;
  const height = px ? Math.round((width * info.height) / info.width) : info.height;

  return {
    thumb,
    width,
    height,
    page: info.descriptionurl,
    author,
    license,
    licenseUrl: stripHtml(em.LicenseUrl?.value) || null,
  };
}

/**
 * 世界遺産「古都京都の文化財」の判定関数を返す。
 * constituents は構成資産（P527）の Q 番号。17 件そろわなければ常に null（欠けた一覧で false を付けない）。
 * umbrellas は P361 の逆引きにだけ出てくる包括項目（本願寺・賀茂神社など）。
 */
export function worldHeritageStatus({ constituents, umbrellas }) {
  const set = new Set(constituents);
  const unclear = new Set([...constituents, ...umbrellas]);
  const complete = set.size === WORLD_HERITAGE_COUNT;
  return (qid, parents) => {
    if (!complete) return null;
    if (set.has(qid)) return true;
    if (umbrellas.includes(qid)) return null;
    if (parents.some((p) => unclear.has(p))) return null;
    return false;
  };
}

export function parseCandidates(bindings) {
  return bindings.map((b) => ({
    qid: qidOf(b.i.value),
    label: b.label?.value ?? null,
    roots: split(b.roots),
    classes: split(b.classes),
    coords: split(b.coords),
    wards: split(b.wards).map(qidOf),
    images: split(b.images).map((u) => `File:${decodeURIComponent(u.slice(u.lastIndexOf('/') + 1))}`),
    parents: split(b.parents).map(qidOf),
  }));
}

function distanceM(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r;
  const dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

const byQid = (a, b) => Number(a.qid.slice(1)) - Number(b.qid.slice(1));

/**
 * 候補を Shaji の配列にする。除外した項目は理由付きで excluded に入れる。
 * @returns {{ items: object[], excluded: { qid: string, name: string | null, reason: string }[] }}
 */
/** 「大蓮寺 (京都市)」「実相院 (左京区)」→「大蓮寺」「実相院」。地名以外の括弧（別名など）は残す。 */
export function stripDisambiguation(name) {
  return name.replace(/\s*[（(](?:京都府)?(?:京都市)?(?:[^（）()]{1,3}区)?[)）]$/, '').trim();
}

export function buildShaji({ candidates, wardMap, inceptions, heritage, photos, sitelinks = {} }) {
  const allQids = new Set(candidates.map((c) => c.qid));
  const heritageOf = worldHeritageStatus(heritage);
  const umbrellas = new Set(heritage.umbrellas);
  const constituents = new Set(heritage.constituents);
  const excluded = [];
  const kept = [];

  for (const c of candidates) {
    const exclude = (reason) => excluded.push({ qid: c.qid, name: c.label, reason });
    if (!c.label) {
      exclude('no-ja-label');
      continue;
    }
    // 「賀茂神社」「本願寺」のような包括項目は、構成資産（上賀茂・下鴨、西本願寺）と重なるので出さない。
    if (umbrellas.has(c.qid)) {
      exclude('heritage-umbrella');
      continue;
    }
    const kind = classifyKind(c.roots);
    if (!kind) {
      exclude('ambiguous-kind');
      continue;
    }
    if (c.classes.some((cl) => BUILDING_OR_SUBSHRINE_CLASSES.has(cl))) {
      exclude('building-or-subshrine');
      continue;
    }
    if (c.classes.some((cl) => ABANDONED_CLASSES.has(cl))) {
      exclude('abandoned');
      continue;
    }
    // 構成資産そのものは、包括項目や他の寺社の一部として登録されていても残す。
    const isPartOfCandidate = c.parents.some((p) => p !== c.qid && allQids.has(p) && !umbrellas.has(p));
    if (!constituents.has(c.qid) && isPartOfCandidate) {
      exclude('part-of-candidate');
      continue;
    }
    const points = [...c.coords].sort().map(parseWkt);
    if (!points.length || points.some((p) => !p)) {
      exclude('no-coords');
      continue;
    }
    if (points.some((p) => distanceM(points[0], p) > COORD_TOLERANCE_M)) {
      exclude('conflicting-coords');
      continue;
    }
    const wards = new Set(c.wards.map((w) => wardMap[w]).filter(Boolean));
    const photo =
      [...c.images]
        .sort()
        .map((file) => toPhoto(photos[file]))
        .find(Boolean) ?? null;

    kept.push({
      qid: c.qid,
      name: c.label,
      kind,
      ward: wards.size === 1 ? [...wards][0] : null,
      lat: points[0].lat,
      lon: points[0].lon,
      inception: pickInception(inceptions[c.qid] ?? []),
      worldHeritage: heritageOf(c.qid, c.parents),
      photo,
      // 有名さの物差し: この項目の記事がある Wikipedia 等の言語版の数
      sitelinks: sitelinks[c.qid] ?? 0,
      tatchu: c.classes.includes(TATCHU_CLASS),
    });
  }

  // 構成資産の境内や隣接地にある寺社・塔頭は、構成資産に含まれるか一覧からは判断できない。
  // false のまま「世界遺産ではない」選択肢に使うと誤答になりうるので null にする。
  const heritageSites = kept.filter((i) => i.worldHeritage === true);
  for (const item of kept) {
    const near = heritageSites.some((h) => distanceM(h, item) <= NEAR_HERITAGE_M);
    if (item.worldHeritage === false && (item.tatchu || near)) item.worldHeritage = null;
    delete item.tatchu;
  }

  // Wikidata のラベルにある曖昧さ回避の括弧（「大蓮寺 (京都市)」「西園寺 (京都市上京区)」）は外す。
  for (const item of kept) item.name = stripDisambiguation(item.name);

  // 同名の寺社は区を付けて区別する。区で区別できなければ選択肢が重複しうるので除外する。
  const byName = new Map();
  for (const item of kept) byName.set(item.name, [...(byName.get(item.name) ?? []), item]);
  const items = [];
  for (const group of byName.values()) {
    if (group.length === 1) {
      items.push(group[0]);
      continue;
    }
    const wards = group.map((i) => i.ward);
    if (wards.every(Boolean) && new Set(wards).size === wards.length) {
      for (const i of group) items.push({ ...i, name: `${i.name}（${i.ward}区）` });
    } else {
      for (const i of group) excluded.push({ qid: i.qid, name: i.name, reason: 'duplicate-name' });
    }
  }
  const names = new Set(items.map((i) => i.name));
  if (names.size !== items.length) throw new Error('区を付けても名前が重複した');

  return { items: items.sort(byQid), excluded: excluded.sort(byQid) };
}

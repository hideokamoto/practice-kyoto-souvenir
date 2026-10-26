// 京都市内の寺院・神社・城を Wikidata と Wikimedia Commons から集めて public/data/shaji.json を作る。
//
//   node tools/data-build/build-shaji.mjs            # tools/data-build/raw/shaji/ のキャッシュがあれば使う
//   node tools/data-build/build-shaji.mjs --refresh  # 取り直してキャッシュを更新する
//
// Commons API は 1 秒以上の間隔で、429 のときは Retry-After に従って待つ。
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildShaji, buildWardMap, parseCandidates, WORLD_HERITAGE_COUNT } from './lib/shaji.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const RAW = join(HERE, 'raw', 'shaji');
const OUT = join(HERE, '..', '..', 'public', 'data', 'shaji.json');
const REFRESH = process.argv.includes('--refresh');
const UA = 'kyoto-ikezu-quiz-databuild/1.0 (https://github.com/hideokamoto/practice-kyoto-souvenir)';
const SPARQL = 'https://query.wikidata.org/sparql';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';

const KYOTO = 'wd:Q34600';
const WORLD_HERITAGE = 'wd:Q874027'; // 古都京都の文化財
const ROOTS = 'wd:Q5393308 wd:Q845945 wd:Q23413'; // 仏教寺院・神社・城

const QUERIES = {
  wards: `SELECT ?w ?wLabel WHERE { ${KYOTO} wdt:P150 ?w . SERVICE wikibase:label { bd:serviceParam wikibase:language "ja". } }`,
  heritageParts: `SELECT ?p WHERE { ${WORLD_HERITAGE} wdt:P527 ?p }`,
  heritagePartOf: `SELECT ?p WHERE { ?p wdt:P361 ${WORLD_HERITAGE} }`,
  items: `SELECT ?i ?label
  (GROUP_CONCAT(DISTINCT STR(?root); separator="|") AS ?roots)
  (GROUP_CONCAT(DISTINCT STR(?c); separator="|") AS ?classes)
  (GROUP_CONCAT(DISTINCT STR(?coord); separator="|") AS ?coords)
  (GROUP_CONCAT(DISTINCT STR(?ward); separator="|") AS ?wards)
  (GROUP_CONCAT(DISTINCT STR(?img); separator="|") AS ?images)
  (GROUP_CONCAT(DISTINCT STR(?parent); separator="|") AS ?parents)
WHERE {
  ?i wdt:P131/wdt:P131* ${KYOTO} .
  ?i wdt:P31 ?c . ?c wdt:P279* ?root .
  VALUES ?root { ${ROOTS} }
  ?i wdt:P625 ?coord .
  OPTIONAL { ?i rdfs:label ?label FILTER(LANG(?label) = "ja") }
  OPTIONAL { ?i wdt:P131/wdt:P131* ?ward . ${KYOTO} wdt:P150 ?ward . }
  OPTIONAL { ?i wdt:P18 ?img }
  OPTIONAL { ?i wdt:P361 ?parent }
}
GROUP BY ?i ?label`,
  sitelinks: `SELECT ?i ?n WHERE {
  ?i wdt:P131/wdt:P131* ${KYOTO} .
  ?i wdt:P31/wdt:P279* ?root .
  VALUES ?root { ${ROOTS} }
  ?i wikibase:sitelinks ?n .
}`,
  inceptions: `SELECT DISTINCT ?i ?time ?precision ?rank WHERE {
  ?i wdt:P131/wdt:P131* ${KYOTO} .
  ?i wdt:P31/wdt:P279* ?root .
  VALUES ?root { ${ROOTS} }
  ?i p:P571 ?st .
  ?st psv:P571 ?v ; wikibase:rank ?rank .
  ?v wikibase:timeValue ?time ; wikibase:timePrecision ?precision .
}`,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, init = {}) {
  for (let attempt = 1; attempt <= 10; attempt++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/json', ...init.headers } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = Math.max(Number(res.headers.get('retry-after')) || 0, 2 ** attempt) * 1000;
      console.warn(`  ${res.status} → ${Math.round(wait / 1000)} 秒待って再試行 (${attempt}/10)`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${res.statusText}: ${url.slice(0, 200)}`);
  }
  throw new Error(`再試行の上限に達した: ${url.slice(0, 200)}`);
}

async function sparql(name) {
  const file = join(RAW, `${name}.json`);
  if (!REFRESH && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')).results.bindings;
  console.log(`SPARQL: ${name}`);
  const json = await fetchJson(`${SPARQL}?${new URLSearchParams({ query: QUERIES[name] })}`, {
    headers: { Accept: 'application/sparql-results+json' },
  });
  writeFileSync(file, JSON.stringify(json));
  await sleep(1000);
  return json.results.bindings;
}

/** File:… のタイトル → imageinfo。キャッシュに無いものだけ 50 件ずつ取る。 */
async function commonsInfo(titles) {
  const file = join(RAW, 'commons.json');
  const cache = !REFRESH && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const missing = titles.filter((t) => !(t in cache));
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    console.log(`Commons: ${i + batch.length} / ${missing.length}`);
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      redirects: '1',
      prop: 'imageinfo',
      iiprop: 'extmetadata|url|size',
      iiurlwidth: '800',
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|License',
      titles: batch.join('|'),
    });
    const json = await fetchJson(`${COMMONS}?${params}`);
    const alias = new Map();
    for (const n of json.query?.normalized ?? []) alias.set(n.from, n.to);
    for (const r of json.query?.redirects ?? []) alias.set(r.from, r.to);
    const pages = new Map((json.query?.pages ?? []).map((p) => [p.title, p]));
    for (const title of batch) {
      let t = title;
      for (let hop = 0; hop < 3 && alias.has(t); hop++) t = alias.get(t);
      cache[title] = pages.get(t)?.imageinfo?.[0] ?? null;
    }
    writeFileSync(file, JSON.stringify(cache));
    await sleep(1500);
  }
  return cache;
}

function retrievedAt() {
  const file = join(RAW, 'fetched.json');
  if (!REFRESH && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')).retrievedAt;
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(file, JSON.stringify({ retrievedAt: today }));
  return today;
}

const qid = (uri) => uri.slice(uri.lastIndexOf('/') + 1);
const RANK = {
  'http://wikiba.se/ontology#PreferredRank': 'preferred',
  'http://wikiba.se/ontology#NormalRank': 'normal',
  'http://wikiba.se/ontology#DeprecatedRank': 'deprecated',
};

async function main() {
  mkdirSync(RAW, { recursive: true });
  const date = retrievedAt();

  const wardMap = buildWardMap(await sparql('wards'));
  if (Object.keys(wardMap).length !== 11) throw new Error(`行政区が 11 件ではない: ${Object.keys(wardMap).length}`);

  const constituents = (await sparql('heritageParts')).map((b) => qid(b.p.value));
  const partOf = (await sparql('heritagePartOf')).map((b) => qid(b.p.value));
  const umbrellas = partOf.filter((q) => !constituents.includes(q));
  if (constituents.length !== WORLD_HERITAGE_COUNT) {
    console.warn(`構成資産が ${constituents.length} 件（${WORLD_HERITAGE_COUNT} 件ではない）→ worldHeritage は全件 null`);
  }

  const candidates = parseCandidates(await sparql('items'));
  const inceptions = {};
  for (const b of await sparql('inceptions')) {
    const id = qid(b.i.value);
    (inceptions[id] ??= []).push({
      time: b.time.value,
      precision: Number(b.precision.value),
      rank: RANK[b.rank.value] ?? 'normal',
    });
  }

  const sitelinks = {};
  for (const b of await sparql('sitelinks')) sitelinks[qid(b.i.value)] = Number(b.n.value);

  const titles = [...new Set(candidates.flatMap((c) => c.images))].sort();
  const photos = await commonsInfo(titles);

  const { items, excluded } = buildShaji({ candidates, wardMap, inceptions, heritage: { constituents, umbrellas }, photos, sitelinks });

  const data = {
    meta: [
      {
        id: 'wikidata',
        title: 'Wikidata（京都市内の寺院・神社・城の名称・所在地・世界遺産の構成資産・記事のある言語版の数）',
        publisher: 'Wikimedia Foundation と Wikidata の編集者',
        url: 'https://www.wikidata.org/',
        license: 'CC0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        retrievedAt: date,
        note: 'SPARQL で取得し、境内の建物・境内社・廃寺・他の寺社の一部・同名で区別できないものを除外。創建年は年の精度があるものだけ使用。',
      },
      {
        id: 'commons',
        title: 'Wikimedia Commons の写真（作者・ライセンスは各写真に表示）',
        publisher: 'Wikimedia Commons の各写真の作者',
        url: 'https://commons.wikimedia.org/',
        license: '写真ごとに異なる（CC BY / CC BY-SA / CC0 / パブリックドメインのもののみ使用）',
        licenseUrl: null,
        retrievedAt: date,
        note: 'Wikidata の画像（P18）の縮小版を表示。改変はしていない。',
      },
    ],
    items,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(data, null, 1)}\n`);

  const count = (f) => items.filter(f).length;
  const reasons = {};
  for (const e of excluded) reasons[e.reason] = (reasons[e.reason] ?? 0) + 1;
  console.log(
    JSON.stringify(
      {
        candidates: candidates.length,
        items: items.length,
        kind: { tera: count((i) => i.kind === 'tera'), jinja: count((i) => i.kind === 'jinja'), shiro: count((i) => i.kind === 'shiro') },
        photo: count((i) => i.photo),
        inception: count((i) => i.inception !== null),
        ward: count((i) => i.ward !== null),
        worldHeritage: {
          true: items.filter((i) => i.worldHeritage === true).map((i) => i.name),
          false: count((i) => i.worldHeritage === false),
          null: count((i) => i.worldHeritage === null),
        },
        excluded: reasons,
        commonsTitles: titles.length,
        commonsMissing: titles.filter((t) => !photos[t]).length,
      },
      null,
      1,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * DBPedia/Wikidata SPARQL データ取得スクリプト
 *
 * 京都の寺社仏閣の住所・座標・画像URLを外部オープンデータから取得する。
 * このスクリプトはネットワーク環境で実行する必要がある。
 *
 * データソース:
 *   - DBPedia Japanese (https://ja.dbpedia.org/sparql)
 *     ライセンス: CC BY-SA 3.0 (商用利用可・帰属表示必要)
 *     出典: Wikipedia日本語版の構造化データ
 *
 *   - Wikidata (https://query.wikidata.org/sparql)
 *     ライセンス: CC0 (パブリックドメイン・完全に自由)
 *
 *   - Wikimedia Commons (画像)
 *     ライセンス: CC BY-SA 3.0/4.0 (商用利用可・帰属表示必要)
 *
 * 使い方: cd assets && node fetch-dbpedia.js
 *
 * 注意:
 *   - SPARQL エンドポイントへのネットワークアクセスが必要
 *   - レート制限があるため、連続実行時は間隔を空けること
 *   - 取得データは dbpedia-results.json に保存される
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const SIGHTS_PATH = path.join(__dirname, '../src/app/pages/sights/dataset/kyoto-sights.json');
const OUTPUT_PATH = path.join(__dirname, 'dbpedia-results.json');

// =====================================================================
// SPARQL クエリ定義
// =====================================================================

/**
 * DBPedia Japanese から京都の寺社仏閣の住所を取得するSPARQLクエリ
 * dbpedia-ja は日本語Wikipediaの構造化データを提供
 */
const DBPEDIA_QUERY = `
PREFIX dbpedia-ja: <http://ja.dbpedia.org/resource/>
PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX prop-ja: <http://ja.dbpedia.org/property/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>

SELECT DISTINCT ?name ?label ?address ?postalCode ?lat ?long ?thumbnail ?abstract
WHERE {
  ?s rdfs:label ?label .
  ?s dbpedia-owl:abstract ?abstract .

  # 京都に関連するリソース
  {
    ?s prop-ja:所在地 ?address .
    FILTER(CONTAINS(STR(?address), "京都"))
  }
  UNION
  {
    ?s dbpedia-owl:address ?address .
    FILTER(CONTAINS(STR(?address), "京都"))
  }

  OPTIONAL { ?s prop-ja:郵便番号 ?postalCode }
  OPTIONAL { ?s dbpedia-owl:thumbnail ?thumbnail }
  OPTIONAL {
    ?s <http://www.w3.org/2003/01/geo/wgs84_pos#lat> ?lat .
    ?s <http://www.w3.org/2003/01/geo/wgs84_pos#long> ?long .
  }

  # 寺社仏閣・観光地に絞る
  FILTER(
    CONTAINS(STR(?label), "寺") ||
    CONTAINS(STR(?label), "神社") ||
    CONTAINS(STR(?label), "院") ||
    CONTAINS(STR(?label), "城") ||
    CONTAINS(STR(?label), "閣") ||
    CONTAINS(STR(?label), "宮")
  )

  BIND(STR(?label) AS ?name)
}
LIMIT 500
`;

/**
 * Wikidata から京都の寺社仏閣データを取得するSPARQLクエリ
 * Wikidata は CC0 ライセンス（完全にフリー）
 */
const WIKIDATA_QUERY = `
SELECT ?item ?itemLabel ?coord ?address ?postalCode ?image ?commons
WHERE {
  # 京都市に位置するもの
  ?item wdt:P131* wd:Q34600 .  # located in Kyoto

  # 寺院、神社、城のいずれか
  {
    ?item wdt:P31/wdt:P279* wd:Q160742 .  # Buddhist temple
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q845945 .  # Shinto shrine
  } UNION {
    ?item wdt:P31/wdt:P279* wd:Q23413 .   # castle
  }

  OPTIONAL { ?item wdt:P625 ?coord }      # coordinate
  OPTIONAL { ?item wdt:P6375 ?address }    # street address
  OPTIONAL { ?item wdt:P281 ?postalCode }  # postal code
  OPTIONAL { ?item wdt:P18 ?image }        # image
  OPTIONAL { ?item wdt:P373 ?commons }     # Commons category

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "ja,en" .
  }
}
LIMIT 500
`;

// =====================================================================
// HTTP ユーティリティ
// =====================================================================
function sparqlQuery(endpoint, query) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    url.searchParams.set('query', query);
    url.searchParams.set('format', 'json');

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'KyotoSouvenirApp/1.0 (data-enrichment)',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =====================================================================
// メインの取得・マッチング処理
// =====================================================================
async function fetchAndEnrich() {
  console.log('========================================');
  console.log('DBPedia/Wikidata SPARQL データ取得');
  console.log('========================================\n');

  const results = { dbpedia: [], wikidata: [], matched: 0, timestamp: new Date().toISOString() };

  // 1. DBPedia Japanese からデータ取得
  console.log('1. DBPedia Japanese に問い合わせ中...');
  try {
    const dbpediaResult = await sparqlQuery('https://ja.dbpedia.org/sparql', DBPEDIA_QUERY);
    results.dbpedia = dbpediaResult.results.bindings.map(b => ({
      name: b.name ? b.name.value : '',
      address: b.address ? b.address.value : '',
      postalCode: b.postalCode ? b.postalCode.value : '',
      lat: b.lat ? b.lat.value : '',
      long: b.long ? b.long.value : '',
      thumbnail: b.thumbnail ? b.thumbnail.value : '',
    }));
    console.log(`   ${results.dbpedia.length}件のデータを取得しました。`);
  } catch (e) {
    console.log(`   DBPedia エラー: ${e.message}`);
    console.log('   → DBPedia のデータ取得をスキップします。');
  }

  await delay(2000); // レート制限対策

  // 2. Wikidata からデータ取得
  console.log('2. Wikidata に問い合わせ中...');
  try {
    const wikidataResult = await sparqlQuery('https://query.wikidata.org/sparql', WIKIDATA_QUERY);
    results.wikidata = wikidataResult.results.bindings.map(b => ({
      name: b.itemLabel ? b.itemLabel.value : '',
      address: b.address ? b.address.value : '',
      postalCode: b.postalCode ? b.postalCode.value : '',
      coord: b.coord ? b.coord.value : '',
      image: b.image ? b.image.value : '',
      commons: b.commons ? b.commons.value : '',
    }));
    console.log(`   ${results.wikidata.length}件のデータを取得しました。`);
  } catch (e) {
    console.log(`   Wikidata エラー: ${e.message}`);
    console.log('   → Wikidata のデータ取得をスキップします。');
  }

  // 3. 既存データとのマッチングと補完
  console.log('\n3. 既存データとのマッチング...');
  const rawData = JSON.parse(fs.readFileSync(SIGHTS_PATH, 'utf-8'));
  const isArray = Array.isArray(rawData);
  const rawKeys = isArray ? null : Object.keys(rawData);
  const items = isArray ? rawData : Object.values(rawData);
  let matchCount = 0;

  const allExternal = [...results.dbpedia, ...results.wikidata];

  items.forEach(item => {
    const baseName = item.name.split('\u3000')[0].replace(/（.*?）/g, '').trim();
    // 空のbaseNameはあらゆるext.nameに部分一致してしまうため、スキップする
    if (!baseName) return;

    for (const ext of allExternal) {
      if (!ext.name) continue;
      // 名称の部分一致で照合
      if (ext.name.includes(baseName) || baseName.includes(ext.name)) {
        if (ext.address && (!item.address || item.address.trim() === '')) {
          item.address = ext.address;
          matchCount++;
        }
        if (ext.postalCode && (!item.postal_code || item.postal_code.trim() === '')) {
          item.postal_code = ext.postalCode;
        }
        if ((ext.thumbnail || ext.image) && (!item.photo || item.photo.trim() === '')) {
          // HTTP URLをHTTPSに正規化して混在コンテンツエラーを防ぐ
          const rawUrl = (ext.thumbnail || ext.image).trim();
          item.photo = rawUrl.startsWith('http://') ? 'https://' + rawUrl.slice(7) : rawUrl;
        }
        break;
      }
    }
  });

  results.matched = matchCount;
  console.log(`   ${matchCount}件をマッチングしました。`);

  // 4. 結果を保存（元の構造を維持）
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2) + '\n');
  console.log(`\n外部データを ${OUTPUT_PATH} に保存しました。`);

  if (matchCount > 0) {
    let output;
    if (isArray) {
      output = items;
    } else {
      output = {};
      rawKeys.forEach((key, idx) => { output[key] = items[idx]; });
    }
    fs.writeFileSync(SIGHTS_PATH, JSON.stringify(output, null, 2) + '\n');
    console.log(`更新されたデータを ${SIGHTS_PATH} に保存しました。`);
  }

  console.log('\n========================================');
  console.log('ライセンス情報:');
  console.log('  DBPedia: CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/)');
  console.log('  Wikidata: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)');
  console.log('  Wikimedia Commons 画像: 各画像のライセンスに従う (主に CC BY-SA)');
  console.log('========================================');
}

fetchAndEnrich().catch(console.error);

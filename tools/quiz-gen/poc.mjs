// PoC: 既存の kyoto-sights.json / kyoto-souvenir.json から、どの種類のクイズを何問作れるかを数える。
// 企画書（docs/quiz-renewal-plan.md）の「出題テンプレートごとの生成可能数」はこのスクリプトの出力。
// 依存なし。リポジトリ直下で `node tools/quiz-gen/poc.mjs` を実行する（引数で JSON のパスを差し替え可）。
import { readFileSync } from 'node:fs';
const [
  ,
  ,
  sightsPath = 'src/app/pages/sights/dataset/kyoto-sights.json',
  souvenirPath = 'src/app/pages/souvenir/dataset/kyoto-souvenir.json',
] = process.argv;
const sights = JSON.parse(readFileSync(sightsPath, 'utf8'));
const souvenirs = JSON.parse(readFileSync(souvenirPath, 'utf8'));

const baseName = (n) => n.split(/[　 ]/)[0].replace(/（.*?）/g, '');
const ward = (addr) => (addr.match(/京都市(北|上京|左京|中京|東山|下京|南|右京|伏見|山科|西京)区/) || [])[1] ?? null;
const era = (d) => (d.match(/(平安|鎌倉|室町|桃山|江戸|明治|大正|昭和|飛鳥|奈良|南北朝)時代/) || [])[1] ?? null;
const designation = (d) => d.includes('国宝') ? '国宝' : d.includes('重要文化財') ? '重要文化財' : null;
const founder = (d) => (d.match(/([^\s、。「」（）]{2,12})(?:が|の)(?:建立|創建|開基|開山|建てた)/) || [])[1] ?? null;
const yearJp = (d) => (d.match(/(\d{3,4})年/) || [])[1] ?? null;

// 1) 区当てクイズ: 住所から区が取れる施設（ベース名で重複排除）
const byBase = new Map();
for (const s of sights) { const b = baseName(s.name); if (!byBase.has(b)) byBase.set(b, []); byBase.get(b).push(s); }
const wardQ = [...byBase.entries()].map(([b, arr]) => [b, arr.map((s) => ward(s.address)).find(Boolean)]).filter(([, w]) => w);
const wardDist = {}; for (const [, w] of wardQ) wardDist[w] = (wardDist[w] ?? 0) + 1;

// 2) 時代当て: 説明に「○○時代」
const eraQ = sights.filter((s) => era(s.description));
const eraDist = {}; for (const s of eraQ) { const e = era(s.description); eraDist[e] = (eraDist[e] ?? 0) + 1; }

// 3) 国宝 or 重文: 説明中に明示
const desigQ = sights.filter((s) => designation(s.description));

// 4) 読み当て(name_kana がある) — 難読寺社名
const kanaQ = sights.filter((s) => s.name_kana && /[一-龥]/.test(baseName(s.name)));
const kanaBase = new Set(kanaQ.map((s) => baseName(s.name)));

// 5) 料金当て: 価格に数字がある
const priceQ = sights.filter((s) => /\d{3,4}円/.test(s.price));

// 6) 建立者・西暦
const founderQ = sights.filter((s) => founder(s.description));
const yearQ = sights.filter((s) => yearJp(s.description));

// 7) 説明文から名前当て(説明に名前が含まれると答えが漏れる → マスク可能数)
const descQ = sights.filter((s) => s.description.length >= 40);
const leak = descQ.filter((s) => s.description.includes(baseName(s.name)));

// 8) お土産: 説明文からの名前当て / 創業年・時代 / 工芸 vs 食
const svDesc = souvenirs.filter((s) => s.description.length >= 30);
const svLeak = svDesc.filter((s) => s.description.includes(s.name.replace(/[　 ]/g, '')));
const svEra = souvenirs.filter((s) => /\d{3,4}年|元禄|江戸|明治|室町|平安|創業/.test(s.description));
const svCraft = souvenirs.filter((s) => /^京|織|染|焼|人形|扇|漆|指物|瓦|仏具|工芸|印|かるた|きせる|金網|型/.test(s.name));
const svFood = souvenirs.filter((s) => /餅|菓子|豆|団子|酒|漬|豆腐|湯葉|麩|そば|納豆|煎|飴|八ツ橋|ぼうろ|洲浜|落雁|らくがん|松風|料理|茶/.test(s.name + s.description.slice(0, 40)));

console.log(JSON.stringify({
  records: { sights: sights.length, distinctSights: byBase.size, souvenirs: souvenirs.length },
  q_ward: { count: wardQ.length, dist: wardDist },
  q_era: { count: eraQ.length, dist: eraDist },
  q_designation: desigQ.length,
  q_kana: { records: kanaQ.length, distinctNames: kanaBase.size, sample: [...kanaBase].slice(0, 8) },
  q_price: priceQ.length,
  q_founder: { count: founderQ.length, sample: founderQ.slice(0, 5).map((s) => [baseName(s.name), founder(s.description)]) },
  q_year: yearQ.length,
  q_desc_to_name: { candidates: descQ.length, nameLeaksInDesc: leak.length },
  souvenir: { descToName: svDesc.length, nameLeaks: svLeak.length, era: svEra.length, craft: svCraft.length, food: svFood.length },
}, null, 2));

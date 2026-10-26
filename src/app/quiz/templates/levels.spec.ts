// 難易度（かんたん・ふつう・むずかしい）による作り分けの規則。
// 型は全段階で同じ。難しさは「選択肢の紛らわしさ」と「題材の有名さ」で変える。
import type { SangyoIndicator } from '../../data/types';
import { MODES } from '../game';
import { LEVELS, type Datasets, type Level, type Question } from '../question';
import { mulberry32 } from '../rng';
import { answerOf, expectWellFormed } from '../testing/invariants';
import { kakei, kanko, meisho, meta, omiyage, shaji } from '../testing/fixtures';
import { KAKEI_TEMPLATES } from './kakei';
import { distanceKm, KANKO_TEMPLATES, wardCentroids } from './kanko';
import { MEISHO_TEMPLATES } from './meisho';
import { OMIYAGE_TEMPLATES } from './omiyage';
import { SANGYO_TEMPLATES } from './sangyo';
import { SHAJI_TEMPLATES } from './shaji';

const ALL = [
  ...OMIYAGE_TEMPLATES,
  ...MEISHO_TEMPLATES,
  ...KAKEI_TEMPLATES,
  ...KANKO_TEMPLATES,
  ...SHAJI_TEMPLATES,
  ...SANGYO_TEMPLATES,
];
const t = (id: string) => ALL.find((x) => x.id === id)!;

/** seed を変えて作れた問題を集める */
function many(id: string, e: unknown, d: Datasets, level: Level, n = 30): Question[] {
  const out: Question[] = [];
  for (let s = 0; s < n; s++) {
    const q = t(id).build(e, d, mulberry32(s), level);
    if (q) out.push(q);
  }
  expect(out.length, `${id}/${level} が 1 問も作れない`).toBeGreaterThan(0);
  return out;
}
const wrongs = (q: Question) => q.choices.filter((_, i) => i !== q.answerIndex);

// ---------- フィクスチャ ----------

const omiyageItems = [
  omiyage({
    id: 'o1',
    name: '洲浜',
    kana: 'すはま',
    description:
      '大豆の粉に砂糖と水飴を加えて練った菓子。州浜の形にちなむ。古くからの京菓子である。',
  }),
  omiyage({ id: 'o2', name: '粽', kana: 'ちまき' }),
  omiyage({ id: 'o3', name: '香', kana: 'こう' }),
  omiyage({ id: 'o4', name: '香煎', kana: 'こうせん' }),
  omiyage({ id: 'o5', name: '五色豆', kana: 'ごしきまめ' }),
  omiyage({ id: 'o6', name: '京扇子', kana: 'きょうせんす', genre: 'kogei' }),
  omiyage({ id: 'o7', name: '京人形', kana: 'きょうにんぎょう', genre: 'kogei' }),
  omiyage({ id: 'o8', name: '京漆器', kana: 'きょうしっき', genre: 'kogei' }),
  omiyage({ id: 'o9', name: '京うちわ', kana: 'きょううちわ', genre: 'kogei' }),
];

const ERAS = ['飛鳥', '奈良', '平安', '鎌倉', '南北朝', '室町', '桃山', '江戸'];
const meishoItems = [
  ...ERAS.map((era, i) =>
    meisho({ id: `m${i}`, name: `寺${i}　本堂`, era, designation: '重要文化財', ward: '東山' }),
  ),
  meisho({
    id: 'c1',
    name: '化野',
    kana: 'あだしの',
    genre: 'chimei',
    description: '嵯峨の奥の地名。',
  }),
  meisho({
    id: 'c2',
    name: '先斗町',
    kana: 'ぽんとちょう',
    genre: 'chimei',
    description: '鴨川西岸の花街。',
  }),
  meisho({
    id: 'c3',
    name: '粟田口',
    kana: 'あわたぐち',
    genre: 'chimei',
    description: '京の七口の一つ。',
  }),
  meisho({
    id: 'c4',
    name: '一乗寺',
    kana: 'いちじょうじ',
    genre: 'chimei',
    description: '左京区の地名。',
  }),
];

// 区の中心は観光施設の座標の平均で決まる（区ごとに 1 件ずつ置く）
const WARD_POS: [string, number, number][] = [
  ['北', 35.05, 135.75],
  ['上京', 35.03, 135.755],
  ['左京', 35.05, 135.79],
  ['中京', 35.01, 135.76],
  ['東山', 34.99, 135.78],
  ['下京', 34.99, 135.76],
  ['南', 34.97, 135.75],
  ['右京', 35.02, 135.7],
  ['伏見', 34.94, 135.77],
  ['山科', 34.98, 135.82],
  ['西京', 34.98, 135.68],
];
const kankoItems = [
  ...WARD_POS.map(([ward, lat, lon], i) =>
    kanko({ id: `w${i}`, name: `${'甲乙丙丁戊己庚辛壬癸子'[i]}寺`, ward: ward as never, lat, lon }),
  ),
  kanko({ id: 'k1', name: '清水寺', lat: 34.9949, lon: 135.785, ward: '東山' }),
  kanko({ id: 'k2', name: '高台寺', lat: 35.0006, lon: 135.7809, ward: '東山' }),
  kanko({ id: 'k3', name: '八坂神社', lat: 35.0037, lon: 135.7786, ward: '東山' }),
  kanko({ id: 'k4', name: '知恩院', lat: 35.0054, lon: 135.7832, ward: '東山' }),
  kanko({ id: 'k5', name: '平安神宮', lat: 35.016, lon: 135.7824, ward: '左京' }),
  kanko({ id: 'k6', name: '銀閣寺', lat: 35.027, lon: 135.7982, ward: '左京' }),
  kanko({ id: 'k7', name: '金閣寺', lat: 35.0394, lon: 135.7292, ward: '北' }),
  kanko({ id: 'k8', name: '東福寺', lat: 34.9767, lon: 135.7738, ward: '東山' }),
  kanko({ id: 'k9', name: '三十三間堂', lat: 34.9879, lon: 135.7717, ward: '東山' }),
  kanko({ id: 'k10', name: '南禅寺', lat: 35.0113, lon: 135.7944, ward: '左京' }),
  kanko({ id: 'k11', name: '大覚寺', lat: 35.0285, lon: 135.6782, ward: '右京' }),
  kanko({ id: 'k12', name: '醍醐寺', lat: 34.951, lon: 135.8193, ward: '伏見' }),
  kanko({ id: 'k13', name: '京料理　ある店', lat: 35.004, lon: 135.775, ward: '東山' }),
];

const kakeiItems = [
  kakei({ item: '牛肉', kyotoRank: 1, top: { city: '京都市', value: 1 } }),
  ...['A', 'B', 'C', 'D'].map((x, i) =>
    kakei({ item: `近${x}`, kyotoRank: 2 + i, top: { city: '神戸市', value: 9 } }),
  ),
  ...['E', 'F', 'G', 'H'].map((x, i) =>
    kakei({ item: `中${x}`, kyotoRank: 27 + i, top: { city: '金沢市', value: 9 } }),
  ),
  ...['I', 'J', 'K', 'L'].map((x, i) =>
    kakei({ item: `遠${x}`, kyotoRank: 41 + i, top: { city: '静岡市', value: 9 } }),
  ),
  kakei({ item: 'パン', kyotoRank: 20, top: { city: '神戸市', value: 9 } }),
];

const shajiItems = [
  shaji({
    qid: 'S1',
    name: '清水寺',
    lat: 34.9949,
    lon: 135.785,
    sitelinks: 77,
    worldHeritage: true,
  }),
  shaji({
    qid: 'S2',
    name: '鹿苑寺',
    lat: 35.0394,
    lon: 135.7292,
    sitelinks: 57,
    worldHeritage: true,
  }),
  shaji({ qid: 'S3', name: '南禅寺', lat: 35.0113, lon: 135.7944, sitelinks: 22 }),
  shaji({ qid: 'S4', name: '知恩院', lat: 35.0054, lon: 135.7832, sitelinks: 20 }),
  shaji({ qid: 'S5', name: '東福寺', lat: 34.9767, lon: 135.7738, sitelinks: 23 }),
  shaji({ qid: 'S6', name: '大徳寺', lat: 35.0441, lon: 135.7461, sitelinks: 20 }),
  shaji({ qid: 'S7', name: '高台寺', lat: 35.0006, lon: 135.7809, sitelinks: 8 }),
  shaji({ qid: 'S8', name: '六波羅蜜寺', lat: 34.9965, lon: 135.7733, sitelinks: 4 }),
  shaji({ qid: 'S9', name: '安祥寺', lat: 34.9945, lon: 135.8133, sitelinks: 2 }),
  shaji({ qid: 'S10', name: '西方寺', lat: 35.06, lon: 135.73, sitelinks: 1 }),
  shaji({ qid: 'S11', name: '浄土寺', lat: 35.02, lon: 135.79, sitelinks: 1 }),
  shaji({ qid: 'S12', name: '正法寺', lat: 34.99, lon: 135.79, sitelinks: 0 }),
];

const prefs = [
  '兵庫県',
  '京都府',
  '新潟県',
  '秋田県',
  '山形県',
  '福島県',
  '長野県',
  '広島県',
  '山口県',
  '佐賀県',
];
const sake: SangyoIndicator = {
  id: 'sake',
  label: '清酒',
  unit: 'kl',
  period: '令和6年',
  source: 'nta-sake',
  values: prefs.map((pref, i) => ({ pref, value: 100 - i * 10 })),
};

const d: Datasets = {
  omiyage: { meta: [meta('kyoto-navi')], items: omiyageItems },
  meisho: { meta: [meta('kyoto-navi')], items: meishoItems },
  kanko: { meta: [meta('kyoto-kanko')], items: kankoItems },
  kakei: { meta: [meta('kakei')], period: '2023年～2025年平均', items: kakeiItems },
  shaji: { meta: [meta('wikidata'), meta('commons')], items: shajiItems },
  sangyo: { meta: [meta('nta-sake')], indicators: [sake] },
};
const SOURCES = ['kyoto-navi', 'kyoto-kanko', 'kakei', 'wikidata', 'commons', 'nta-sake', 'gsi'];

// ---------- 共通 ----------

describe('難易度: 共通', () => {
  it('難易度は 3 段階', () => {
    expect(LEVELS).toEqual(['easy', 'normal', 'hard']);
  });

  it('難易度を省略したら「ふつう」と同じ問題になる', () => {
    for (const tpl of ALL) {
      const c = tpl.candidates(d);
      if (c.length === 0) continue;
      expect(tpl.build(c[0], d, mulberry32(7))).toEqual(
        tpl.build(c[0], d, mulberry32(7), 'normal'),
      );
    }
  });

  it('どの難易度でも、作った問題は正しい形', () => {
    for (const level of LEVELS) {
      for (const tpl of ALL) {
        for (const e of tpl.candidates(d, level)) {
          const q = tpl.build(e, d, mulberry32(3), level);
          if (q) expectWellFormed(q, SOURCES);
        }
      }
    }
  });
});

// ---------- お土産・名所 ----------

describe('説明文から名前を当てる', () => {
  it('かんたんは別の種類のものを誤答にする（お土産）', () => {
    for (const q of many('omiyage.describe', omiyageItems[0], d, 'easy')) {
      for (const w of wrongs(q))
        expect(omiyageItems.find((o) => o.name === w)!.genre).not.toBe('meibutsu');
    }
  });

  it('むずかしいは引用を最初の 1 文だけにする', () => {
    for (const q of many('omiyage.describe', omiyageItems[0], d, 'hard')) {
      expect(q.quote!.replace(/。$/, '')).not.toContain('。');
    }
  });

  it('かんたんは別の種類の名所を誤答にする（名所）', () => {
    for (const q of many('meisho.describe', meishoItems[0], d, 'easy')) {
      for (const w of wrongs(q))
        expect(meishoItems.find((m) => m.name === w)!.genre).not.toBe('kenzobutsu');
    }
  });
});

describe('読み', () => {
  const lenOf = (s: string) => [...s].length;
  it('かんたんは文字数が 2 以上違う読みを、むずかしいは 1 以内の読みを誤答にする', () => {
    for (const q of many('omiyage.kana', omiyageItems[0], d, 'easy')) {
      for (const w of wrongs(q)) expect(Math.abs(lenOf(w) - 3)).toBeGreaterThanOrEqual(2);
    }
    for (const q of many('omiyage.kana', omiyageItems[0], d, 'hard')) {
      for (const w of wrongs(q)) expect(Math.abs(lenOf(w) - 3)).toBeLessThanOrEqual(1);
    }
  });
});

describe('名所の時代', () => {
  it('かんたんは 2 時代以上離れた時代、むずかしいは近い 3 時代を誤答にする', () => {
    const edo = meishoItems[7]; // 江戸
    for (const q of many('meisho.era', edo, d, 'easy')) {
      for (const w of wrongs(q))
        expect(7 - ERAS.indexOf(w.replace('時代', ''))).toBeGreaterThanOrEqual(2);
    }
    for (const q of many('meisho.era', edo, d, 'hard')) {
      expect(wrongs(q).sort()).toEqual(['南北朝時代', '室町時代', '桃山時代'].sort());
    }
  });
});

describe('何区？', () => {
  it('かんたんは遠い区、むずかしいは近い区を誤答にする（区の中心は観光施設の座標の平均）', () => {
    const c = wardCentroids(d);
    const dist = (w: string) =>
      distanceKm(c.get('東山' as never)!, c.get(w.replace('区', '') as never)!);
    const easy = many('kanko.ward', kankoItems[11], d, 'easy').flatMap(wrongs).map(dist);
    const hard = many('kanko.ward', kankoItems[11], d, 'hard').flatMap(wrongs).map(dist);
    expect(Math.max(...hard)).toBeLessThan(Math.min(...easy));
  });

  it('観光施設の「何区？」は寺社などの名所だけ（店は出さない）', () => {
    for (const level of LEVELS) {
      expect(
        t('kanko.ward')
          .candidates(d, level)
          .map((k: { name: string }) => k.name),
      ).not.toContain('京料理　ある店');
    }
  });
});

// ---------- 家計調査 ----------

describe('京都市が 1 位の品目', () => {
  it('かんたんは京都市が 40 位以下、むずかしいは 2〜5 位の品目を誤答にする', () => {
    const rank = (w: string) => kakeiItems.find((i) => i.item === w)!.kyotoRank;
    for (const q of many('kakei.first', kakeiItems[0], d, 'easy')) {
      for (const w of wrongs(q)) expect(rank(w)).toBeGreaterThanOrEqual(40);
    }
    for (const q of many('kakei.first', kakeiItems[0], d, 'hard')) {
      for (const w of wrongs(q)) expect(rank(w)).toBeLessThanOrEqual(5);
    }
  });
});

describe('京都市の順位', () => {
  it('かんたんは上半分か下半分の 2 択、むずかしいは順位そのものの 4 択（前後 3 位以内）', () => {
    const pan = kakeiItems[kakeiItems.length - 1]; // 20 位
    for (const q of many('kakei.rank', pan, d, 'easy')) {
      expect([...q.choices].sort()).toEqual(['1〜26位', '27〜52位']);
      expect(answerOf(q)).toBe('1〜26位');
    }
    for (const q of many('kakei.rank', pan, d, 'hard')) {
      expect(answerOf(q)).toBe('20位');
      for (const w of wrongs(q))
        expect(Math.abs(Number.parseInt(w, 10) - 20)).toBeLessThanOrEqual(3);
    }
  });
});

// ---------- 観光施設 ----------

describe('航空写真', () => {
  it('かんたんは 5km 以上離れた施設、むずかしいは 1.5〜4km の施設を誤答にする', () => {
    const kiyomizu = kankoItems[11];
    const km = (w: string) =>
      distanceKm(
        kiyomizu,
        kankoItems.find((k) => k.name === w)!,
      );
    for (const q of many('kanko.aerial', kiyomizu, d, 'easy'))
      for (const w of wrongs(q)) expect(km(w)).toBeGreaterThanOrEqual(5);
    for (const q of many('kanko.aerial', kiyomizu, d, 'hard')) {
      for (const w of wrongs(q)) {
        expect(km(w)).toBeGreaterThanOrEqual(1.5);
        expect(km(w)).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe('いちばん近い名所', () => {
  it('かんたんは誤答が 3 倍以上遠く、むずかしいは誤答も近い（2.5 倍か 3km 以内）', () => {
    const kiyomizu = kankoItems[11];
    const km = (w: string) =>
      distanceKm(
        kiyomizu,
        kankoItems.find((k) => k.name === w)!,
      );
    for (const q of many('kanko.nearest', kiyomizu, d, 'easy')) {
      const a = km(answerOf(q));
      for (const w of wrongs(q)) expect(km(w)).toBeGreaterThanOrEqual(a * 3);
    }
    for (const q of many('kanko.nearest', kiyomizu, d, 'hard')) {
      const a = km(answerOf(q));
      for (const w of wrongs(q)) {
        expect(km(w)).toBeGreaterThanOrEqual(a * 1.6);
        expect(km(w)).toBeLessThanOrEqual(Math.max(3, a * 2.5));
      }
    }
  });
});

// ---------- 寺社 ----------

describe('寺社の写真', () => {
  it('かんたんは有名な寺社（言語版 10 以上）、ふつうは 3 以上、むずかしいは全部', () => {
    const fame = (level: Level) =>
      t('shaji.photo')
        .candidates(d, level)
        .map((s: { sitelinks: number }) => s.sitelinks);
    expect(Math.min(...fame('easy'))).toBeGreaterThanOrEqual(10);
    expect(Math.min(...fame('normal'))).toBeGreaterThanOrEqual(3);
    expect(fame('hard').length).toBe(shajiItems.length);
  });

  it('むずかしいは近く（3km 以内）の同じ種類の寺社を誤答にする', () => {
    const kiyomizu = shajiItems[0];
    for (const q of many('shaji.photo', kiyomizu, d, 'hard')) {
      for (const w of wrongs(q)) {
        const km = distanceKm(
          kiyomizu,
          shajiItems.find((s) => s.name === w)!,
        );
        expect(km).toBeGreaterThanOrEqual(0.5);
        expect(km).toBeLessThanOrEqual(3);
      }
    }
  });
});

describe('世界遺産の構成資産', () => {
  it('かんたんは無名な寺社（言語版 3 以下）、むずかしいは有名な寺社（10 以上）を誤答にする', () => {
    const fame = (w: string) => shajiItems.find((s) => s.name === w)!.sitelinks;
    for (const q of many('shaji.worldHeritage', shajiItems[0], d, 'easy'))
      for (const w of wrongs(q)) expect(fame(w)).toBeLessThanOrEqual(3);
    for (const q of many('shaji.worldHeritage', shajiItems[0], d, 'hard'))
      for (const w of wrongs(q)) expect(fame(w)).toBeGreaterThanOrEqual(10);
  });
});

// ---------- 産業 ----------

describe('全国 1 位の都道府県', () => {
  it('かんたんは下位半分、むずかしいは 2〜4 位の都道府県を誤答にする', () => {
    const rank = (p: string) => prefs.indexOf(p) + 1;
    for (const q of many('sangyo.first', sake, d, 'easy'))
      for (const w of wrongs(q)) expect(rank(w)).toBeGreaterThan(5);
    for (const q of many('sangyo.first', sake, d, 'hard'))
      for (const w of wrongs(q)) expect(rank(w)).toBeLessThanOrEqual(4);
  });
});

describe('京都府の順位', () => {
  it('かんたんは 5 位以上離れた順位、むずかしいは前後 2 位以内を誤答にする', () => {
    for (const q of many('sangyo.kyotoRank', sake, d, 'easy')) {
      expect(answerOf(q)).toBe('2位');
      for (const w of wrongs(q))
        expect(Math.abs(Number.parseInt(w, 10) - 2)).toBeGreaterThanOrEqual(5);
    }
    for (const q of many('sangyo.kyotoRank', sake, d, 'hard')) {
      for (const w of wrongs(q))
        expect(Math.abs(Number.parseInt(w, 10) - 2)).toBeLessThanOrEqual(2);
    }
  });
});

// ---------- モード ----------

describe('モード', () => {
  it('かんたん・ふつう・むずかしい・今日の5問の 4 つで、どれも全部の型を使う', () => {
    expect(MODES.map((m) => m.id)).toEqual(['easy', 'normal', 'hard', 'daily']);
    for (const m of MODES)
      expect(m.templates.map((x) => x.id).sort()).toEqual(ALL.map((x) => x.id).sort());
    expect(MODES.find((m) => m.id === 'daily')!.level).toBe('normal');
  });
});

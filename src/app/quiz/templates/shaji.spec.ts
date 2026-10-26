import { mulberry32 } from '../rng';
import { answerOf, expectWellFormed } from '../testing/invariants';
import { meta, shaji } from '../testing/fixtures';
import type { Datasets } from '../question';
import { distanceKm } from './kanko';
import { SHAJI_TEMPLATES } from './shaji';

const t = (id: string) => SHAJI_TEMPLATES.find((x) => x.id === id)!;
const S = ['wikidata', 'commons'];

const items = [
  shaji({
    qid: 'Q1',
    name: '清水寺',
    lat: 34.9949,
    lon: 135.785,
    ward: '東山',
    worldHeritage: true,
  }),
  shaji({
    qid: 'Q2',
    name: '地主神社',
    kind: 'jinja',
    lat: 34.9951,
    lon: 135.7853,
    worldHeritage: null,
  }),
  shaji({ qid: 'Q3', name: '高台寺', lat: 35.0006, lon: 135.7809 }), // 清水寺から約 0.7km
  shaji({ qid: 'Q4', name: '成就院', lat: 34.9948, lon: 135.7846 }), // 清水寺の塔頭（ごく近い）
  shaji({ qid: 'Q5', name: '南禅寺', lat: 35.0113, lon: 135.7944 }),
  shaji({ qid: 'Q6', name: '知恩院', lat: 35.0054, lon: 135.7832 }),
  shaji({ qid: 'Q7', name: '東福寺', lat: 34.9767, lon: 135.7738 }),
  shaji({ qid: 'Q8', name: '鹿苑寺', lat: 35.0394, lon: 135.7292, worldHeritage: true }),
  shaji({ qid: 'Q9', name: '八坂神社', kind: 'jinja', lat: 35.0037, lon: 135.7786 }),
  shaji({ qid: 'Q10', name: '平安神宮', kind: 'jinja', lat: 35.016, lon: 135.7824 }),
  shaji({ qid: 'Q11', name: '北野天満宮', kind: 'jinja', lat: 35.0312, lon: 135.7351 }),
  shaji({ qid: 'Q12', name: '写真なし寺', lat: 35.1, lon: 135.7, photo: null }),
];
const data: Datasets = { shaji: { meta: [meta('wikidata'), meta('commons')], items } };

describe('shaji.photo（写真の寺社を当てる）', () => {
  const tpl = t('shaji.photo');

  it('写真があるものが対象で、同じ種類（寺なら寺）から選ばせる', () => {
    expect(tpl.candidates(data).map((s) => s.name)).not.toContain('写真なし寺');
    for (let seed = 0; seed < 30; seed++) {
      const q = tpl.build(items[0], data, mulberry32(seed))!;
      expectWellFormed(q, S);
      expect(answerOf(q)).toBe('清水寺');
      expect(q.prompt).toContain('寺');
      expect(q.media?.kind).toBe('photo');
      for (const c of q.choices) {
        const s = items.find((i) => i.name === c)!;
        expect(s.kind).toBe('tera');
        if (c !== '清水寺') expect(distanceKm(items[0], s)).toBeGreaterThanOrEqual(0.5);
      }
    }
  });

  it('写真の作者とライセンスを解説に出す', () => {
    const q = tpl.build(items[0], data, mulberry32(1))!;
    expect(q.explanation).toContain('撮影者');
    expect(q.explanation).toContain('CC BY-SA 4.0');
  });

  it('画像の代替テキストに名前を入れない', () => {
    const q = tpl.build(items[0], data, mulberry32(1))!;
    expect(q.media?.alt).not.toContain('清水寺');
  });
});

describe('shaji.photo の同名の扱い', () => {
  it('区で区別した同名の寺社（安養寺（東山区）と安養寺（中京区））は同じ問題に並べない', () => {
    const more = [
      ...items,
      shaji({ qid: 'Q20', name: '安養寺（中京区）', lat: 35.006, lon: 135.7655 }),
      shaji({ qid: 'Q21', name: '安養寺（東山区）', lat: 35.0035, lon: 135.7815 }),
    ];
    const d2: Datasets = { shaji: { meta: [meta('wikidata'), meta('commons')], items: more } };
    for (let seed = 0; seed < 40; seed++) {
      const q = SHAJI_TEMPLATES[0].build(more[12], d2, mulberry32(seed))!;
      expect(q.choices).not.toContain('安養寺（東山区）');
    }
  });
});

describe('shaji.worldHeritage（世界遺産の構成資産）', () => {
  const tpl = t('shaji.worldHeritage');

  it('構成資産が正解、false と分かっているものだけが誤答（null は使わない）', () => {
    expect(
      tpl
        .candidates(data)
        .map((s) => s.name)
        .sort(),
    ).toEqual(['清水寺', '鹿苑寺']);
    for (let seed = 0; seed < 30; seed++) {
      const q = tpl.build(items[0], data, mulberry32(seed))!;
      expectWellFormed(q, ['wikidata']);
      expect(answerOf(q)).toBe('清水寺');
      expect(q.choices).not.toContain('地主神社');
      expect(q.choices).not.toContain('鹿苑寺');
    }
  });

  it('解説に京都市内の構成資産の一覧を出す', () => {
    const q = tpl.build(items[7], data, mulberry32(1))!;
    expect(q.explanation).toContain('清水寺');
    expect(q.explanation).toContain('鹿苑寺');
  });
});

describe('創建年は出題しない', () => {
  it('Wikidata の創建年は検証できないため、テンプレートを用意しない', () => {
    expect(SHAJI_TEMPLATES.map((x) => x.id)).toEqual(['shaji.photo', 'shaji.worldHeritage']);
  });
});

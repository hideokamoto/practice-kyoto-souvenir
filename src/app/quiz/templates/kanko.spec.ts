import { mulberry32 } from '../rng';
import { answerOf, expectWellFormed } from '../testing/invariants';
import { kanko, meta } from '../testing/fixtures';
import type { Datasets } from '../question';
import { distanceKm, KANKO_TEMPLATES } from './kanko';

const t = (id: string) => KANKO_TEMPLATES.find((x) => x.id === id)!;
const S = ['kyoto-kanko', 'gsi'];

// 実在の施設の座標（京都府観光施設一覧の値に近いもの）
const items = [
  kanko({ id: '1', name: '清水寺', lat: 34.9949, lon: 135.785, ward: '東山' }),
  kanko({ id: '2', name: '高台寺', lat: 35.0006, lon: 135.7809, ward: '東山' }), // 清水寺から約 0.7km
  kanko({ id: '3', name: '八坂神社', lat: 35.0037, lon: 135.7786, ward: '東山' }), // 約 1.1km
  kanko({ id: '4', name: '知恩院', lat: 35.0054, lon: 135.7832, ward: '東山' }), // 約 1.2km
  kanko({ id: '5', name: '平安神宮', lat: 35.016, lon: 135.7824, ward: '左京' }), // 約 2.4km
  kanko({ id: '6', name: '銀閣寺', lat: 35.027, lon: 135.7982, ward: '左京' }), // 約 3.7km
  kanko({ id: '7', name: '金閣寺', lat: 35.0394, lon: 135.7292, ward: '北' }),
  kanko({ id: '8', name: '仁和寺', lat: 35.031, lon: 135.7139, ward: '右京' }),
  kanko({ id: '9', name: '仁和寺霊宝館', lat: 35.0313, lon: 135.7143, ward: '右京' }),
  kanko({ id: '10', name: '伏見稲荷大社', lat: 34.9671, lon: 135.7727, ward: '伏見' }),
  kanko({ id: '11', name: '京都市美術館', lat: 35.0125, lon: 135.7826, ward: '左京' }),
];
const data: Datasets = { kanko: { meta: [meta('kyoto-kanko')], items } };

describe('distanceKm', () => {
  it('清水寺〜金閣寺はおよそ 7.5km', () => {
    const d = distanceKm(items[0], items[6]);
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(8);
  });
});

describe('kanko.aerial（航空写真）', () => {
  const tpl = t('kanko.aerial');

  it('寺社・城などの名前のものが対象で、中心の座標の航空写真を出す', () => {
    const names = tpl.candidates(data).map((k) => k.name);
    expect(names).toContain('清水寺');
    expect(names).not.toContain('京都市美術館');
    const q = tpl.build(items[0], data, mulberry32(1))!;
    expectWellFormed(q, S);
    expect(answerOf(q)).toBe('清水寺');
    expect(q.media).toEqual(
      expect.objectContaining({ kind: 'aerial', lat: 34.9949, lon: 135.785 }),
    );
  });

  it('誤答は正解から 1.5km 以上離れた施設だけ', () => {
    for (let seed = 0; seed < 30; seed++) {
      const q = tpl.build(items[0], data, mulberry32(seed));
      if (!q) continue;
      for (const c of q.choices.filter((c) => c !== '清水寺')) {
        const k = items.find((i) => i.name === c)!;
        expect(distanceKm(items[0], k)).toBeGreaterThanOrEqual(1.5);
      }
    }
  });
});

describe('kanko.ward', () => {
  const tpl = t('kanko.ward');

  it('名前に区名が入っている施設は対象外', () => {
    const names = tpl.candidates(data).map((k) => k.name);
    expect(names).not.toContain('伏見稲荷大社');
    const q = tpl.build(items[6], data, mulberry32(2))!;
    expectWellFormed(q, S);
    expect(answerOf(q)).toBe('北区');
  });
});

describe('kanko.nearest（いちばん近い施設）', () => {
  const tpl = t('kanko.nearest');

  it('起点も寺社などの名所に限る', () => {
    expect(tpl.candidates(data).map((k) => k.name)).not.toContain('京都市美術館');
  });

  it('正解は他の選択肢より 1.6 倍以上近く、名前が包含関係の施設は選択肢にしない', () => {
    let built = 0;
    for (let seed = 0; seed < 40; seed++) {
      const q = tpl.build(items[7], data, mulberry32(seed));
      if (q) {
        built++;
        expect(q.choices).not.toContain('仁和寺霊宝館');
      }
      const q2 = tpl.build(items[0], data, mulberry32(seed));
      if (!q2) continue;
      built++;
      expectWellFormed(q2, S);
      const ans = items.find((i) => i.name === answerOf(q2))!;
      const dAns = distanceKm(items[0], ans);
      for (const c of q2.choices.filter((c) => c !== ans.name)) {
        const k = items.find((i) => i.name === c)!;
        expect(distanceKm(items[0], k)).toBeGreaterThanOrEqual(dAns * 1.6);
      }
      expect(q2.explanation).toMatch(/km/);
      // 美術館・ホテルなど、京都の知識で解けない施設は選択肢にしない
      expect(q2.choices).not.toContain('京都市美術館');
    }
    expect(built).toBeGreaterThan(0);
  });
});

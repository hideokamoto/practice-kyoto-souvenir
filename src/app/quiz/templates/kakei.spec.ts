import { mulberry32 } from '../rng';
import { answerOf, expectWellFormed } from '../testing/invariants';
import { kakei, meta } from '../testing/fixtures';
import type { Datasets } from '../question';
import { KAKEI_TEMPLATES } from './kakei';

const t = (id: string) => KAKEI_TEMPLATES.find((x) => x.id === id)!;
const S = ['kakei'];

const items = [
  kakei({ item: '牛肉', kyotoRank: 1, kyotoValue: 36081, top: { city: '京都市', value: 36081 } }),
  kakei({ item: 'バター', kyotoRank: 1, kyotoValue: 1976, top: { city: '京都市', value: 1976 } }),
  kakei({ item: 'パン', kyotoRank: 3, kyotoValue: 39347, top: { city: '神戸市', value: 41967 } }),
  kakei({ item: 'コーヒー', kyotoRank: 2, top: { city: '金沢市', value: 2000 } }),
  kakei({ item: 'コーヒー・ココア', kyotoRank: 40, top: { city: '金沢市', value: 3000 } }),
  kakei({ item: 'まぐろ', kyotoRank: 45, top: { city: '静岡市', value: 3000 } }),
  kakei({ item: 'かつお', kyotoRank: 30, top: { city: '高知市', value: 3000 } }),
  kakei({ item: 'しじみ', kyotoRank: 50, top: { city: '松江市', value: 3000 } }),
  kakei({ item: '納豆', kyotoRank: 20, top: { city: '水戸市', value: 3000 } }),
  kakei({
    item: 'ねぎ',
    kyotoRank: 1,
    measure: 'quantity',
    unit: 'g',
    top: { city: '京都市', value: 9 },
  }),
  kakei({
    item: 'さけ',
    kyotoRank: 51,
    measure: 'quantity',
    unit: 'g',
    top: { city: '札幌市', value: 9 },
  }),
];
const data: Datasets = {
  kakei: { meta: [meta('kakei')], period: '2023年（令和5年）～2025年（令和7年）平均', items },
};

describe('kakei.first（京都市が 1 位の品目）', () => {
  const tpl = t('kakei.first');

  it('同じ measure で、京都市が下位半分の品目を誤答にする', () => {
    for (let seed = 0; seed < 30; seed++) {
      const q = tpl.build(items[0], data, mulberry32(seed))!;
      expectWellFormed(q, S);
      expect(answerOf(q)).toBe('牛肉');
      for (const c of q.choices.filter((c) => c !== '牛肉')) {
        expect(['コーヒー・ココア', 'まぐろ', 'かつお', 'しじみ']).toContain(c);
      }
      expect(q.prompt).toContain('支出金額');
      expect(q.prompt).toContain('52');
      expect(q.explanation).toContain('2023年');
    }
  });

  it('数量の品目は「購入数量」で聞き、誤答が足りなければ作らない', () => {
    expect(tpl.build(items[9], data, mulberry32(1))).toBeNull();
  });

  it('正解と名前が包含関係にある品目は誤答にしない', () => {
    const q = tpl.build(
      kakei({ item: 'コーヒー', kyotoRank: 1, top: { city: '京都市', value: 1 } }),
      data,
      mulberry32(4),
    );
    expect(q?.choices ?? []).not.toContain('コーヒー・ココア');
  });
});

describe('kakei.rank（京都市の順位帯）', () => {
  const tpl = t('kakei.rank');

  it('4 つの順位帯から選ぶ', () => {
    const q = tpl.build(items[2], data, mulberry32(1))!;
    expectWellFormed(q, S);
    expect(answerOf(q)).toBe('1〜5位');
    expect(q.explanation).toContain('3位');
    expect(q.explanation).toContain('神戸市');
    const q2 = tpl.build(items[7], data, mulberry32(1))!;
    expect(answerOf(q2)).toBe('31〜52位');
  });
});

describe('kakei.topCity（1 位の都市）', () => {
  const tpl = t('kakei.topCity');

  it('京都市が 2〜3 位の品目で、1 位の都市を当てる。京都市は必ず誤答に入る', () => {
    expect(
      tpl
        .candidates(data)
        .map((i) => i.item)
        .sort(),
    ).toEqual(['コーヒー', 'パン']);
    for (let seed = 0; seed < 20; seed++) {
      const q = tpl.build(items[2], data, mulberry32(seed))!;
      expectWellFormed(q, S);
      expect(answerOf(q)).toBe('神戸市');
      expect(q.choices).toContain('京都市');
    }
  });
});

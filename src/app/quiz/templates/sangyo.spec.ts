import { mulberry32 } from '../rng';
import { answerOf, expectWellFormed } from '../testing/invariants';
import { meta } from '../testing/fixtures';
import type { SangyoIndicator } from '../../data/types';
import type { Datasets } from '../question';
import { prefRank, SANGYO_TEMPLATES } from './sangyo';

const t = (id: string) => SANGYO_TEMPLATES.find((x) => x.id === id)!;

const ind = (id: string, values: [string, number][]): SangyoIndicator => ({
  id,
  label: `指標${id}`,
  unit: 'kl',
  period: '令和5年度',
  source: 'nta-sake',
  values: values.map(([pref, value]) => ({ pref, value })),
});

const sake = ind('sake', [
  ['兵庫県', 100],
  ['京都府', 80],
  ['新潟県', 60],
  ['秋田県', 40],
  ['山形県', 30],
  ['福島県', 20],
]);
const tieTop = ind('tie', [
  ['兵庫県', 100],
  ['京都府', 100],
  ['新潟県', 60],
  ['秋田県', 40],
  ['山形県', 30],
]);
const kyotoFirst = ind('mizuna', [
  ['京都府', 500],
  ['茨城県', 400],
  ['福岡県', 30],
  ['滋賀県', 20],
  ['大阪府', 10],
]);
const kyotoTie = ind('kt', [
  ['兵庫県', 100],
  ['京都府', 50],
  ['新潟県', 50],
  ['秋田県', 40],
  ['山形県', 30],
]);
const data: Datasets = {
  sangyo: { meta: [meta('nta-sake')], indicators: [sake, tieTop, kyotoFirst, kyotoTie] },
};

describe('prefRank', () => {
  it('値の大きい順の順位。同値があれば null', () => {
    expect(prefRank(sake, '京都府')).toBe(2);
    expect(prefRank(sake, '兵庫県')).toBe(1);
    expect(prefRank(kyotoTie, '京都府')).toBeNull();
    expect(prefRank(sake, '沖縄県')).toBeNull();
  });
});

describe('sangyo.first（全国 1 位の都道府県）', () => {
  const tpl = t('sangyo.first');

  it('1 位が単独の指標だけが対象', () => {
    expect(tpl.candidates(data).map((i) => i.id)).not.toContain('tie');
  });

  it('京都府が 1 位でなければ京都府を必ず誤答に入れる', () => {
    for (let seed = 0; seed < 20; seed++) {
      const q = tpl.build(sake, data, mulberry32(seed))!;
      expectWellFormed(q, ['nta-sake']);
      expect(answerOf(q)).toBe('兵庫県');
      expect(q.choices).toContain('京都府');
      expect(q.prompt).toContain('令和5年度');
      expect(q.explanation).toContain('京都府は 2位');
    }
  });

  it('京都府が 1 位の指標も作れる', () => {
    const q = tpl.build(kyotoFirst, data, mulberry32(1))!;
    expect(answerOf(q)).toBe('京都府');
  });
});

describe('期間の注記', () => {
  it('期間の括弧書き（注記）は問題文に入れず、解説に出す', () => {
    const long = {
      ...kyotoFirst,
      id: 'long',
      period: '令和8年10月1日現在（件数は平成29年9月現在が基準）',
    };
    const d2: Datasets = { sangyo: { meta: [meta('nta-sake')], indicators: [long] } };
    for (const id of ['sangyo.first', 'sangyo.kyotoRank']) {
      const q = t(id).build(long, d2, mulberry32(1))!;
      expect(q.prompt).toContain('令和8年10月1日現在');
      expect(q.prompt).not.toContain('平成29年');
      expect(q.explanation).toContain('平成29年9月現在が基準');
    }
  });
});

describe('sangyo.kyotoRank（京都府の順位）', () => {
  const tpl = t('sangyo.kyotoRank');

  it('京都府の順位が同値なく決まる指標だけが対象', () => {
    const ids = tpl.candidates(data).map((i) => i.id);
    expect(ids).toEqual(expect.arrayContaining(['sake', 'mizuna']));
    expect(ids).not.toContain('kt');
    expect(ids).not.toContain('tie');
  });

  it('正解の前後の順位を誤答にする', () => {
    const q = tpl.build(sake, data, mulberry32(3))!;
    expectWellFormed(q, ['nta-sake']);
    expect(answerOf(q)).toBe('2位');
    for (const c of q.choices) expect(c).toMatch(/^[1-6]位$/);
    const q1 = tpl.build(kyotoFirst, data, mulberry32(3))!;
    expect(answerOf(q1)).toBe('1位');
    expect(q1.choices.every((c) => /^[1-5]位$/.test(c))).toBe(true);
  });
});

import { mulberry32 } from '../rng';
import { containsLoosely } from '../text';
import { answerOf, expectWellFormed } from '../testing/invariants';
import { meta, omiyage } from '../testing/fixtures';
import type { Datasets } from '../question';
import { OMIYAGE_TEMPLATES } from './omiyage';

const t = (id: string) => OMIYAGE_TEMPLATES.find((x) => x.id === id)!;

const data: Datasets = {
  omiyage: {
    meta: [meta('kyoto-navi')],
    items: [
      omiyage({
        id: '1',
        name: 'あぶり餅',
        kana: 'あぶりもち',
        description:
          '北区紫野、今宮神社の東門に面した茶店が平安後期から売る餅。竹串にさした餅をあぶり餅として白みそで食べる。',
      }),
      omiyage({ id: '2', name: '八ツ橋', kana: 'やつはし' }),
      omiyage({ id: '3', name: '五色豆', kana: 'ごしきまめ' }),
      omiyage({ id: '4', name: '洲浜', kana: 'すはま' }),
      omiyage({
        id: '5',
        name: '香煎',
        kana: 'こうせん',
        description: '炒り粉に香料をまぜた粉。五色豆と並ぶ名物。',
      }),
      omiyage({ id: '6', name: '京扇子', kana: 'きょうせんす', genre: 'kogei' }),
      omiyage({ id: '7', name: '京うちわ', kana: 'きょううちわ', genre: 'kogei' }),
    ],
  },
};

describe('omiyage.describe（説明文から名前を当てる）', () => {
  const tpl = t('omiyage.describe');

  it('名前を伏せた説明文を引用し、同じ種類のお土産から選ばせる', () => {
    for (let seed = 0; seed < 20; seed++) {
      const q = tpl.build(data.omiyage!.items[0], data, mulberry32(seed))!;
      expectWellFormed(q, ['kyoto-navi']);
      expect(answerOf(q)).toBe('あぶり餅');
      expect(q.quote).toContain('〇〇');
      expect(q.quote).not.toContain('あぶり');
      for (const c of q.choices)
        expect(['あぶり餅', '八ツ橋', '五色豆', '洲浜', '香煎']).toContain(c);
    }
  });

  it('引用に名前が出てくるお土産は誤答にしない', () => {
    for (let seed = 0; seed < 20; seed++) {
      const q = tpl.build(data.omiyage!.items[4], data, mulberry32(seed))!;
      expect(answerOf(q)).toBe('香煎');
      expect(q.choices).not.toContain('五色豆');
    }
  });

  it('同じ種類が 4 つ未満の種類は出題対象にしない', () => {
    expect(tpl.candidates(data).map((o) => o.name)).not.toContain('京扇子');
  });

  it('解説は伏せ字なしの説明文を含む', () => {
    const q = tpl.build(data.omiyage!.items[0], data, mulberry32(1))!;
    expect(q.explanation).toContain('あぶり餅');
    expect(q.explanation).toContain('今宮神社');
  });
});

describe('omiyage.kana（読みを当てる）', () => {
  const tpl = t('omiyage.kana');

  it('漢字だけの名前が対象で、読みの選択肢から選ばせる', () => {
    const names = tpl.candidates(data).map((o) => o.name);
    expect(names).toEqual(expect.arrayContaining(['五色豆', '洲浜', '香煎', '京扇子']));
    expect(names).not.toContain('あぶり餅');
    expect(names).not.toContain('八ツ橋');
    const q = tpl.build(data.omiyage!.items[3], data, mulberry32(2))!;
    expectWellFormed(q, ['kyoto-navi']);
    expect(answerOf(q)).toBe('すはま');
    expect(q.prompt).toContain('洲浜');
    for (const c of q.choices) expect(containsLoosely(c, '洲浜')).toBe(false);
  });
});

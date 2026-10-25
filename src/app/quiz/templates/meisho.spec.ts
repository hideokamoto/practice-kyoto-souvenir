import { mulberry32 } from '../rng';
import { answerOf, expectWellFormed } from '../testing/invariants';
import { meisho, meta } from '../testing/fixtures';
import type { Datasets } from '../question';
import { MEISHO_TEMPLATES } from './meisho';

const t = (id: string) => MEISHO_TEMPLATES.find((x) => x.id === id)!;
const S = ['kyoto-navi'];

const items = [
  meisho({
    id: '1',
    name: '清水寺　本堂',
    kana: 'きよみずでら　ほんどう',
    description: '清水寺にある江戸時代初期建築の国宝建造物。寝殿造風の建物で舞台がある。',
    era: '江戸',
    designation: '国宝',
    ward: '東山',
  }),
  meisho({
    id: '2',
    name: '清水寺　仁王門',
    kana: 'きよみずでら　におうもん',
    description: '清水寺にある室町時代建築の重要文化財建造物。',
    era: '室町',
    designation: '重要文化財',
    ward: '東山',
  }),
  meisho({ id: '3', name: '大徳寺　法堂', era: '江戸', designation: '重要文化財', ward: '北' }),
  meisho({ id: '4', name: '東福寺　東司', era: '室町', designation: '重要文化財' }),
  meisho({ id: '5', name: '仁和寺　御影堂', era: '桃山', designation: '重要文化財', ward: '右京' }),
  meisho({ id: '6', name: '二条城　唐門', designation: '重要文化財', ward: '中京' }),
  meisho({
    id: '7',
    name: '法金剛院　木造阿弥陀如来坐像（重文）',
    designation: '重要文化財',
    genre: 'chokoku',
  }),
  meisho({ id: '8', name: '伏見稲荷大社　本殿', ward: '伏見' }),
  // 曼殊院（左京区）の絵画だが、住所は寄託先の京都国立博物館（東山区）になっている実例
  meisho({
    id: '9',
    name: '曼殊院　絹本著色不動明王像',
    genre: 'kaiga',
    designation: '重要文化財',
    ward: '東山',
  }),
  meisho({ id: '16', name: '仁和寺　医心方', genre: 'other', ward: '右京' }),
  meisho({
    id: '10',
    name: '化野',
    kana: 'あだしの',
    genre: 'chimei',
    description: '嵯峨の奥の地名。',
  }),
  meisho({
    id: '11',
    name: '先斗町',
    kana: 'ぽんとちょう',
    genre: 'chimei',
    description: '鴨川西岸の花街。',
  }),
  meisho({
    id: '12',
    name: '糺の森',
    kana: 'ただすのもり',
    genre: 'chimei',
    description: '下鴨神社の森。',
  }),
  meisho({
    id: '13',
    name: '粟田口',
    kana: 'あわたぐち',
    genre: 'chimei',
    description: '京の七口の一つ。',
  }),
  meisho({
    id: '14',
    name: '一乗寺',
    kana: 'いちじょうじ',
    genre: 'chimei',
    description: '左京区の地名。',
  }),
  meisho({
    id: '15',
    name: '犬矢来',
    kana: 'いぬやらい',
    genre: 'machinami',
    description: '町家の外壁の囲い。',
  }),
];
const data: Datasets = { meisho: { meta: [meta('kyoto-navi')], items } };

describe('meisho.describe', () => {
  const tpl = t('meisho.describe');

  it('同じ種類で、施設（base）が違うものだけを誤答にする', () => {
    for (let seed = 0; seed < 30; seed++) {
      const q = tpl.build(items[0], data, mulberry32(seed))!;
      expectWellFormed(q, S);
      expect(answerOf(q)).toBe('清水寺　本堂');
      expect(q.choices).not.toContain('清水寺　仁王門');
      expect(q.quote).not.toContain('清水寺');
      expect(q.prompt).toContain('建造物');
    }
  });

  it('種類が other のものや、同じ種類が 4 施設に満たない種類は対象外', () => {
    const names = tpl.candidates(data).map((m) => m.name);
    expect(names).not.toContain('犬矢来');
    expect(names).toContain('化野');
  });
});

describe('meisho.describe の計算の使い回し', () => {
  it('同じデータなら出題対象の一覧を作り直さない（全件の伏せ字処理が重いため）', () => {
    const tpl = t('meisho.describe');
    expect(tpl.candidates(data)).toBe(tpl.candidates(data));
  });
});

describe('meisho.era', () => {
  const tpl = t('meisho.era');

  it('時代が取れているものだけが対象で、正解は「〇〇時代」', () => {
    expect(tpl.candidates(data).every((m) => m.era !== null)).toBe(true);
    const q = tpl.build(items[0], data, mulberry32(3))!;
    expectWellFormed(q, S);
    expect(answerOf(q)).toBe('江戸時代');
    expect(q.prompt).toContain('清水寺　本堂');
    expect(q.prompt).toContain('建築');
    expect(q.choices.every((c) => c.endsWith('時代'))).toBe(true);
    expect(q.explanation).toContain('江戸時代初期建築の国宝建造物');
  });
});

describe('meisho.designation', () => {
  const tpl = t('meisho.designation');

  it('国宝か重要文化財かの 2 択。名前に「重文」等を含むものは対象外', () => {
    const names = tpl.candidates(data).map((m) => m.name);
    expect(names).not.toContain('法金剛院　木造阿弥陀如来坐像（重文）');
    const q = tpl.build(items[0], data, mulberry32(1))!;
    expectWellFormed(q, S);
    expect([...q.choices].sort()).toEqual(['国宝', '重要文化財']);
    expect(answerOf(q)).toBe('国宝');
    expect(q.explanation).toContain('2021年');
  });
});

describe('meisho.kana', () => {
  const tpl = t('meisho.kana');

  it('漢字だけの地名などの読みを当てる', () => {
    const names = tpl.candidates(data).map((m) => m.name);
    expect(names).toEqual(expect.arrayContaining(['化野', '先斗町', '粟田口', '一乗寺']));
    expect(names).not.toContain('清水寺　本堂');
    const q = tpl.build(
      items.find((m) => m.name === '化野')!,
      data,
      mulberry32(5),
    )!;
    expectWellFormed(q, S);
    expect(answerOf(q)).toBe('あだしの');
  });
});

describe('meisho.ward', () => {
  const tpl = t('meisho.ward');

  it('区が取れていて、名前に区名が入っていないものが対象', () => {
    const names = tpl.candidates(data).map((m) => m.name);
    expect(names).toContain('清水寺　本堂');
    expect(names).not.toContain('伏見稲荷大社　本殿');
    // 美術品は寄託先の住所のことがあるので区を問わない
    expect(names).not.toContain('曼殊院　絹本著色不動明王像');
    // 種類が分からないもの（other）も、所在が寺社の住所とは限らないので対象外
    expect(names).not.toContain('仁和寺　医心方');
    const q = tpl.build(items[0], data, mulberry32(9))!;
    expectWellFormed(q, S);
    expect(answerOf(q)).toBe('東山区');
    expect(q.choices.every((c) => c.endsWith('区'))).toBe(true);
  });
});

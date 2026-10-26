// 京都観光Navi（見もの・お土産）と京都府観光施設一覧の変換テスト。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseWard,
  extractEraDesignation,
  cleanDescription,
  baseName,
  maskTerms,
  meishoGenre,
  omiyageGenre,
  toHiragana,
  buildMeisho,
  buildOmiyage,
  buildKanko,
} from './lib/navi.mjs';

test('parseWard: 「京都市」の有無にかかわらず区を取る', () => {
  assert.equal(parseWard('京都市左京区銀閣寺町2'), '左京');
  assert.equal(parseWard('京都府京都市上京区馬喰町'), '上京');
  assert.equal(parseWard('東山区林下町400'), '東山');
  assert.equal(parseWard('下京区烏丸通七条下る'), '下京');
  assert.equal(parseWard('北区紫野'), '北');
  assert.equal(parseWard('本町15丁目778'), null);
  assert.equal(parseWard(''), null);
  assert.equal(parseWard('宇治市宇治山田'), null);
});

test('extractEraDesignation: 最初の一文の定型句だけから取る', () => {
  assert.deepEqual(
    extractEraDesignation('北野天満宮にある桃山時代建築の国宝建造物。中門を入ったところに…'),
    { era: '桃山', designation: '国宝' },
  );
  assert.deepEqual(extractEraDesignation('二条城にある江戸時代の重要文化財建造物。'), {
    era: '江戸',
    designation: '重要文化財',
  });
  assert.deepEqual(extractEraDesignation('神護寺にある鎌倉時代作の国宝絵画。'), {
    era: '鎌倉',
    designation: '国宝',
  });
  assert.deepEqual(extractEraDesignation('清水寺にある江戸時代初期建築の国宝建造物。'), {
    era: '江戸',
    designation: '国宝',
  });
  // 時代が 2 つ出る文からは時代を取らない（指定は取る）
  assert.deepEqual(
    extractEraDesignation('即成院にある平安時代から江戸時代にかけて作られた重要文化財彫刻。'),
    { era: null, designation: null },
  );
  assert.deepEqual(extractEraDesignation('二条城にある重要文化財建造物。'), {
    era: null,
    designation: '重要文化財',
  });
  assert.deepEqual(extractEraDesignation('重要文化財'), { era: null, designation: '重要文化財' });
  // 2 文目以降の「国宝」は拾わない
  assert.deepEqual(extractEraDesignation('本堂の本尊。国宝の厨子内に安置。'), {
    era: null,
    designation: null,
  });
});

test('cleanDescription: 交通案内などの付記を落とし、改行をまとめる', () => {
  const raw =
    '慈照寺（銀閣寺）にある室町時代建築の国宝建造物。常時非公開\n\n\n\n●交通案内：京阪電車出町柳下車　\n\n　　市バス';
  assert.equal(cleanDescription(raw), '慈照寺（銀閣寺）にある室町時代建築の国宝建造物。常時非公開');
  assert.equal(cleanDescription('一行目。\n\n二行目。'), '一行目。\n二行目。');
  assert.equal(cleanDescription('  前後の空白  '), '前後の空白');
});

test('baseName: 施設名を取り出す', () => {
  assert.equal(baseName('清水寺　本堂'), '清水寺');
  assert.equal(baseName('慈照寺（銀閣寺）　銀閣'), '慈照寺（銀閣寺）');
  assert.equal(baseName('三十三間堂（蓮華王院）南大門'), '三十三間堂（蓮華王院）');
  assert.equal(baseName('愛宕社＜大豊神社＞　狛鳶'), '愛宕社＜大豊神社＞');
  assert.equal(baseName('化野'), '化野');
});

test('maskTerms: 名前・別名・括弧内・読みを伏せ字の対象にする（長い順）', () => {
  const t = maskTerms({ name: '慈照寺（銀閣寺）　銀閣', kana: 'じしょうじ（ぎんかくじ）　ぎんかく' });
  assert.ok(t.includes('慈照寺'));
  assert.ok(t.includes('銀閣寺'));
  assert.ok(t.includes('銀閣'));
  assert.ok(t.includes('じしょうじ'));
  assert.ok(t.includes('ぎんかく'));
  for (let i = 1; i < t.length; i++) assert.ok(t[i - 1].length >= t[i].length);
  // 1 文字の語は伏せない（説明文がほぼ全部伏せ字になるため）
  assert.ok(!maskTerms({ name: '香', kana: 'こう' }).includes('香'));
});

test('meishoGenre: 分類コードと名称から決める', () => {
  assert.equal(meishoGenre(['2', '2', '3'], '清水寺　本堂'), 'kenzobutsu');
  assert.equal(meishoGenre(['2', '1', '7'], '北野天満宮　本殿'), 'kenzobutsu');
  assert.equal(meishoGenre(['2', '2', '2'], '愛染院　木造十一面観音立像'), 'chokoku');
  assert.equal(meishoGenre(['2', '2', '2'], '西芳寺　絹本著色夢窓国師像'), 'kaiga');
  assert.equal(meishoGenre(['2', '2', '5'], '天球院　方丈障壁画'), 'kaiga');
  assert.equal(meishoGenre(['2', '2', '6'], '神護寺　梵鐘'), 'kogeihin');
  // 2-2-3 には建造物だけでなく絵画も入っている（実データ）
  assert.equal(meishoGenre(['2', '2', '3'], '清浄華院　絹本著色阿弥陀三尊像'), 'kaiga');
  assert.equal(meishoGenre(['2', '2', '3'], '矢田寺　紙本著色矢田地蔵縁起'), 'kaiga');
  // 「書院」は建造物のまま
  assert.equal(meishoGenre(['2', '2', '3'], '曼殊院　大書院'), 'kenzobutsu');
  assert.equal(meishoGenre(['2', '2', '5'], '曼殊院　古今和歌集'), 'kaiga');
  assert.equal(meishoGenre(['2', '2', '5'], '相国寺　無学祖元墨蹟'), 'kaiga');
  assert.equal(meishoGenre(['2', '2', '2'], '崇道神社　金銅小野毛人墓誌'), 'kogeihin');
  assert.equal(meishoGenre(['2', '3', '1'], '貴船神社の桂'), 'meiboku');
  assert.equal(meishoGenre(['2', '5', '1'], '雅楽'), 'geino');
  assert.equal(meishoGenre(['3', '4', '1'], '虞美人草'), 'bungaku');
  assert.equal(meishoGenre(['5', '3', '2'], '賀茂茄子'), 'shoku');
  assert.equal(meishoGenre(['8', '1', '1'], '化野'), 'chimei');
  assert.equal(meishoGenre(['8', '2', '1'], '愛宕山'), 'yama');
  assert.equal(meishoGenre(['8', '2', '2'], '桂川'), 'kawa');
  assert.equal(meishoGenre(['8', '2', '3'], '音羽の滝'), 'mizu');
  assert.equal(meishoGenre(['8', '2', '4'], '広沢池'), 'ike');
  assert.equal(meishoGenre(['8', '2', '4'], '糺の森'), 'other');
  assert.equal(meishoGenre(['8', '3', '2'], '犬矢来'), 'machinami');
  assert.equal(meishoGenre(['8', '5', '1'], '清水寺　狛犬'), 'komainu');
  assert.equal(meishoGenre(['8', '6', '1'], '甲塚古墳'), 'kofun');
  assert.equal(meishoGenre(['8', '3', '1'], 'ポルタ'), 'other');
});

test('omiyageGenre: 分類コード（5 列目）から決める', () => {
  assert.equal(omiyageGenre('5050200'), 'kogei');
  assert.equal(omiyageGenre('5050100'), 'meibutsu');
  assert.equal(omiyageGenre('5050300'), 'ryori');
  assert.throws(() => omiyageGenre('9999999'));
});

test('toHiragana: カタカナをひらがなにする（長音・記号はそのまま）', () => {
  assert.equal(toHiragana('キヨミズデラ'), 'きよみずでら');
  assert.equal(toHiragana('ポルタ・ハーブ'), 'ぽるた・はーぶ');
});

const MIMONO_ROW = (over = {}) => {
  const r = Array(30).fill('');
  Object.assign(r, {
    0: '1000004',
    1: '2',
    2: '2',
    3: '3',
    4: '5020200',
    8: '清水寺　本堂',
    9: 'きよみずでら　ほんどう',
    12: '清水寺にある江戸時代初期建築の国宝建造物。寝殿造風の建物。\n\n●交通案内：市バス',
    17: '京都市東山区清水一丁目294',
    ...over,
  });
  return r;
};

test('buildMeisho: CSV 行を Meisho にする', () => {
  const [m] = buildMeisho([MIMONO_ROW()]);
  assert.deepEqual(m, {
    id: '1000004',
    name: '清水寺　本堂',
    kana: 'きよみずでら　ほんどう',
    base: '清水寺',
    description: '清水寺にある江戸時代初期建築の国宝建造物。寝殿造風の建物。',
    genre: 'kenzobutsu',
    era: '江戸',
    designation: '国宝',
    ward: '東山',
  });
});

test('buildMeisho: 名前か説明が空の行は捨て、ID の重複はエラー', () => {
  assert.equal(buildMeisho([MIMONO_ROW({ 12: '' })]).length, 0);
  assert.equal(buildMeisho([MIMONO_ROW({ 8: '' })]).length, 0);
  assert.throws(() => buildMeisho([MIMONO_ROW(), MIMONO_ROW()]), /重複/);
});

test('buildOmiyage: CSV 行を Omiyage にする', () => {
  const r = Array(25).fill('');
  Object.assign(r, {
    0: '1000001',
    4: '5050100',
    8: 'あぶり餅',
    9: 'あぶりもち',
    12: '北区紫野、今宮神社の東門に面した茶店一和が平安後期から売る餅。',
  });
  assert.deepEqual(buildOmiyage([r]), [
    {
      id: '1000001',
      name: 'あぶり餅',
      kana: 'あぶりもち',
      description: '北区紫野、今宮神社の東門に面した茶店一和が平安後期から売る餅。',
      genre: 'meibutsu',
    },
  ]);
});

test('buildKanko: 京都市内で座標と説明があるものだけ、カナはひらがなに', () => {
  const base = {
    NO: '0000000100',
    市区町村名: '京都市東山区',
    名称: '清水寺',
    名称_カナ: 'キヨミズデラ',
    緯度: '34.994856 ',
    経度: '135.785046 ',
    説明: '「清水の舞台」で知られる。',
  };
  const items = buildKanko([
    base,
    { ...base, NO: '2', 市区町村名: '宇治市' },
    { ...base, NO: '3', 緯度: '' },
    { ...base, NO: '4', 説明: '' },
    { ...base, NO: '5', 緯度: '36.1' }, // 京都市の範囲外
  ]);
  assert.deepEqual(items, [
    {
      id: '0000000100',
      name: '清水寺',
      kana: 'きよみずでら',
      ward: '東山',
      lat: 34.994856,
      lon: 135.785046,
      description: '「清水の舞台」で知られる。',
    },
  ]);
});

test('buildKanko: 同名の施設は最初の 1 件だけ残す', () => {
  const row = (no, name) => ({
    NO: no,
    市区町村名: '京都市左京区',
    名称: name,
    名称_カナ: 'ア',
    緯度: '35.0',
    経度: '135.78',
    説明: 'x',
  });
  const items = buildKanko([row('1', '詩仙堂'), row('2', '詩仙堂'), row('3', '曼殊院')]);
  assert.deepEqual(
    items.map((i) => i.id),
    ['1', '3'],
  );
});

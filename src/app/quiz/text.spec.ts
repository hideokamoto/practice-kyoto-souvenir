import { containsLoosely, excerpt, maskTerms, maskText, normalize } from './text';

describe('normalize', () => {
  it('カタカナ・小書き・全角半角・空白の違いを吸収する', () => {
    expect(normalize('八ッ橋')).toBe(normalize('八ツ橋'));
    expect(normalize('キヨミズ デラ')).toBe(normalize('きよみずでら'));
    expect(normalize('ＡＢＣ　１')).toBe(normalize('abc1'));
  });
});

describe('containsLoosely', () => {
  it('表記ゆれがあっても含むと判定する', () => {
    expect(containsLoosely('名物の八ツ橋は', '八ッ橋')).toBe(true);
    expect(containsLoosely('清水寺にある', 'きよみずでら')).toBe(false);
  });
});

describe('maskText', () => {
  it('語を長い順に伏せ、表記ゆれも伏せる', () => {
    expect(maskText('慈照寺（銀閣寺）にある室町時代の銀閣', ['銀閣寺', '慈照寺', '銀閣'])).toBe(
      '〇〇（〇〇）にある室町時代の〇〇',
    );
    expect(maskText('八ツ橋は米粉の菓子', ['八ッ橋'])).toBe('〇〇は米粉の菓子');
  });

  it('正規表現の記号を含む語でも壊れない', () => {
    expect(maskText('a+b と (c)', ['a+b', '(c)'])).toBe('〇〇 と 〇〇');
  });
});

describe('maskTerms', () => {
  it('名前・別名・括弧内・読みを長い順に返し、1 文字の語は含めない', () => {
    const t = maskTerms('慈照寺（銀閣寺）　銀閣', 'じしょうじ（ぎんかくじ）　ぎんかく');
    for (const w of [
      '慈照寺（銀閣寺）',
      '慈照寺',
      '銀閣寺',
      '銀閣',
      'じしょうじ',
      'ぎんかくじ',
      'ぎんかく',
    ]) {
      expect(t).toContain(w);
    }
    for (let i = 1; i < t.length; i++) expect(t[i - 1].length).toBeGreaterThanOrEqual(t[i].length);
    expect(maskTerms('香', 'こう')).not.toContain('香');
  });

  it('「〇〇の△△」形式の名前は前半も伏せる（名木など）', () => {
    expect(maskTerms('貴船神社の桂', 'きふねじんじゃのかつら')).toContain('貴船神社');
  });
});

describe('excerpt', () => {
  it('文の区切りで max 文字以内に収め、少なくとも 1 文は返す', () => {
    const t = 'あいうえお。かきくけこ。さしすせそ。';
    expect(excerpt(t, 12)).toBe('あいうえお。かきくけこ。');
    expect(excerpt(t, 3)).toBe('あいう…');
    expect(excerpt('改行\nを含む。', 100)).toBe('改行 を含む。');
  });
});

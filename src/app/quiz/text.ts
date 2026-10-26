// 問題文を作るための文字列処理。答えが問題文に漏れていないかの判定もここで行う。

const SMALL_TO_LARGE: Record<string, string> = {
  ぁ: 'あ',
  ぃ: 'い',
  ぅ: 'う',
  ぇ: 'え',
  ぉ: 'お',
  っ: 'つ',
  ゃ: 'や',
  ゅ: 'ゆ',
  ょ: 'よ',
  ゎ: 'わ',
};

function kataToHira(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

/** 比較用の正規化。全角半角・カタカナひらがな・小書き・空白の違いを吸収する。 */
export function normalize(s: string): string {
  return kataToHira(s.normalize('NFKC'))
    .replace(/[ぁぃぅぇぉっゃゅょゎ]/g, (c) => SMALL_TO_LARGE[c])
    .replace(/\s+/g, '')
    .toLowerCase();
}

export function containsLoosely(haystack: string, needle: string): boolean {
  const n = normalize(needle);
  return n.length > 0 && normalize(haystack).includes(n);
}

const LARGE_TO_SMALL = Object.fromEntries(Object.entries(SMALL_TO_LARGE).map(([s, l]) => [l, s]));

/** 1 文字について、表記ゆれ（ひらがな/カタカナ、小書き/大書き）をまとめた正規表現の断片を作る。 */
function charClass(c: string): string {
  const hira = normalize(c);
  const variants = new Set([c]);
  if (hira.length === 1) {
    variants.add(hira);
    const small = LARGE_TO_SMALL[hira];
    for (const h of small ? [hira, small] : [hira]) {
      variants.add(h);
      variants.add(String.fromCharCode(h.charCodeAt(0) + 0x60)); // カタカナ
    }
  }
  const esc = [...variants].map((v) => v.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&'));
  return esc.length === 1 ? esc[0] : `[${esc.join('')}]`;
}

/** terms を長い順に伏せ字にする（表記ゆれも伏せる）。連続した伏せ字は 1 つにまとめる。 */
export function maskText(text: string, terms: readonly string[], mark = '〇〇'): string {
  let out = text;
  const sorted = [...terms].filter((t) => t.length > 0).sort((a, b) => b.length - a.length);
  for (const t of sorted) {
    const re = new RegExp([...t].map(charClass).join(''), 'g');
    out = out.replace(re, mark);
  }
  return out.replace(new RegExp(`(?:${mark})+`, 'g'), mark);
}

/** 名前と読みから、問題文で伏せる語の一覧（長い順）を作る。 */
export function maskTerms(name: string, kana: string): string[] {
  const terms = new Set<string>();
  const add = (s: string) => {
    if (s.length >= 2) terms.add(s);
  };
  for (const src of [name, kana]) {
    if (!src) continue;
    add(src.trim());
    for (const part of src.split(/[\s　、・]+/)) {
      add(part);
      add(part.replace(/[（(＜<][^）)＞>]*[）)＞>]/g, ''));
      for (const m of part.matchAll(/[（(＜<]([^）)＞>]+)[）)＞>]/g)) add(m[1]);
      // 「貴船神社の桂」「音羽の滝」のような名前は「の」の前後も伏せる
      for (const p of part.replace(/[（(＜<][^）)＞>]*[）)＞>]/g, '').split('の')) add(p);
    }
  }
  return [...terms].sort((a, b) => b.length - a.length);
}

/** 文の区切りで max 文字以内に収める。最初の 1 文が長すぎるときは切って「…」を付ける。 */
export function excerpt(text: string, max = 120): string {
  const flat = text.replace(/\s*\n\s*/g, ' ').trim();
  const sentences = flat.match(/[^。]+。?/g) ?? [];
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
  }
  if (out === '') return flat.slice(0, max) + (flat.length > max ? '…' : '');
  return out.trim();
}

/** 最初の 1 文。長すぎるときは excerpt と同じく max 文字で切る。 */
export function firstSentence(text: string, max = 120): string {
  const flat = text.replace(/\s*\n\s*/g, ' ').trim();
  return excerpt(flat.match(/[^。]+。?/)?.[0] ?? '', max);
}

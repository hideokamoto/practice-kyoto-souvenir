import type { Meisho, MeishoGenre, Ward } from '../../data/types';
import { makeQuestion } from '../make';
import type { Level } from '../question';
import { sample, shuffle } from '../rng';
import { containsLoosely, excerpt, firstSentence, maskTerms, maskText } from '../text';
import {
  defineTemplate,
  describePrompt,
  kanaDistractors,
  KANJI_ONLY,
  memoByObject,
  type AnyTemplate,
} from './common';
import { wardDistractors } from './geo';

const SOURCES = ['kyoto-navi'];

const GENRE_NOUN: Record<MeishoGenre, string> = {
  kenzobutsu: '建造物',
  chokoku: '彫刻',
  kaiga: '絵画・書跡',
  kogeihin: '工芸品',
  meiboku: '名木',
  geino: '伝統芸能・風俗',
  bungaku: '作品（文学・映画）',
  shoku: '京の味',
  chimei: '地名',
  yama: '山',
  kawa: '川',
  mizu: '滝・井戸・名水',
  ike: '池',
  machinami: '町家・暮らしのことば',
  komainu: '狛犬・神使',
  kofun: '古墳',
  other: 'もの',
};

const ERAS = ['飛鳥', '奈良', '平安', '鎌倉', '南北朝', '室町', '桃山', '江戸'];

const items = (d: { meisho?: { items: Meisho[] } }) => d.meisho?.items ?? [];
const leadOf = (m: Meisho) => `${m.description.split('。')[0]}。`;

const termsOf = (m: Meisho) => [...maskTerms(m.name, m.kana), ...maskTerms(m.base, '')];
const quoteOf = memoByObject((m: Meisho) => maskText(excerpt(m.description, 120), termsOf(m)));
/** むずかしいは手がかりを減らすため、最初の 1 文だけを引用する。 */
const shortQuoteOf = memoByObject((m: Meisho) =>
  maskText(firstSentence(m.description), termsOf(m)),
);
const quoteFor = (m: Meisho, level: Level) => (level === 'hard' ? shortQuoteOf(m) : quoteOf(m));
const clueLength = (quote: string) => quote.replace(/〇〇/g, '').length;

const describeCandidates = memoByObject((all: Meisho[]): Meisho[] => {
  const bases = new Map<MeishoGenre, Set<string>>();
  for (const m of all) {
    if (!bases.has(m.genre)) bases.set(m.genre, new Set());
    bases.get(m.genre)!.add(m.base);
  }
  return all.filter(
    (m) =>
      m.genre !== 'other' && (bases.get(m.genre)?.size ?? 0) >= 4 && clueLength(quoteOf(m)) >= 8,
  );
});

const hardDescribeCandidates = memoByObject((all: Meisho[]): Meisho[] =>
  describeCandidates(all).filter((m) => clueLength(shortQuoteOf(m)) >= 8),
);

const describe = defineTemplate<Meisho>({
  id: 'meisho.describe',
  needs: 'meisho',
  candidates: (d, level = 'normal') =>
    !d.meisho
      ? []
      : level === 'hard'
        ? hardDescribeCandidates(d.meisho.items)
        : describeCandidates(d.meisho.items),
  key: (m) => m.id,
  build(m, d, rng, level = 'normal') {
    const quote = quoteFor(m, level);
    const usedBases = new Set([m.base]);
    const distractors: string[] = [];
    // かんたんは別の種類（建造物なら山や地名）を誤答にして、種類で絞り込めるようにする
    const sameKind = (x: Meisho) =>
      level === 'easy' ? x.genre !== m.genre && x.genre !== 'other' : x.genre === m.genre;
    for (const x of shuffle(items(d), rng)) {
      if (!sameKind(x) || usedBases.has(x.base)) continue;
      if (containsLoosely(quote, x.name) || containsLoosely(quote, x.base)) continue;
      usedBases.add(x.base);
      distractors.push(x.name);
    }
    return makeQuestion(
      {
        template: 'meisho.describe',
        key: m.id,
        prompt: describePrompt(quote, GENRE_NOUN[m.genre]),
        quote,
        answer: m.name,
        distractors,
        explanation: `「${m.name}」（${m.kana}）。${excerpt(m.description, 160)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

const era = defineTemplate<Meisho>({
  id: 'meisho.era',
  needs: 'meisho',
  candidates: (d) => items(d).filter((m) => m.era !== null && ERAS.includes(m.era)),
  key: (m) => m.id,
  build(m, _d, rng, level = 'normal') {
    const i = ERAS.indexOf(m.era!);
    const gap = (e: string) => Math.abs(ERAS.indexOf(e) - i);
    // 近い時代ほど紛らわしい。かんたんは 2 時代以上離れたものから 3 つ、
    // ふつうは近い 4 つから 3 つ、むずかしいはいちばん近い 3 つ
    const byGap = shuffle(
      ERAS.filter((e) => e !== m.era),
      rng,
    ).sort((a, b) => gap(a) - gap(b));
    const eras =
      level === 'easy'
        ? sample(
            byGap.filter((e) => gap(e) >= 2),
            3,
            rng,
          )
        : level === 'hard'
          ? byGap.slice(0, 3)
          : sample(byGap.slice(0, 4), 3, rng);
    const what = m.genre === 'kenzobutsu' ? '建築' : '作';
    return makeQuestion(
      {
        template: 'meisho.era',
        key: m.id,
        prompt: `「${m.name}」は何時代の${what}？`,
        answer: `${m.era}時代`,
        distractors: eras.map((e) => `${e}時代`),
        explanation: `京都観光Navi の説明文：「${leadOf(m)}」`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

const designation = defineTemplate<Meisho>({
  id: 'meisho.designation',
  needs: 'meisho',
  candidates: (d) =>
    items(d).filter((m) => m.designation !== null && !/国宝|重文|重要文化財/.test(m.name)),
  key: (m) => m.id,
  build(m, _d, rng) {
    const other = m.designation === '国宝' ? '重要文化財' : '国宝';
    return makeQuestion(
      {
        template: 'meisho.designation',
        key: m.id,
        prompt: `「${m.name}」の文化財の指定は？`,
        answer: m.designation!,
        distractors: [other],
        minChoices: 2,
        explanation: `京都観光Navi の説明文：「${leadOf(m)}」（指定は 2021年3月時点のデータによります）`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

const KANA_GENRES: MeishoGenre[] = ['chimei', 'yama', 'kawa', 'mizu', 'ike', 'machinami', 'kofun'];

const kanaCandidates = (d: { meisho?: { items: Meisho[] } }): Meisho[] =>
  items(d).filter((m) => KANA_GENRES.includes(m.genre) && KANJI_ONLY.test(m.name) && m.kana !== '');

const kana = defineTemplate<Meisho>({
  id: 'meisho.kana',
  needs: 'meisho',
  candidates: kanaCandidates,
  key: (m) => m.id,
  build(m, d, rng, level = 'normal') {
    const pool = kanaCandidates(d)
      .filter((x) => x.id !== m.id)
      .map((x) => x.kana);
    return makeQuestion(
      {
        template: 'meisho.kana',
        key: m.id,
        prompt: `「${m.name}」の読みは？`,
        answer: m.kana,
        distractors: kanaDistractors(m.kana, pool, level, rng),
        explanation: `「${m.name}」は「${m.kana}」と読みます。${excerpt(m.description, 100)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

/** 名前に区名が入っていると答えが分かってしまうので除く（「北」「南」の 1 文字の区は判定しない）。 */
export function wardLeaks(name: string, ward: Ward): boolean {
  return ward.length > 1 && containsLoosely(name, ward);
}

/**
 * 区を問うのは、それ自体が場所であるものだけ。
 * 美術品などは寺社ではなく寄託先（京都国立博物館など）の住所が入っていることがある。
 */
const WARD_GENRES: MeishoGenre[] = [
  'kenzobutsu',
  'meiboku',
  'chimei',
  'yama',
  'kawa',
  'mizu',
  'ike',
  'komainu',
  'kofun',
];

const ward = defineTemplate<Meisho>({
  id: 'meisho.ward',
  needs: 'meisho',
  candidates: (d) =>
    items(d).filter(
      (m) => m.ward !== null && WARD_GENRES.includes(m.genre) && !wardLeaks(m.name, m.ward),
    ),
  key: (m) => m.id,
  build(m, d, rng, level = 'normal') {
    return makeQuestion(
      {
        template: 'meisho.ward',
        key: m.id,
        prompt: `「${m.name}」があるのは何区？`,
        answer: `${m.ward}区`,
        distractors: wardDistractors(d, m.ward!, level, rng).map((w) => `${w}区`),
        explanation: `「${m.name}」は京都市${m.ward}区にあります（京都観光Navi の住所による）。`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

export const MEISHO_TEMPLATES: AnyTemplate[] = [describe, era, designation, kana, ward];

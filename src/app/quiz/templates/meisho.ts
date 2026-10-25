import type { Meisho, MeishoGenre, Ward } from '../../data/types';
import { WARDS } from '../../data/types';
import { makeQuestion } from '../make';
import { sample, shuffle } from '../rng';
import { containsLoosely, excerpt, maskTerms, maskText } from '../text';
import {
  byLengthCloseness,
  defineTemplate,
  KANJI_ONLY,
  memoByObject,
  type AnyTemplate,
} from './common';

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
const firstSentence = (m: Meisho) => `${m.description.split('。')[0]}。`;

const quoteOf = memoByObject((m: Meisho) =>
  maskText(excerpt(m.description, 120), [...maskTerms(m.name, m.kana), ...maskTerms(m.base, '')]),
);

const describeCandidates = memoByObject((all: Meisho[]): Meisho[] => {
  const bases = new Map<MeishoGenre, Set<string>>();
  for (const m of all) {
    if (!bases.has(m.genre)) bases.set(m.genre, new Set());
    bases.get(m.genre)!.add(m.base);
  }
  return all.filter(
    (m) =>
      m.genre !== 'other' &&
      (bases.get(m.genre)?.size ?? 0) >= 4 &&
      quoteOf(m).replace(/〇〇/g, '').length >= 8,
  );
});

const describe = defineTemplate<Meisho>({
  id: 'meisho.describe',
  needs: 'meisho',
  candidates: (d) => (d.meisho ? describeCandidates(d.meisho.items) : []),
  key: (m) => m.id,
  build(m, d, rng) {
    const quote = quoteOf(m);
    const usedBases = new Set([m.base]);
    const distractors: string[] = [];
    for (const x of shuffle(items(d), rng)) {
      if (x.genre !== m.genre || usedBases.has(x.base)) continue;
      if (containsLoosely(quote, x.name) || containsLoosely(quote, x.base)) continue;
      usedBases.add(x.base);
      distractors.push(x.name);
    }
    return makeQuestion(
      {
        template: 'meisho.describe',
        key: m.id,
        prompt: `京都観光Navi の説明文です。〇〇に当てはまる${GENRE_NOUN[m.genre]}は？`,
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
  build(m, _d, rng) {
    const i = ERAS.indexOf(m.era!);
    // 近い時代ほど紛らわしいので、近い 4 つから 3 つを誤答にする
    const near = ERAS.filter((e) => e !== m.era)
      .sort((a, b) => Math.abs(ERAS.indexOf(a) - i) - Math.abs(ERAS.indexOf(b) - i))
      .slice(0, 4);
    const what = m.genre === 'kenzobutsu' ? '建築' : '作';
    return makeQuestion(
      {
        template: 'meisho.era',
        key: m.id,
        prompt: `「${m.name}」は何時代の${what}？`,
        answer: `${m.era}時代`,
        distractors: sample(near, 3, rng).map((e) => `${e}時代`),
        explanation: `京都観光Navi の説明文：「${firstSentence(m)}」`,
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
        explanation: `京都観光Navi の説明文：「${firstSentence(m)}」（指定は 2021年3月時点のデータによります）`,
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
  build(m, d, rng) {
    const pool = kanaCandidates(d)
      .filter((x) => x.id !== m.id)
      .map((x) => x.kana);
    return makeQuestion(
      {
        template: 'meisho.kana',
        key: m.id,
        prompt: `「${m.name}」の読みは？`,
        answer: m.kana,
        distractors: byLengthCloseness(m.kana, pool, rng),
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
  build(m, _d, rng) {
    return makeQuestion(
      {
        template: 'meisho.ward',
        key: m.id,
        prompt: `「${m.name}」があるのは何区？`,
        answer: `${m.ward}区`,
        distractors: sample(
          WARDS.filter((w) => w !== m.ward),
          3,
          rng,
        ).map((w) => `${w}区`),
        explanation: `「${m.name}」は京都市${m.ward}区にあります（京都観光Navi の住所による）。`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

export const MEISHO_TEMPLATES: AnyTemplate[] = [describe, era, designation, kana, ward];

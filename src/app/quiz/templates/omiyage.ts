import type { Omiyage } from '../../data/types';
import { makeQuestion } from '../make';
import type { Level } from '../question';
import { shuffle } from '../rng';
import { containsLoosely, excerpt, firstSentence, maskTerms, maskText } from '../text';
import {
  countBy,
  defineTemplate,
  describePrompt,
  kanaDistractors,
  KANJI_ONLY,
  memoByObject,
  type AnyTemplate,
} from './common';

const SOURCES = ['kyoto-navi'];

const items = (d: { omiyage?: { items: Omiyage[] } }) => d.omiyage?.items ?? [];

const quoteOf = memoByObject((o: Omiyage) =>
  maskText(excerpt(o.description, 120), maskTerms(o.name, o.kana)),
);
/** むずかしいは手がかりを減らすため、最初の 1 文だけを引用する。 */
const shortQuoteOf = memoByObject((o: Omiyage) =>
  maskText(firstSentence(o.description), maskTerms(o.name, o.kana)),
);
const quoteFor = (o: Omiyage, level: Level) => (level === 'hard' ? shortQuoteOf(o) : quoteOf(o));
const clueLength = (quote: string) => quote.replace(/〇〇/g, '').length;

const describe = defineTemplate<Omiyage>({
  id: 'omiyage.describe',
  needs: 'omiyage',
  candidates(d, level = 'normal') {
    const all = items(d);
    const perGenre = countBy(all, (o) => o.genre);
    return all.filter(
      (o) =>
        (perGenre.get(o.genre) ?? 0) >= 4 &&
        clueLength(quoteOf(o)) >= 20 &&
        (level !== 'hard' || clueLength(shortQuoteOf(o)) >= 15),
    );
  },
  key: (o) => o.id,
  build(o, d, rng, level = 'normal') {
    const quote = quoteFor(o, level);
    // かんたんは別の種類（名物なら工芸品）を誤答にして、種類で絞り込めるようにする
    const pool = items(d).filter(
      (x) =>
        x.id !== o.id &&
        (level === 'easy' ? x.genre !== o.genre : x.genre === o.genre) &&
        !containsLoosely(quote, x.name),
    );
    return makeQuestion(
      {
        template: 'omiyage.describe',
        key: o.id,
        prompt: describePrompt(quote, 'お土産'),
        quote,
        answer: o.name,
        distractors: shuffle(pool, rng).map((x) => x.name),
        explanation: `「${o.name}」（${o.kana}）。${excerpt(o.description, 160)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

const kanaCandidates = (d: { omiyage?: { items: Omiyage[] } }): Omiyage[] =>
  items(d).filter((o) => KANJI_ONLY.test(o.name) && o.kana.length > 0);

const kana = defineTemplate<Omiyage>({
  id: 'omiyage.kana',
  needs: 'omiyage',
  candidates: kanaCandidates,
  key: (o) => o.id,
  build(o, d, rng, level = 'normal') {
    const pool = kanaCandidates(d)
      .filter((x) => x.id !== o.id)
      .map((x) => x.kana);
    return makeQuestion(
      {
        template: 'omiyage.kana',
        key: o.id,
        prompt: `「${o.name}」の読みは？`,
        answer: o.kana,
        distractors: kanaDistractors(o.kana, pool, level, rng),
        explanation: `「${o.name}」は「${o.kana}」と読みます。${excerpt(o.description, 100)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

export const OMIYAGE_TEMPLATES: AnyTemplate[] = [describe, kana];

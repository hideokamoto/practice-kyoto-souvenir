import type { Omiyage } from '../../data/types';
import { makeQuestion } from '../make';
import { shuffle } from '../rng';
import { containsLoosely, excerpt, maskTerms, maskText } from '../text';
import {
  byLengthCloseness,
  countBy,
  defineTemplate,
  KANJI_ONLY,
  memoByObject,
  type AnyTemplate,
} from './common';

const SOURCES = ['kyoto-navi'];

const items = (d: { omiyage?: { items: Omiyage[] } }) => d.omiyage?.items ?? [];

const quoteOf = memoByObject((o: Omiyage) =>
  maskText(excerpt(o.description, 120), maskTerms(o.name, o.kana)),
);

const describe = defineTemplate<Omiyage>({
  id: 'omiyage.describe',
  needs: 'omiyage',
  candidates(d) {
    const all = items(d);
    const perGenre = countBy(all, (o) => o.genre);
    return all.filter(
      (o) => (perGenre.get(o.genre) ?? 0) >= 4 && quoteOf(o).replace(/〇〇/g, '').length >= 20,
    );
  },
  key: (o) => o.id,
  build(o, d, rng) {
    const quote = quoteOf(o);
    const pool = items(d).filter(
      (x) => x.id !== o.id && x.genre === o.genre && !containsLoosely(quote, x.name),
    );
    return makeQuestion(
      {
        template: 'omiyage.describe',
        key: o.id,
        prompt: '京都観光Navi の説明文です。〇〇に当てはまるお土産は？',
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
  build(o, d, rng) {
    const pool = kanaCandidates(d)
      .filter((x) => x.id !== o.id)
      .map((x) => x.kana);
    return makeQuestion(
      {
        template: 'omiyage.kana',
        key: o.id,
        prompt: `「${o.name}」の読みは？`,
        answer: o.kana,
        distractors: byLengthCloseness(o.kana, pool, rng),
        explanation: `「${o.name}」は「${o.kana}」と読みます。${excerpt(o.description, 100)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

export const OMIYAGE_TEMPLATES: AnyTemplate[] = [describe, kana];

import type { KakeiData, KakeiItem } from '../../data/types';
import { makeQuestion } from '../make';
import { shuffle } from '../rng';
import { containsLoosely } from '../text';
import { defineTemplate, fmtNumber, type AnyTemplate } from './common';

const SOURCES = ['kakei'];
const KYOTO = '京都市';

const data = (d: { kakei?: KakeiData }) => d.kakei;
const items = (d: { kakei?: KakeiData }) => d.kakei?.items ?? [];
const measureLabel = (i: KakeiItem) => (i.measure === 'amount' ? '年間支出金額' : '年間購入数量');
const value = (v: number, i: KakeiItem) => `${fmtNumber(v)}${i.unit}`;
const keyOf = (i: KakeiItem) => `${i.group}/${i.item}/${i.measure}`;
const note = (d: KakeiData) => `${d.period}、二人以上の世帯の 1 世帯あたり。`;

const first = defineTemplate<KakeiItem>({
  id: 'kakei.first',
  needs: 'kakei',
  candidates: (d) => items(d).filter((i) => i.kyotoRank === 1),
  key: keyOf,
  build(i, d, rng) {
    const pool = items(d).filter(
      (x) =>
        x.measure === i.measure &&
        x.kyotoRank > x.cities / 2 &&
        !containsLoosely(x.item, i.item) &&
        !containsLoosely(i.item, x.item),
    );
    return makeQuestion(
      {
        template: 'kakei.first',
        key: keyOf(i),
        prompt: `京都市の 1 世帯あたり${measureLabel(i)}が、${i.cities}市の中で 1 位の品目は？`,
        answer: i.item,
        distractors: shuffle(pool, rng).map((x) => x.item),
        explanation: `「${i.item}」は京都市が ${i.cities}市中 1 位（${value(i.kyotoValue, i)}）。${note(data(d)!)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

function buckets(cities: number): { label: string; lo: number; hi: number }[] {
  return [
    { label: '1〜5位', lo: 1, hi: 5 },
    { label: '6〜15位', lo: 6, hi: 15 },
    { label: '16〜30位', lo: 16, hi: 30 },
    { label: `31〜${cities}位`, lo: 31, hi: cities },
  ];
}

const rank = defineTemplate<KakeiItem>({
  id: 'kakei.rank',
  needs: 'kakei',
  candidates: (d) => items(d).filter((i) => i.cities > 30),
  key: keyOf,
  build(i, d, rng) {
    const bs = buckets(i.cities);
    const answer = bs.find((b) => i.kyotoRank >= b.lo && i.kyotoRank <= b.hi)!;
    const topText =
      i.top.city === KYOTO ? '1位は京都市' : `1位は${i.top.city}（${value(i.top.value, i)}）`;
    return makeQuestion(
      {
        template: 'kakei.rank',
        key: keyOf(i),
        prompt: `京都市の「${i.item}」の 1 世帯あたり${measureLabel(i)}は、${i.cities}市中何位？`,
        answer: answer.label,
        distractors: bs.filter((b) => b !== answer).map((b) => b.label),
        explanation: `京都市は ${i.kyotoRank}位（${value(i.kyotoValue, i)}）。${topText}。${note(data(d)!)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

const topCity = defineTemplate<KakeiItem>({
  id: 'kakei.topCity',
  needs: 'kakei',
  candidates: (d) => items(d).filter((i) => i.kyotoRank >= 2 && i.kyotoRank <= 3),
  key: keyOf,
  build(i, d, rng) {
    const others = [...new Set(items(d).map((x) => x.top.city))].filter(
      (c) => c !== i.top.city && c !== KYOTO,
    );
    return makeQuestion(
      {
        template: 'kakei.topCity',
        key: keyOf(i),
        prompt: `「${i.item}」の 1 世帯あたり${measureLabel(i)}が ${i.cities}市中 1 位の都市は？`,
        answer: i.top.city,
        distractors: [KYOTO, ...shuffle(others, rng)],
        explanation: `1位は${i.top.city}（${value(i.top.value, i)}）、京都市は ${i.kyotoRank}位（${value(i.kyotoValue, i)}）。${note(data(d)!)}`,
        sources: SOURCES,
      },
      rng,
    );
  },
});

export const KAKEI_TEMPLATES: AnyTemplate[] = [first, rank, topCity];

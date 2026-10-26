import type { SangyoIndicator } from '../../data/types';
import { makeQuestion } from '../make';
import type { Level } from '../question';
import { sample, shuffle } from '../rng';
import { defineTemplate, fmtNumber, type AnyTemplate } from './common';

const KYOTO = '京都府';
const indicators = (d: { sangyo?: { indicators: SangyoIndicator[] } }) =>
  d.sangyo?.indicators ?? [];

/** 値の大きい順の順位。その都道府県が無いか、同じ値の都道府県があれば null。 */
export function prefRank(ind: SangyoIndicator, pref: string): number | null {
  const v = ind.values.find((x) => x.pref === pref);
  if (!v) return null;
  if (ind.values.some((x) => x.pref !== pref && x.value === v.value)) return null;
  return 1 + ind.values.filter((x) => x.value > v.value).length;
}

/** 「令和8年10月1日現在（注記…）」→ 問題文用の「令和8年10月1日現在」 */
const shortPeriod = (ind: SangyoIndicator) => ind.period.split('（')[0];
/** 注記があれば解説の末尾に付ける */
const periodNote = (ind: SangyoIndicator) =>
  ind.period === shortPeriod(ind) ? '' : `（${ind.period}）`;

const sorted = (ind: SangyoIndicator) => [...ind.values].sort((a, b) => b.value - a.value);
const val = (ind: SangyoIndicator, v: number) => `${fmtNumber(v)}${ind.unit}`;

function kyotoText(ind: SangyoIndicator): string {
  const r = prefRank(ind, KYOTO);
  const v = ind.values.find((x) => x.pref === KYOTO);
  return r && v ? `京都府は ${r}位（${val(ind, v.value)}）。` : '';
}

/**
 * 「全国 1 位は？」の誤答にする都道府県（値の大きい順に並べたうちの 2 位以下）。
 * かんたんは 6 位以下かつ下半分、ふつうは 2〜7 位に京都府を加えたもの、むずかしいは 2〜4 位。
 */
function firstDistractors(s: { pref: string }[], level: Level, rng: () => number): string[] {
  const rest = s.slice(1).map((x) => x.pref);
  if (level === 'easy') return shuffle(rest.slice(Math.max(4, Math.ceil(s.length / 2) - 1)), rng);
  if (level === 'hard') return rest.slice(0, 3);
  const others = rest.slice(0, 6);
  return s[0].pref === KYOTO
    ? shuffle(others, rng)
    : [
        KYOTO,
        ...shuffle(
          others.filter((p) => p !== KYOTO),
          rng,
        ),
      ];
}

const first = defineTemplate<SangyoIndicator>({
  id: 'sangyo.first',
  needs: 'sangyo',
  candidates: (d, level = 'normal') =>
    indicators(d).filter((i) => {
      const s = sorted(i);
      return s.length >= (level === 'easy' ? 9 : 4) && s[0].value > s[1].value;
    }),
  key: (i) => i.id,
  build(i, _d, rng, level = 'normal') {
    const s = sorted(i);
    const top = s[0];
    const distractors = firstDistractors(s, level, rng);
    return makeQuestion(
      {
        template: 'sangyo.first',
        key: i.id,
        prompt: `「${i.label}」（${shortPeriod(i)}）が全国 1 位の都道府県は？`,
        answer: top.pref,
        distractors,
        explanation: `1位は${top.pref}（${val(i, top.value)}）。${top.pref === KYOTO ? '' : kyotoText(i)}${periodNote(i)}`,
        sources: [i.source],
      },
      rng,
    );
  },
});

/**
 * 京都府の順位 r の誤答にする順位。かんたんは 5 位以上離れた順位、
 * ふつうは前後 4 位以内、むずかしいはいちばん近い 3 つ（前後 2 位以内）。
 */
function rankDistractors(r: number, n: number, level: Level, rng: () => number): number[] {
  const others = Array.from({ length: n }, (_, k) => k + 1).filter((x) => x !== r);
  const gap = (x: number) => Math.abs(x - r);
  if (level === 'easy')
    return sample(
      others.filter((x) => gap(x) >= 5),
      3,
      rng,
    );
  if (level === 'hard')
    return shuffle(others, rng)
      .sort((a, b) => gap(a) - gap(b))
      .slice(0, 3);
  return sample(
    others.filter((x) => gap(x) <= 4),
    3,
    rng,
  );
}

const kyotoRank = defineTemplate<SangyoIndicator>({
  id: 'sangyo.kyotoRank',
  needs: 'sangyo',
  candidates: (d, level = 'normal') =>
    indicators(d).filter((i) => {
      const r = prefRank(i, KYOTO);
      return (
        i.values.length >= 4 &&
        r !== null &&
        rankDistractors(r, i.values.length, level, () => 0).length === 3
      );
    }),
  key: (i) => i.id,
  build(i, _d, rng, level = 'normal') {
    const r = prefRank(i, KYOTO)!;
    const near = rankDistractors(r, i.values.length, level, rng);
    const top = sorted(i)[0];
    return makeQuestion(
      {
        template: 'sangyo.kyotoRank',
        key: i.id,
        prompt: `京都府の「${i.label}」（${shortPeriod(i)}）は全国何位？`,
        answer: `${r}位`,
        distractors: near.map((x) => `${x}位`),
        explanation: `${kyotoText(i)}${top.pref === KYOTO ? '' : `1位は${top.pref}（${val(i, top.value)}）。`}${periodNote(i)}`,
        sources: [i.source],
      },
      rng,
    );
  },
});

export const SANGYO_TEMPLATES: AnyTemplate[] = [first, kyotoRank];

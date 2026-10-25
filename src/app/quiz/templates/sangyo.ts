import type { SangyoIndicator } from '../../data/types';
import { makeQuestion } from '../make';
import { shuffle } from '../rng';
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

const first = defineTemplate<SangyoIndicator>({
  id: 'sangyo.first',
  needs: 'sangyo',
  candidates: (d) =>
    indicators(d).filter((i) => {
      const s = sorted(i);
      return s.length >= 4 && s[0].value > s[1].value;
    }),
  key: (i) => i.id,
  build(i, _d, rng) {
    const [top, ...rest] = sorted(i);
    const others = rest.slice(0, 6).map((x) => x.pref);
    const distractors =
      top.pref === KYOTO
        ? shuffle(others, rng)
        : [
            KYOTO,
            ...shuffle(
              others.filter((p) => p !== KYOTO),
              rng,
            ),
          ];
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

const kyotoRank = defineTemplate<SangyoIndicator>({
  id: 'sangyo.kyotoRank',
  needs: 'sangyo',
  candidates: (d) =>
    indicators(d).filter((i) => i.values.length >= 4 && prefRank(i, KYOTO) !== null),
  key: (i) => i.id,
  build(i, _d, rng) {
    const r = prefRank(i, KYOTO)!;
    const n = i.values.length;
    const near = Array.from({ length: n }, (_, k) => k + 1)
      .filter((x) => x !== r)
      .sort((a, b) => Math.abs(a - r) - Math.abs(b - r) || rng() - 0.5)
      .slice(0, 3);
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

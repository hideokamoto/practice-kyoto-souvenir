import type { Kanko } from '../../data/types';
import { makeQuestion } from '../make';
import type { Level } from '../question';
import { shuffle } from '../rng';
import { containsLoosely, excerpt } from '../text';
import { defineTemplate, type AnyTemplate } from './common';
import { distanceKm, wardDistractors } from './geo';
import { wardLeaks } from './meisho';

export { distanceKm, wardCentroids } from './geo';

const items = (d: { kanko?: { items: Kanko[] } }) => d.kanko?.items ?? [];

const km = (d: number) => `約${d.toFixed(1)}km`;

/** 航空写真で見て分かる見込みのある施設（寺社・城・庭園など）だけを対象にする。 */
const AERIAL_NAME = /(寺|神社|神宮|大社|宮|城|御所|離宮|庭園|塔|山荘|大橋)$/;
/**
 * 誤答にする施設の、正解からの距離（km）。1.5km 未満は写真の端に写り込むと正解が 2 つになるので使わない。
 * かんたんは遠い施設、むずかしいは近所の施設を誤答にする。
 */
const AERIAL_RANGE: Record<Level, [number, number]> = {
  easy: [5, Infinity],
  normal: [1.5, Infinity],
  hard: [1.5, 4],
};

const aerialCandidates = (d: { kanko?: { items: Kanko[] } }): Kanko[] =>
  items(d).filter((k) => AERIAL_NAME.test(k.name));

const aerial = defineTemplate<Kanko>({
  id: 'kanko.aerial',
  needs: 'kanko',
  candidates: aerialCandidates,
  key: (k) => k.id,
  build(k, d, rng, level = 'normal') {
    const [min, max] = AERIAL_RANGE[level];
    const pool = aerialCandidates(d).filter((x) => {
      const km = distanceKm(k, x);
      return x.id !== k.id && km >= min && km <= max;
    });
    return makeQuestion(
      {
        template: 'kanko.aerial',
        key: k.id,
        prompt: '航空写真の中心（赤い印）にあるのは？',
        media: {
          kind: 'aerial',
          lat: k.lat,
          lon: k.lon,
          zoom: 17,
          alt: '国土地理院の航空写真。中心に赤い印。',
        },
        answer: k.name,
        distractors: shuffle(pool, rng).map((x) => x.name),
        explanation: `${k.name}（京都市${k.ward}区）。${excerpt(k.description, 100)}`,
        sources: ['kyoto-kanko', 'gsi'],
      },
      rng,
    );
  },
});

const ward = defineTemplate<Kanko>({
  id: 'kanko.ward',
  needs: 'kanko',
  // ホテルや店の所在区は京都の知識では解けないので、寺社などの名所に限る
  candidates: (d) => aerialCandidates(d).filter((k) => !wardLeaks(k.name, k.ward)),
  key: (k) => k.id,
  build(k, d, rng, level = 'normal') {
    return makeQuestion(
      {
        template: 'kanko.ward',
        key: k.id,
        prompt: `「${k.name}」があるのは何区？`,
        answer: `${k.ward}区`,
        distractors: wardDistractors(d, k.ward, level, rng).map((w) => `${w}区`),
        explanation: `「${k.name}」は京都市${k.ward}区にあります。${excerpt(k.description, 80)}`,
        sources: ['kyoto-kanko'],
      },
      rng,
    );
  },
});

const NEAREST_MAX_KM = 3;
/**
 * 誤答にする施設の距離を、正解の距離 a から決める。どの段階でも a の 1.6 倍以上
 * （座標の誤差で順位が入れ替わらないように）。かんたんは 3 倍以上、むずかしいは近所の施設に限る。
 */
const FAR_RANGE: Record<Level, (a: number) => [number, number]> = {
  easy: (a) => [a * 3, 8],
  normal: (a) => [a * 1.6, 8],
  hard: (a) => [a * 1.6, Math.max(3, a * 2.5)],
};

const nearest = defineTemplate<Kanko>({
  id: 'kanko.nearest',
  needs: 'kanko',
  // 起点も選択肢も、寺社などの名所に限る（ホテルや店は京都の知識では解けないため）
  candidates: aerialCandidates,
  key: (k) => k.id,
  build(k, d, rng, level = 'normal') {
    const others = aerialCandidates(d)
      .filter(
        (x) =>
          x.id !== k.id && !containsLoosely(x.name, k.name) && !containsLoosely(k.name, x.name),
      )
      .map((x) => ({ x, d: distanceKm(k, x) }))
      .sort((a, b) => a.d - b.d);
    const near = others[0];
    if (!near || near.d > NEAREST_MAX_KM) return null;
    const [min, max] = FAR_RANGE[level](near.d);
    const far = shuffle(
      others.filter((o) => o.d >= min && o.d <= max),
      rng,
    ).slice(0, 3);
    if (far.length < 3) return null;
    const listed = [near, ...far].sort((a, b) => a.d - b.d).map((o) => `${o.x.name} ${km(o.d)}`);
    return makeQuestion(
      {
        template: 'kanko.nearest',
        key: k.id,
        prompt: `「${k.name}」から直線距離でいちばん近いのは？`,
        answer: near.x.name,
        distractors: far.map((o) => o.x.name),
        explanation: `「${k.name}」からの直線距離：${listed.join('、')}（座標は京都府観光施設一覧による）。`,
        sources: ['kyoto-kanko'],
      },
      rng,
    );
  },
});

export const KANKO_TEMPLATES: AnyTemplate[] = [aerial, ward, nearest];

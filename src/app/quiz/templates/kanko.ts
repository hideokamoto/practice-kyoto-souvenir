import type { Kanko } from '../../data/types';
import { WARDS } from '../../data/types';
import { makeQuestion } from '../make';
import { sample, shuffle } from '../rng';
import { containsLoosely, excerpt } from '../text';
import { defineTemplate, type AnyTemplate } from './common';
import { wardLeaks } from './meisho';

const items = (d: { kanko?: { items: Kanko[] } }) => d.kanko?.items ?? [];

/** 2 点間の大円距離（km）。 */
export function distanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const km = (d: number) => `約${d.toFixed(1)}km`;

/** 航空写真で見て分かる見込みのある施設（寺社・城・庭園など）だけを対象にする。 */
const AERIAL_NAME = /(寺|神社|神宮|大社|宮|城|御所|離宮|庭園|塔|山荘|大橋)$/;
/** 誤答は正解からこれ以上離れた施設に限る（写真の端に写り込むと正解が 2 つになるため）。 */
const AERIAL_MIN_KM = 1.5;

const aerialCandidates = (d: { kanko?: { items: Kanko[] } }): Kanko[] =>
  items(d).filter((k) => AERIAL_NAME.test(k.name));

const aerial = defineTemplate<Kanko>({
  id: 'kanko.aerial',
  needs: 'kanko',
  candidates: aerialCandidates,
  key: (k) => k.id,
  build(k, d, rng) {
    const pool = aerialCandidates(d).filter(
      (x) => x.id !== k.id && distanceKm(k, x) >= AERIAL_MIN_KM,
    );
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
  candidates: (d) => items(d).filter((k) => !wardLeaks(k.name, k.ward)),
  key: (k) => k.id,
  build(k, _d, rng) {
    return makeQuestion(
      {
        template: 'kanko.ward',
        key: k.id,
        prompt: `「${k.name}」があるのは何区？`,
        answer: `${k.ward}区`,
        distractors: sample(
          WARDS.filter((w) => w !== k.ward),
          3,
          rng,
        ).map((w) => `${w}区`),
        explanation: `「${k.name}」は京都市${k.ward}区にあります。${excerpt(k.description, 80)}`,
        sources: ['kyoto-kanko'],
      },
      rng,
    );
  },
});

/** 正解は誤答よりこの倍率以上近いこと（座標の誤差で順位が入れ替わらないように）。 */
const NEAREST_MARGIN = 1.6;
const NEAREST_MAX_KM = 3;
const FAR_MAX_KM = 8;

const nearest = defineTemplate<Kanko>({
  id: 'kanko.nearest',
  needs: 'kanko',
  // 起点も選択肢も、寺社などの名所に限る（ホテルや店は京都の知識では解けないため）
  candidates: aerialCandidates,
  key: (k) => k.id,
  build(k, d, rng) {
    const others = aerialCandidates(d)
      .filter(
        (x) =>
          x.id !== k.id && !containsLoosely(x.name, k.name) && !containsLoosely(k.name, x.name),
      )
      .map((x) => ({ x, d: distanceKm(k, x) }))
      .sort((a, b) => a.d - b.d);
    const near = others[0];
    if (!near || near.d > NEAREST_MAX_KM) return null;
    const far = shuffle(
      others.filter((o) => o.d >= near.d * NEAREST_MARGIN && o.d <= FAR_MAX_KM),
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

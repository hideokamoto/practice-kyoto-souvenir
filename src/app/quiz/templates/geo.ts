import type { Kanko, Ward } from '../../data/types';
import { WARDS } from '../../data/types';
import type { Datasets, Level } from '../question';
import { sample, type Rng } from '../rng';
import { memoByObject } from './common';

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

type Point = { lat: number; lon: number };

const centroidsOf = memoByObject((items: Kanko[]): Map<Ward, Point> => {
  const sum = new Map<Ward, { lat: number; lon: number; n: number }>();
  for (const k of items) {
    const s = sum.get(k.ward) ?? { lat: 0, lon: 0, n: 0 };
    sum.set(k.ward, { lat: s.lat + k.lat, lon: s.lon + k.lon, n: s.n + 1 });
  }
  return new Map([...sum].map(([w, s]) => [w, { lat: s.lat / s.n, lon: s.lon / s.n }]));
});

/** 区の中心（京都府観光施設一覧の、その区の施設の座標の平均）。観光施設のデータが無ければ空。 */
export function wardCentroids(d: Datasets): Map<Ward, Point> {
  return d.kanko ? centroidsOf(d.kanko.items) : new Map();
}

/**
 * 「何区？」の誤答 3 つ。かんたんは中心が遠い区、むずかしいは近い区、ふつうはランダム。
 * 区の中心が求められない（観光施設のデータが無い）ときはランダム。
 */
export function wardDistractors(d: Datasets, ward: Ward, level: Level, rng: Rng): Ward[] {
  const others = WARDS.filter((w) => w !== ward);
  const c = wardCentroids(d);
  const from = c.get(ward);
  if (level === 'normal' || !from || others.some((w) => !c.has(w))) return sample(others, 3, rng);
  const byDistance = [...others].sort(
    (a, b) => distanceKm(from, c.get(a)!) - distanceKm(from, c.get(b)!),
  );
  return level === 'hard' ? byDistance.slice(0, 3) : byDistance.slice(-3);
}

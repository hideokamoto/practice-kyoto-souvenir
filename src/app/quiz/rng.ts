/** 0 以上 1 未満を返す乱数。テスト・日替わり・紹介動画の撮影でシードを固定できるよう、Math.random を直接使わない。 */
export type Rng = () => number;

/** mulberry32: 32bit シードの小さな擬似乱数。 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a（32bit）。日付文字列などからシードを作る。 */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function shuffle<T>(xs: readonly T[], rng: Rng): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 重複なしで n 件取る。足りなければあるだけ返す。 */
export function sample<T>(xs: readonly T[], n: number, rng: Rng): T[] {
  return shuffle(xs, rng).slice(0, n);
}

export function pickOne<T>(xs: readonly T[], rng: Rng): T {
  if (xs.length === 0) throw new Error('pickOne: 空の配列');
  return xs[Math.floor(rng() * xs.length)];
}

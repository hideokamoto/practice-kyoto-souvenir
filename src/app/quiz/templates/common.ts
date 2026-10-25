import type { Template } from '../question';

// テンプレートは対象の型がばらばらなので、一覧にするときはこの型でまとめる。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplate = Template<any>;

export function defineTemplate<E>(t: Template<E>): Template<E> {
  return t;
}

export function fmtNumber(n: number): string {
  return n.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
}

/** 文字列の配列を、指定したキーでグループ分けした件数にする。 */
export function countBy<T>(xs: readonly T[], key: (x: T) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const x of xs) m.set(key(x), (m.get(key(x)) ?? 0) + 1);
  return m;
}

export const KANJI_ONLY = /^[一-鿿々ヶ]+$/;

/** 読みの誤答候補を、文字数が近いものから並べる（同じ近さの中はランダム）。 */
export function byLengthCloseness(
  answer: string,
  pool: readonly string[],
  rng: () => number,
): string[] {
  return pool
    .map((k) => ({ k, d: Math.abs(k.length - answer.length) + rng() * 0.5 }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.k);
}

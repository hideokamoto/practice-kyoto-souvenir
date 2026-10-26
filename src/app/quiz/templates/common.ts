import type { Level, Template } from '../question';
import { shuffle, type Rng } from '../rng';

// テンプレートは対象の型がばらばらなので、一覧にするときはこの型でまとめる。
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyTemplate = Template<any>;

export function defineTemplate<E>(t: Template<E>): Template<E> {
  return t;
}

/**
 * 元データのオブジェクトごとに 1 回だけ計算して覚えておく（データは読み込み後に変わらない）。
 * 全件の伏せ字処理のような重い計算を、出題のたびにやり直さないために使う。
 */
export function memoByObject<K extends object, R>(fn: (k: K) => R): (k: K) => R {
  const cache = new WeakMap<K, R>();
  return (k) => {
    if (!cache.has(k)) cache.set(k, fn(k));
    return cache.get(k)!;
  };
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

/** 説明文の引用から名前を当てる問題の問い。引用に伏せ字が無ければ「〇〇に当てはまる」とは聞かない。 */
export function describePrompt(quote: string, noun: string): string {
  return quote.includes('〇〇')
    ? `京都観光Navi の説明文です。〇〇に当てはまる${noun}は？`
    : `京都観光Navi の説明文です。説明されている${noun}は？`;
}

export const KANJI_ONLY = /^[一-鿿々ヶ]+$/;

const len = (s: string) => [...s].length;

/**
 * 読みの誤答候補。かんたんは文字数が 2 以上違う読み、ふつうは文字数が近いものから
 * （同じ近さの中はランダム）、むずかしいは文字数の差が 1 以内で、頭の文字が同じ読みを優先する。
 */
export function kanaDistractors(
  answer: string,
  pool: readonly string[],
  level: Level,
  rng: Rng,
): string[] {
  const diff = (k: string) => Math.abs(len(k) - len(answer));
  if (level === 'easy')
    return shuffle(
      pool.filter((k) => diff(k) >= 2),
      rng,
    );
  if (level === 'hard') {
    return shuffle(
      pool.filter((k) => diff(k) <= 1),
      rng,
    ).sort((a, b) => Number(b[0] === answer[0]) - Number(a[0] === answer[0]));
  }
  return pool
    .map((k) => ({ k, d: diff(k) + rng() * 0.5 }))
    .sort((a, b) => a.d - b.d)
    .map((x) => x.k);
}

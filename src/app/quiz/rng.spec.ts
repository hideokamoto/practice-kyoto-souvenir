import { hashSeed, mulberry32, sample, shuffle } from './rng';

describe('rng', () => {
  it('同じシードなら同じ列を返す', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(xs);
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('hashSeed は文字列ごとに安定した 32bit 整数を返す', () => {
    expect(hashSeed('2026-10-25')).toBe(hashSeed('2026-10-25'));
    expect(hashSeed('2026-10-25')).not.toBe(hashSeed('2026-10-26'));
    expect(Number.isInteger(hashSeed('x'))).toBe(true);
    expect(hashSeed('x')).toBeGreaterThanOrEqual(0);
  });

  it('shuffle は元の配列を変えず、要素を並べ替えるだけ', () => {
    const xs = [1, 2, 3, 4, 5, 6];
    const ys = shuffle(xs, mulberry32(1));
    expect(xs).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...ys].sort()).toEqual(xs);
  });

  it('sample は重複なしで n 件、足りなければあるだけ返す', () => {
    const s = sample([1, 2, 3, 4, 5], 3, mulberry32(3));
    expect(s.length).toBe(3);
    expect(new Set(s).size).toBe(3);
    expect(sample([1, 2], 5, mulberry32(3)).length).toBe(2);
  });
});

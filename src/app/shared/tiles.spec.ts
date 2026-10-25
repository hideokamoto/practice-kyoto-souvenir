import { tilePosition } from './tiles';

describe('tilePosition（緯度経度 → タイル座標）', () => {
  it('経度 0・緯度 0 はズーム 1 で中央（x=1, y=1）', () => {
    const p = tilePosition(0, 0, 1);
    expect(p.x).toBeCloseTo(1, 6);
    expect(p.y).toBeCloseTo(1, 6);
  });

  it('経度 -180 は x=0、緯度 85.0511 は y≒0', () => {
    expect(tilePosition(0, -180, 5).x).toBeCloseTo(0, 6);
    expect(tilePosition(85.05112878, 0, 5).y).toBeCloseTo(0, 4);
  });

  it('東へ行くほど x が増え、北へ行くほど y が減る', () => {
    const a = tilePosition(35, 135.7, 17);
    expect(tilePosition(35, 135.8, 17).x).toBeGreaterThan(a.x);
    expect(tilePosition(35.1, 135.7, 17).y).toBeLessThan(a.y);
  });
});

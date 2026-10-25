import { buildDaily, buildGame, jstDate, MODES, QUESTIONS_PER_GAME, rankFor } from './game';
import type { Datasets, Template } from './question';
import { mulberry32 } from './rng';
import { makeQuestion } from './make';

// 出題対象が数字だけの簡単なテンプレートで、組み立ての規則だけを確かめる。
const fake = (id: string, n: number, needs: Template['needs'] = 'omiyage'): Template<number> => ({
  id,
  needs,
  candidates: () => Array.from({ length: n }, (_, i) => i),
  key: (i) => String(i),
  build: (i, _d, rng) =>
    makeQuestion(
      {
        template: id,
        key: String(i),
        prompt: `${id} ${i}`,
        answer: `正解${i}`,
        distractors: ['x', 'y', 'z'],
        explanation: 'e',
        sources: ['s'],
      },
      rng,
    ),
});

describe('buildGame', () => {
  it('5 問、id が重複しない', () => {
    const qs = buildGame([fake('t1', 20), fake('t2', 20)], {}, mulberry32(1));
    expect(qs.length).toBe(QUESTIONS_PER_GAME);
    expect(new Set(qs.map((q) => q.id)).size).toBe(QUESTIONS_PER_GAME);
  });

  it('テンプレートを順番に回す（5 種類あれば全部 1 回ずつ）', () => {
    const ts = ['a', 'b', 'c', 'd', 'e'].map((id) => fake(id, 10));
    const qs = buildGame(ts, {}, mulberry32(7));
    expect(new Set(qs.map((q) => q.template)).size).toBe(5);
  });

  it('同じデータセットの同じ対象は、テンプレートが違っても 1 プレイで 1 回だけ', () => {
    const qs = buildGame([fake('t1', 3), fake('t2', 3)], {}, mulberry32(3));
    const keys = qs.map((q) => q.id.split(':')[1]);
    expect(new Set(keys).size).toBe(keys.length);
    expect(qs.length).toBe(3);
  });

  it('作れない対象は飛ばして、作れるものだけで埋める', () => {
    const broken: Template<number> = { ...fake('broken', 50), build: () => null };
    const qs = buildGame([broken, fake('ok', 10)], {}, mulberry32(2));
    expect(qs.length).toBe(5);
    expect(qs.every((q) => q.template === 'ok')).toBe(true);
  });

  it('同じシードなら同じ出題', () => {
    const ts = [fake('t1', 30), fake('t2', 30)];
    expect(buildGame(ts, {}, mulberry32(9))).toEqual(buildGame(ts, {}, mulberry32(9)));
  });
});

describe('MODES', () => {
  it('7 モード（6 つのデータ別と今日の 5 問）があり、テンプレートは重複しない', () => {
    expect(MODES.map((m) => m.id)).toEqual([
      'omiyage',
      'meisho',
      'kakei',
      'kanko',
      'shaji',
      'sangyo',
      'daily',
    ]);
    const ids = MODES.filter((m) => m.id !== 'daily').flatMap((m) => m.templates.map((t) => t.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MODES) {
      expect(m.label.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      for (const t of m.templates) expect(m.needs).toContain(t.needs);
    }
  });
});

describe('jstDate', () => {
  it('日本時間の日付を返す', () => {
    expect(jstDate(new Date('2026-10-25T14:59:59Z'))).toBe('2026-10-25');
    expect(jstDate(new Date('2026-10-25T15:00:00Z'))).toBe('2026-10-26');
  });
});

describe('buildDaily', () => {
  const ds: Datasets = {};
  const modes = ['omiyage', 'meisho', 'kakei', 'kanko', 'shaji', 'sangyo'] as const;
  const templates = modes.map((m) => fake(`${m}.t`, 20, m));

  it('日付が同じなら同じ 5 問、違えば違う 5 問', () => {
    const a = buildDaily('2026-10-25', templates, ds);
    expect(a.length).toBe(5);
    expect(buildDaily('2026-10-25', templates, ds)).toEqual(a);
    expect(buildDaily('2026-10-26', templates, ds)).not.toEqual(a);
  });

  it('5 問はすべて違うデータセットから出す', () => {
    const qs = buildDaily('2026-10-25', templates, ds);
    expect(new Set(qs.map((q) => q.template)).size).toBe(5);
  });
});

describe('rankFor', () => {
  it('正答数に応じた称号を返す', () => {
    const titles = [0, 1, 2, 3, 4, 5].map((s) => rankFor(s, 5));
    expect(new Set(titles).size).toBe(6);
    expect(rankFor(5, 5)).toBe(titles[5]);
    expect(rankFor(0, 0)).toBe(titles[0]);
  });
});

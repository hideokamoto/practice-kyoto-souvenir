import type { DatasetKey, Datasets, Level, Question } from './question';
import { hashSeed, mulberry32, shuffle, type Rng } from './rng';
import type { AnyTemplate } from './templates/common';
import { KAKEI_TEMPLATES } from './templates/kakei';
import { KANKO_TEMPLATES } from './templates/kanko';
import { MEISHO_TEMPLATES } from './templates/meisho';
import { OMIYAGE_TEMPLATES } from './templates/omiyage';
import { SANGYO_TEMPLATES } from './templates/sangyo';
import { SHAJI_TEMPLATES } from './templates/shaji';

export const QUESTIONS_PER_GAME = 5;

export type ModeId = Level | 'daily';

export interface ModeDef {
  id: ModeId;
  label: string;
  description: string;
  level: Level;
  needs: DatasetKey[];
  templates: AnyTemplate[];
}

const ALL_TEMPLATES: AnyTemplate[] = [
  ...OMIYAGE_TEMPLATES,
  ...MEISHO_TEMPLATES,
  ...KAKEI_TEMPLATES,
  ...KANKO_TEMPLATES,
  ...SHAJI_TEMPLATES,
  ...SANGYO_TEMPLATES,
];
const ALL_NEEDS: DatasetKey[] = ['omiyage', 'meisho', 'kakei', 'kanko', 'shaji', 'sangyo'];

// どのモードも全データ・全型から出す。難易度で変わるのは、選択肢の紛らわしさと題材の有名さ。
export const MODES: ModeDef[] = [
  {
    id: 'easy',
    label: 'かんたん',
    description: '有名どころが中心。誤答は種類や場所が離れていて、見当がつけやすい。',
    level: 'easy',
    needs: ALL_NEEDS,
    templates: ALL_TEMPLATES,
  },
  {
    id: 'normal',
    label: 'ふつう',
    description: '京都に何度か来た人向け。誤答はほどほどに紛らわしい。',
    level: 'normal',
    needs: ALL_NEEDS,
    templates: ALL_TEMPLATES,
  },
  {
    id: 'hard',
    label: 'むずかしい',
    description: '誤答は隣の区、近所の寺社、前後の順位、隣の時代。説明文も短い。',
    level: 'hard',
    needs: ALL_NEEDS,
    templates: ALL_TEMPLATES,
  },
  {
    id: 'daily',
    label: '今日の5問',
    description: '「ふつう」から日替わりで 5 問。同じ日なら誰でも同じ問題です。',
    level: 'normal',
    needs: ALL_NEEDS,
    templates: ALL_TEMPLATES,
  },
];

export function modeById(id: ModeId): ModeDef {
  const m = MODES.find((x) => x.id === id);
  if (!m) throw new Error(`未知のモード: ${id}`);
  return m;
}

/** 1 つのテンプレートで、作れない対象が続いたら諦める回数。 */
const MAX_TRIES_PER_TURN = 40;

/**
 * テンプレートを順番に回しながら n 問を作る。
 * 同じデータセットの同じ対象は、テンプレートが違っても 1 回だけ（解説が別の問題の答えになるため）。
 */
export function buildGame(
  templates: readonly AnyTemplate[],
  d: Datasets,
  rng: Rng,
  level: Level = 'normal',
  n = QUESTIONS_PER_GAME,
): Question[] {
  const cands = new Map(templates.map((t) => [t, t.candidates(d, level)]));
  const active = shuffle(
    templates.filter((t) => cands.get(t)!.length > 0),
    rng,
  );
  const queues = new Map(active.map((t) => [t, shuffle(cands.get(t)!, rng)]));
  const used = new Set<string>();
  const out: Question[] = [];
  let turn = 0;
  while (out.length < n && active.length > 0) {
    const idx = turn % active.length;
    const t = active[idx];
    const queue = queues.get(t)!;
    let built: Question | null = null;
    for (let tries = 0; queue.length > 0 && !built && tries < MAX_TRIES_PER_TURN; tries++) {
      const e = queue.pop();
      const entity = `${t.needs}:${t.key(e)}`;
      if (used.has(entity)) continue;
      built = t.build(e, d, rng, level);
      if (built) used.add(entity);
    }
    if (built) {
      out.push(built);
      turn++;
    } else {
      active.splice(idx, 1);
    }
  }
  return out;
}

/** 日本時間の日付（YYYY-MM-DD）。 */
export function jstDate(now: Date): string {
  return new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 日替わりの 5 問。データセットを 5 つ選び、それぞれから 1 問。日付が同じなら同じ問題になる。 */
export function buildDaily(
  date: string,
  templates: readonly AnyTemplate[],
  d: Datasets,
  level: Level = 'normal',
): Question[] {
  const rng = mulberry32(hashSeed(`daily:${date}`));
  const groups = new Map<DatasetKey, AnyTemplate[]>();
  for (const t of templates) groups.set(t.needs, [...(groups.get(t.needs) ?? []), t]);
  const out: Question[] = [];
  for (const key of shuffle([...groups.keys()], rng)) {
    if (out.length === QUESTIONS_PER_GAME) break;
    const [q] = buildGame(groups.get(key)!, d, rng, level, 1);
    if (q) out.push(q);
  }
  return out;
}

export function startGame(mode: ModeId, d: Datasets, now: Date, rng: Rng): Question[] {
  const m = modeById(mode);
  return mode === 'daily'
    ? buildDaily(jstDate(now), m.templates, d, m.level)
    : buildGame(m.templates, d, rng, m.level);
}

export function rankFor(score: number, total: number): string {
  const ratio = total === 0 ? 0 : score / total;
  if (ratio === 1) return 'いけず問答の免許皆伝';
  if (ratio >= 0.8) return '洛中のお人';
  if (ratio >= 0.6) return 'ぶぶ漬けの意味がわかる人';
  if (ratio >= 0.4) return 'まだまだ観光客';
  if (ratio > 0) return 'いちげんさん';
  return '修学旅行生';
}

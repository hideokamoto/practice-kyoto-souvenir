// 生成済みの public/data/*.json 全体に対する性質テスト。
// データを作り直したら、このテストで「どの問題も壊れていない」ことを確かめる。
import omiyageJson from '../../../public/data/omiyage.json';
import meishoJson from '../../../public/data/meisho.json';
import kakeiJson from '../../../public/data/kakei.json';
import kankoJson from '../../../public/data/kanko.json';
import shajiJson from '../../../public/data/shaji.json';
import sangyoJson from '../../../public/data/sangyo.json';
import type {
  KakeiData,
  KankoData,
  MeishoData,
  OmiyageData,
  SangyoData,
  ShajiData,
  SourceMeta,
} from '../data/types';
import { buildDaily, buildGame, MODES, QUESTIONS_PER_GAME } from './game';
import { LEVELS, type Datasets } from './question';
import { mulberry32 } from './rng';
import { expectWellFormed } from './testing/invariants';
import { GSI_META } from '../data/static-sources';

const d: Datasets = {
  omiyage: omiyageJson as unknown as OmiyageData,
  meisho: meishoJson as unknown as MeishoData,
  kakei: kakeiJson as unknown as KakeiData,
  kanko: kankoJson as unknown as KankoData,
  shaji: shajiJson as unknown as ShajiData,
  sangyo: sangyoJson as unknown as SangyoData,
};
const allMeta: SourceMeta[] = [
  ...(Object.values(d) as { meta: SourceMeta[] }[]).flatMap((x) => x.meta),
  GSI_META,
];
const sourceIds = allMeta.map((m) => m.id);
const daily = MODES.find((m) => m.id === 'daily')!;

describe('実データ: テンプレートごと・難易度ごと', () => {
  for (const level of LEVELS) {
    for (const t of daily.templates) {
      it(`${t.id}（${level}）: 対象が十分にあり、作った問題がすべて正しい形`, () => {
        const cands = t.candidates(d, level);
        expect(cands.length, `${t.id}/${level} の対象数`).toBeGreaterThanOrEqual(8);
        let ok = 0;
        const N = 150;
        for (let seed = 0; seed < N; seed++) {
          const rng = mulberry32(seed);
          const e = cands[Math.floor(rng() * cands.length)];
          const q = t.build(e, d, rng, level);
          if (!q) continue;
          ok++;
          expectWellFormed(q, sourceIds);
        }
        // 作れない対象があってもよいが、半分以上は作れること
        expect(ok / N, `${t.id}/${level} の作成成功率`).toBeGreaterThanOrEqual(0.5);
      });
    }
  }
});

describe('実データ: モードごと', () => {
  for (const m of MODES.filter((x) => x.id !== 'daily')) {
    it(`${m.label}: どのシードでも 5 問そろい、id が重複しない`, () => {
      for (let seed = 0; seed < 60; seed++) {
        const qs = buildGame(m.templates, d, mulberry32(seed), m.level);
        expect(qs.length).toBe(QUESTIONS_PER_GAME);
        expect(new Set(qs.map((q) => q.id)).size).toBe(QUESTIONS_PER_GAME);
      }
    });

    it(`${m.label}: 続けて 10 回遊んでも、同じ問題は 50 問中 5 問以下`, () => {
      let worst = 0;
      for (let start = 0; start < 200; start += 10) {
        const seen = new Set<string>();
        let repeats = 0;
        for (let seed = start; seed < start + 10; seed++) {
          for (const q of buildGame(m.templates, d, mulberry32(seed), m.level)) {
            if (seen.has(q.id)) repeats++;
            seen.add(q.id);
          }
        }
        worst = Math.max(worst, repeats);
      }
      expect(worst).toBeLessThanOrEqual(5);
    });
  }

  it('今日の5問: 60 日分すべて 5 問そろう', () => {
    const start = Date.UTC(2026, 9, 1);
    for (let i = 0; i < 60; i++) {
      const date = new Date(start + i * 86400000).toISOString().slice(0, 10);
      const qs = buildDaily(date, daily.templates, d);
      expect(qs.length).toBe(QUESTIONS_PER_GAME);
    }
  });
});

describe('実データ: 配信先の制約', () => {
  it('写真は upload.wikimedia.org だけから読む（games.hidetaka.dev の CSP に合わせる）', () => {
    for (const s of d.shaji!.items) {
      if (s.photo) expect(new URL(s.photo.thumb).host).toBe('upload.wikimedia.org');
    }
  });

  it('すべての出典に URL・ライセンス・取得日がある', () => {
    for (const m of allMeta) {
      expect(m.url).toMatch(/^https:\/\//);
      expect(m.license.length).toBeGreaterThan(0);
      expect(m.retrievedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

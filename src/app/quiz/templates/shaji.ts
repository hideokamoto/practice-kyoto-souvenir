import type { Shaji } from '../../data/types';
import { makeQuestion } from '../make';
import type { Level } from '../question';
import { shuffle } from '../rng';
import { containsLoosely } from '../text';
import { defineTemplate, type AnyTemplate } from './common';
import { distanceKm } from './geo';

const items = (d: { shaji?: { items: Shaji[] } }) => d.shaji?.items ?? [];

const KIND_NOUN: Record<Shaji['kind'], string> = { tera: '寺', jinja: '神社', shiro: '城' };

/** 誤答は正解からこれ以上離れたものに限る（同じ境内の塔頭・摂社が写り込むと正解が 2 つになるため）。 */
const PHOTO_MIN_KM = 0.5;
/** むずかしいは、この距離までの近所の寺社を誤答にする。 */
const PHOTO_HARD_MAX_KM = 3;

/**
 * 有名さ＝その寺社の記事がある Wikipedia などの言語版の数（Wikidata の sitelinks）。
 * 写真の題材は、かんたんは 10 以上（清水寺 77・鹿苑寺 57・東福寺 23 など）、ふつうは 3 以上、むずかしいは全部。
 */
const PHOTO_MIN_FAME: Record<Level, number> = { easy: 10, normal: 3, hard: 0 };
/** 世界遺産の誤答。かんたんは無名な寺社、むずかしいは構成資産でない有名な寺社。 */
const HERITAGE_DISTRACTOR: Record<Level, (x: Shaji) => boolean> = {
  easy: (x) => x.sitelinks <= 3,
  normal: () => true,
  hard: (x) => x.sitelinks >= 10,
};

/** 「安養寺（東山区）」→「安養寺」。区で区別した同名の寺社を見分ける。 */
const baseName = (name: string) => name.replace(/（[^（）]+区）$/, '');

const where = (s: Shaji) => (s.ward ? `京都市${s.ward}区` : '京都市');

const photo = defineTemplate<Shaji>({
  id: 'shaji.photo',
  needs: 'shaji',
  candidates: (d, level = 'normal') =>
    items(d).filter((s) => s.photo !== null && s.sitelinks >= PHOTO_MIN_FAME[level]),
  key: (s) => s.qid,
  build(s, d, rng, level = 'normal') {
    const p = s.photo!;
    const maxKm = level === 'hard' ? PHOTO_HARD_MAX_KM : Infinity;
    const pool = items(d).filter(
      (x) =>
        x.qid !== s.qid &&
        x.kind === s.kind &&
        distanceKm(s, x) >= PHOTO_MIN_KM &&
        distanceKm(s, x) <= maxKm &&
        baseName(x.name) !== baseName(s.name) &&
        !containsLoosely(x.name, s.name) &&
        !containsLoosely(s.name, x.name),
    );
    return makeQuestion(
      {
        template: 'shaji.photo',
        key: s.qid,
        prompt: `写真の${KIND_NOUN[s.kind]}は？`,
        media: { kind: 'photo', photo: p, alt: `${KIND_NOUN[s.kind]}の写真（Wikimedia Commons）` },
        answer: s.name,
        distractors: shuffle(pool, rng).map((x) => x.name),
        explanation: `${s.name}（${where(s)}）。写真：${p.author}（${p.license}）、Wikimedia Commons。`,
        sources: ['wikidata', 'commons'],
      },
      rng,
    );
  },
});

const worldHeritage = defineTemplate<Shaji>({
  id: 'shaji.worldHeritage',
  needs: 'shaji',
  candidates: (d) => items(d).filter((s) => s.worldHeritage === true),
  key: (s) => s.qid,
  build(s, d, rng, level = 'normal') {
    const assets = items(d)
      .filter((x) => x.worldHeritage === true)
      .map((x) => x.name);
    // 構成資産でないと分かっている（false）ものだけを誤答にする。写真があるものを優先する。
    const pool = shuffle(
      items(d).filter((x) => x.worldHeritage === false && HERITAGE_DISTRACTOR[level](x)),
      rng,
    ).sort((a, b) => Number(b.photo !== null) - Number(a.photo !== null));
    return makeQuestion(
      {
        template: 'shaji.worldHeritage',
        key: s.qid,
        prompt: '世界遺産「古都京都の文化財」の構成資産はどれ？',
        answer: s.name,
        distractors: pool.map((x) => x.name),
        explanation: `「${s.name}」は構成資産の一つ。京都市内の構成資産は ${assets.length} 件：${assets.join('、')}（Wikidata による）。`,
        sources: ['wikidata'],
      },
      rng,
    );
  },
});

export const SHAJI_TEMPLATES: AnyTemplate[] = [photo, worldHeritage];

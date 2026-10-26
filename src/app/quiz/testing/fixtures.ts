import type { KakeiItem, Kanko, Meisho, Omiyage, SourceMeta } from '../../data/types';

export const meta = (id: string): SourceMeta => ({
  id,
  title: id,
  publisher: 'p',
  url: 'https://example.com/',
  license: 'CC BY 4.0',
  licenseUrl: null,
  retrievedAt: '2026-10-25',
  note: '',
});

export const omiyage = (o: Partial<Omiyage> & Pick<Omiyage, 'id' | 'name'>): Omiyage => ({
  kana: '',
  description: `${o.name}の説明。京都の名物として知られる。`,
  genre: 'meibutsu',
  ...o,
});

export const meisho = (m: Partial<Meisho> & Pick<Meisho, 'id' | 'name'>): Meisho => ({
  kana: '',
  base: m.name.split('　')[0],
  description: `${m.name.split('　')[0]}にある建物。由緒ある建物として知られる。`,
  genre: 'kenzobutsu',
  era: null,
  designation: null,
  ward: null,
  ...m,
});

export const kanko = (k: Partial<Kanko> & Pick<Kanko, 'id' | 'name' | 'lat' | 'lon'>): Kanko => ({
  kana: '',
  ward: '左京',
  description: `${k.name}の説明。`,
  ...k,
});

export const kakei = (
  k: Partial<KakeiItem> & Pick<KakeiItem, 'item' | 'kyotoRank'>,
): KakeiItem => ({
  group: 'g',
  measure: 'amount',
  unit: '円',
  cities: 52,
  kyotoValue: 1000,
  top: { city: '堺市', value: 2000 },
  ...k,
});

import type { Photo, Shaji } from '../../data/types';

export const photo = (name: string): Photo => ({
  thumb: `https://upload.wikimedia.org/wikipedia/commons/thumb/x/xx/${name}.jpg/960px-${name}.jpg`,
  width: 960,
  height: 640,
  page: `https://commons.wikimedia.org/wiki/File:${name}.jpg`,
  author: '撮影者',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
});

export const shaji = (s: Partial<Shaji> & Pick<Shaji, 'qid' | 'name' | 'lat' | 'lon'>): Shaji => ({
  kind: 'tera',
  ward: null,
  inception: null,
  worldHeritage: false,
  photo: photo(s.qid),
  sitelinks: 5,
  ...s,
});

import type { SourceMeta } from './types';

/** 地理院タイル（航空写真）。データファイルではなく実行時にタイルを読むので、出典はここに置く。 */
export const GSI_META: SourceMeta = {
  id: 'gsi',
  title: '地理院タイル（全国最新写真（シームレス））',
  publisher: '国土地理院',
  url: 'https://maps.gsi.go.jp/development/ichiran.html',
  license: '国土地理院コンテンツ利用規約（出典の明示で利用可）',
  licenseUrl: 'https://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html',
  retrievedAt: '2026-10-25',
  note: '航空写真のタイルを表示時に読み込み、中心に印を重ねて表示。',
};

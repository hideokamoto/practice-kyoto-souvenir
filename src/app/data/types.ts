// public/data/*.json の型。JSON は tools/data-build/ のスクリプトが生成する（手で編集しない）。
// どのファイルも `meta` に出典を持ち、クレジット画面はそれをそのまま表示する。

/** 京都市の行政区（「区」は付けない）。 */
export type Ward =
  '北' | '上京' | '左京' | '中京' | '東山' | '下京' | '南' | '右京' | '伏見' | '山科' | '西京';

export const WARDS: readonly Ward[] = [
  '北',
  '上京',
  '左京',
  '中京',
  '東山',
  '下京',
  '南',
  '右京',
  '伏見',
  '山科',
  '西京',
];

/** 出典 1 件。クレジット画面と各問題の解説に出す。 */
export interface SourceMeta {
  /** 例: 'kyoto-navi'。問題の `sources` から参照する。 */
  id: string;
  /** 例: '京都観光Navi（京都観光見もの情報・京都観光お土産情報）' */
  title: string;
  /** 例: '京都市' */
  publisher: string;
  /** データセットのページ（またはファイル）の URL */
  url: string;
  /** 例: 'CC BY 4.0'、'CC0'、'政府標準利用規約（第2.0版）' */
  license: string;
  licenseUrl: string | null;
  /** 取得日（YYYY-MM-DD） */
  retrievedAt: string;
  /** 加工の内容。CC BY 等の「加工して作成」表記に使う。 */
  note: string;
}

interface Dataset {
  meta: SourceMeta[];
}

// ---------- 京都観光Navi（京都市） ----------

export type OmiyageGenre = 'kogei' | 'meibutsu' | 'ryori';

export interface Omiyage {
  id: string;
  name: string;
  /** ひらがなの読み */
  kana: string;
  description: string;
  genre: OmiyageGenre;
}

export interface OmiyageData extends Dataset {
  items: Omiyage[];
}

export type MeishoGenre =
  | 'kenzobutsu' // 文化財：建造物
  | 'chokoku' // 文化財：彫刻
  | 'kaiga' // 文化財：絵画・書跡
  | 'kogeihin' // 文化財：工芸品
  | 'meiboku' // 名木
  | 'geino' // 伝統芸能・風俗
  | 'bungaku' // 文学・映画の舞台
  | 'shoku' // 京の味
  | 'chimei' // 地名
  | 'yama' // 山
  | 'kawa' // 川
  | 'mizu' // 滝・井戸・名水
  | 'ike' // 池
  | 'machinami' // 町家・町並みのことば
  | 'komainu' // 狛犬・神使
  | 'kofun' // 古墳
  | 'other';

export interface Meisho {
  id: string;
  /** CSV の名称そのまま（例: 「清水寺　本堂」） */
  name: string;
  kana: string;
  /** 所在する施設名（例: 「清水寺」）。単独の事物なら name と同じ。 */
  base: string;
  /** 交通案内などの付記を除いた説明文 */
  description: string;
  genre: MeishoGenre;
  /** 説明文の定型句（「〜にある桃山時代建築の国宝建造物」等）から取れたときだけ入る */
  era: string | null;
  /** 説明文の定型句から取れたときだけ入る */
  designation: '国宝' | '重要文化財' | null;
  /** CSV の住所から取れたときだけ入る */
  ward: Ward | null;
}

export interface MeishoData extends Dataset {
  items: Meisho[];
}

// ---------- 京都府 観光施設一覧（京都市内分） ----------

export interface Kanko {
  /** CSV の NO */
  id: string;
  name: string;
  kana: string;
  ward: Ward;
  lat: number;
  lon: number;
  description: string;
}

export interface KankoData extends Dataset {
  items: Kanko[];
}

// ---------- 家計調査 都市別ランキング（総務省統計局） ----------

export interface KakeiItem {
  /** シート名（例: '穀類'） */
  group: string;
  /** 品目名（例: 'パン'） */
  item: string;
  /** 金額（円）か数量か */
  measure: 'amount' | 'quantity';
  /** '円'、'g'、'kg'、'個' など、表の見出しのまま */
  unit: string;
  /** 順位表に載っている都市の数 */
  cities: number;
  kyotoRank: number;
  kyotoValue: number;
  top: { city: string; value: number };
}

export interface KakeiData extends Dataset {
  /** 例: '2023年（令和5年）～2025年（令和7年）平均' */
  period: string;
  items: KakeiItem[];
}

// ---------- 寺社（Wikidata + Wikimedia Commons） ----------

export interface Photo {
  /** 表示用のサムネイル URL（upload.wikimedia.org） */
  thumb: string;
  width: number;
  height: number;
  /** Commons のファイルページ */
  page: string;
  /** 作者（HTML を除いたテキスト） */
  author: string;
  /** 例: 'CC BY-SA 4.0'、'Public domain' */
  license: string;
  licenseUrl: string | null;
}

export interface Shaji {
  /** Wikidata の Q 番号 */
  qid: string;
  name: string;
  kind: 'tera' | 'jinja' | 'shiro';
  ward: Ward | null;
  lat: number;
  lon: number;
  /** 創建年（Wikidata の精度が年以上のときだけ） */
  inception: number | null;
  /** 世界遺産「古都京都の文化財」の構成資産か（構成資産の一覧が揃ったときだけ true/false、取れなければ null） */
  worldHeritage: boolean | null;
  photo: Photo | null;
  /** 有名さの物差し: この項目の記事がある Wikipedia 等の言語版の数（Wikidata の sitelinks） */
  sitelinks: number;
}

export interface ShajiData extends Dataset {
  items: Shaji[];
}

// ---------- 京の産業（国税庁・農林水産省・文化庁） ----------

export interface PrefValue {
  /** 都道府県名（例: '京都府'） */
  pref: string;
  value: number;
}

/** 1 つの指標の都道府県別の値。問題は「1位はどこ？」「京都府は何位？」の形で作る。 */
export interface SangyoIndicator {
  id: string;
  /** 例: '清酒の売上数量（国内）' */
  label: string;
  /** 例: 'kl'、't'、'件' */
  unit: string;
  /** 例: '令和5年度' */
  period: string;
  /** 出典 id（meta の id） */
  source: string;
  /** 値の大きい順。同値は同順位として扱うので、問題側で 1 位が単独のときだけ使う。 */
  values: PrefValue[];
}

export interface SangyoData extends Dataset {
  indicators: SangyoIndicator[];
}

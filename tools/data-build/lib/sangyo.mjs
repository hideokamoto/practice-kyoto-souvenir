// 京の産業（都道府県別の指標）を作る純粋関数。
// 入力の読み込み（PDF のテキスト化・xlsx の読み込み）は build-sangyo.mjs が行う。
//
// ソース:
//   nta-sake     国税庁「酒類製造業及び酒類卸売業の概況（令和7年アンケート）」1 清酒製造業 表20
//   maff-yasai   農林水産省「令和6年産 地域特産野菜生産状況調査」表2（e-Stat）
//   bunka-shitei 文化庁「国宝・重要文化財等都道府県別指定件数一覧」1．国宝・重要文化財

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

const SHORT_TO_FULL = new Map(
  PREFECTURES.map((p) => [p === '北海道' ? p : p.replace(/[都府県]$/, ''), p]),
);
// 短縮形は長いものから照合する（「広島岡山」のように局名が前に付く行があるため、末尾一致で探す）
const SHORTS_BY_LENGTH = [...SHORT_TO_FULL.keys()].sort((a, b) => b.length - a.length);

const compact = (s) => String(s ?? '').replace(/[\s　]/g, '');

/** 「京　都」「北 海 道」「東京」「京都府」などを正式な都道府県名にする。都道府県でなければ null。 */
export function prefFromShort(name) {
  const c = compact(name);
  if (!c) return null;
  if (PREFECTURES.includes(c)) return c;
  return SHORT_TO_FULL.get(c) ?? null;
}

/** 末尾が都道府県の短縮形で終わる文字列から都道府県を取る（「金沢石川」→ 石川県）。 */
function prefFromSuffix(text) {
  const c = compact(text);
  for (const s of SHORTS_BY_LENGTH) if (c.endsWith(s)) return SHORT_TO_FULL.get(s);
  return null;
}

/** 値の大きい順の配列での順位（同値は同順位）。無ければ null。 */
export function rankOf(values, pref) {
  const own = values.find((v) => v.pref === pref);
  if (!own) return null;
  return 1 + values.filter((v) => v.value > own.value).length;
}

/** Excel のシリアル値（1900 年基準）を YYYY-MM-DD にする。 */
export function excelSerialToDate(serial) {
  const ms = Date.UTC(1899, 11, 30) + serial * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

// ---------- 国税庁 清酒（表20） ----------

/** 「86,078」→ 86078。「X」（秘匿）や「-」（該当なし）は null。 */
function ntaNumber(token) {
  const t = token.normalize('NFKC');
  if (/^[\d,]+(\.\d+)?$/.test(t)) return Number(t.replace(/,/g, ''));
  return null;
}

/**
 * pdftotext -layout で取り出した 04.pdf のテキストから、表20 の都道府県行を読む。
 * 1 行 = 都道府県（前に国税局名が付くことがある）+ 7 つの値
 * （事業者数, 国内売上数量 kl, 国内売上金額 百万円, 輸出売上数量 kl, 輸出売上金額 百万円, 輸出割合 % ×2）。
 */
export function parseNtaSakeTable(text) {
  const start = text.search(/表\s*20\s/);
  if (start < 0) throw new Error('表 20 が見つかりません');
  const endRel = text.slice(start + 1).search(/表\s*21\s/);
  const body = endRel < 0 ? text.slice(start) : text.slice(start, start + 1 + endRel);
  const rows = [];
  for (const line of body.split('\n')) {
    const tokens = line.trim().split(/\s+/);
    if (tokens.length < 8) continue;
    const values = tokens.slice(-7);
    if (!values.every((v) => /^([\d,]+(\.\d+)?|[XxＸｘ]|[-－])$/.test(v.normalize('NFKC')))) continue;
    const pref = prefFromSuffix(tokens.slice(0, -7).join(''));
    if (!pref) continue;
    const [respondents, domesticVolume, domesticSales, exportVolume, exportSales] = values.map(ntaNumber);
    rows.push({ pref, respondents, domesticVolume, domesticSales, exportVolume, exportSales });
  }
  return rows;
}

// ---------- 農林水産省 地域特産野菜（表2） ----------

/** 数値はそのまま、「－」（事実のないもの）は 0、「…」「x」「nc」は null。 */
function maffValue(v) {
  if (typeof v === 'number') return v;
  const t = String(v ?? '').trim().normalize('NFKC');
  if (/^[\d,]+(\.\d+)?$/.test(t)) return Number(t.replace(/,/g, ''));
  if (t === '-' || t === '－' || t === '−') return 0;
  return null;
}

/**
 * 表2（1 品目 1 シート）を読む。「収穫量」の見出しの列を都道府県ごとに取る。
 * @param {string} item シート名（品目名）
 * @param {unknown[][]} rows rows[行][列]（0 始まり）
 */
export function parseMaffSheet(item, rows) {
  let headerRow = -1;
  let col = -1;
  for (let r = 0; r < rows.length && col < 0; r++) {
    const c = (rows[r] ?? []).findIndex((v) => compact(v) === '収穫量');
    if (c >= 0) {
      headerRow = r;
      col = c;
    }
  }
  if (col < 0) throw new Error(`${item}: 「収穫量」の見出しがありません`);
  let unit = null;
  let national = null;
  const values = [];
  const excluded = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r] ?? [];
    const label = compact(row[1]);
    if (unit === null && !label && typeof row[col] === 'string' && row[col].trim()) {
      unit = row[col].trim().normalize('NFKC');
      continue;
    }
    if (label === '全国') {
      national = maffValue(row[col]);
      continue;
    }
    const pref = prefFromShort(label);
    if (!pref) continue;
    const v = maffValue(row[col]);
    if (v === null) excluded.push(pref);
    else values.push({ pref, value: v });
  }
  if (!unit) throw new Error(`${item}: 単位が読めません`);
  values.sort((a, b) => b.value - a.value);
  return { item, unit, national, values, excluded };
}

// ---------- 文化庁 国宝・重要文化財都道府県別指定件数一覧 ----------

// 列（0 始まり）。左半分が国宝、右半分が重要文化財（国宝を含む）。
//   1〜7 = 国宝 美術工芸品の分類（絵画・彫刻・工芸・書跡・古書・考古・歴史）, 8 = その計（数式）
//   9 = 国宝 建造物の件数, 10 = 棟数, 11 = 国宝計（数式: 8 + 9）
//   14〜20 = 重要文化財 美術工芸品の分類, 21 = その計（数式）, 22 = 建造物の件数, 23 = 棟数, 24 = 計（数式: 21 + 22）
// 計の列は数式で、exceljs では共有数式の計算結果が欠けることがあるため、分類の列から計算し直す。
// 計算結果がファイルに入っていれば、それと一致することも確かめる。
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const BUNKA = {
  kokuhoBijutsu: { parts: range(1, 7), cached: 8 },
  kokuhoKenzobutsu: { parts: [9], cached: 9 },
  kokuhoTotal: { parts: [...range(1, 7), 9], cached: 11 },
  jubunTotal: { parts: [...range(14, 20), 22], cached: 24 },
};

function count(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return v;
  const n = Number(String(v).normalize('NFKC').replace(/,/g, ''));
  if (Number.isNaN(n)) throw new Error(`件数が数値ではありません: ${JSON.stringify(v)}`);
  return n;
}

function pick(row, label) {
  return Object.fromEntries(
    Object.entries(BUNKA).map(([k, { parts, cached }]) => {
      const v = parts.reduce((a, c) => a + count(row[c]), 0);
      const c = row[cached];
      if (typeof c === 'number' && c !== v)
        throw new Error(`${label} の ${k}: 分類の合計 ${v} と表の計 ${c} が一致しません`);
      return [k, v];
    }),
  );
}

/** 合計行は表の計算結果（数式に二重計上の補正が入っている）をそのまま使う。 */
function pickTotals(row) {
  return Object.fromEntries(
    Object.entries(BUNKA).map(([k, { cached }]) => {
      if (typeof row[cached] !== 'number') throw new Error(`合計行の ${k} が数値ではありません`);
      return [k, row[cached]];
    }),
  );
}

/**
 * 「1．国宝・重要文化財」のシートを読む。空欄は 0 件。
 * 注意: 表の合計行は二重計上を補正している（国宝建造物の合計は都道府県の和 −1、重要文化財は −2）ので、
 * 都道府県の値の和と合計は一致しない。
 */
export function parseBunkaSheet(rows) {
  let asOf = null;
  for (const row of rows.slice(0, 8)) {
    const i = (row ?? []).findIndex((v) => v === '現在');
    if (i < 0) continue;
    const serial = row.slice(0, i).reverse().find((v) => typeof v === 'number');
    if (serial !== undefined) asOf = excelSerialToDate(serial);
  }
  if (!asOf) throw new Error('「〜現在」の日付が読めません');
  const out = [];
  let totals = null;
  let supplement = null;
  for (const row of rows) {
    const label = compact(row?.[0]);
    if (label === '合計') totals = pickTotals(row);
    else if (label === '補遺') supplement = pick(row, label);
    else {
      const pref = prefFromShort(label);
      if (pref) out.push({ pref, ...pick(row, pref) });
    }
  }
  if (!totals) throw new Error('合計の行がありません');
  return { asOf, rows: out, totals, supplement };
}

// ---------- 指標 ----------

/** 値の大きい順に並べ、値なし（null）を除いた指標にする。 */
export function toIndicator({ id, label, unit, period, source }, values) {
  return {
    id,
    label,
    unit,
    period,
    source,
    values: values
      .filter((v) => v.value !== null && v.value !== undefined)
      .map(({ pref, value }) => ({ pref, value }))
      .sort((a, b) => b.value - a.value),
  };
}

const PDL = {
  license: '公共データ利用規約（第1.0版）',
  licenseUrl: 'https://www.digital.go.jp/resources/open_data/public_data_license_v1.0',
};

export const NTA_URL = 'https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seizo_oroshiuri/r07/pdf/04.pdf';
export const MAFF_URL =
  'https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&lid=000001484235';
export const BUNKA_URL = 'https://www.bunka.go.jp/seisaku/bunkazai/shokai/shitei.html';

function wareki(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return `令和${y - 2018}年${m}月${d}日`;
}

/**
 * 3 ソースから SangyoData を作る。地域特産野菜は京都府が 1〜3 位の品目だけを指標にする。
 * 京都府が含まれない指標・1 位が同値の指標は作らない（問題にできないため）。
 */
export function buildSangyoData({ nta, maff, bunka, retrievedAt }) {
  const indicators = [];
  const used = new Set();
  const add = (ind) => {
    const k = rankOf(ind.values, '京都府');
    if (k === null) return;
    if (ind.values.length >= 2 && ind.values[0].value === ind.values[1].value) return;
    indicators.push(ind);
    used.add(ind.source);
  };

  if (nta?.length) {
    const period = '令和6年（2024年1月〜12月）';
    const base = { period, source: 'nta-sake' };
    const col = (k) => nta.map((r) => ({ pref: r.pref, value: r[k] }));
    add(toIndicator({ ...base, id: 'nta-sake-domestic-volume', label: '清酒の国内売上数量（回答した製造業者の合計）', unit: 'kl' }, col('domesticVolume')));
    add(toIndicator({ ...base, id: 'nta-sake-domestic-sales', label: '清酒の国内売上金額（回答した製造業者の合計）', unit: '百万円' }, col('domesticSales')));
    add(toIndicator({ ...base, id: 'nta-sake-export-volume', label: '清酒の輸出売上数量（回答した製造業者の合計）', unit: 'kl' }, col('exportVolume')));
    // 回答者数（respondents）は製造業者数ではないので指標にしない。
  }

  for (const sheet of maff ?? []) {
    const k = rankOf(sheet.values, '京都府');
    if (k === null || k > 3) continue;
    add(
      toIndicator(
        {
          id: `maff-yasai-${sheet.item}`,
          label: `${sheet.item}の収穫量`,
          unit: sheet.unit,
          period: '令和6年産',
          source: 'maff-yasai',
        },
        sheet.values,
      ),
    );
  }

  if (bunka) {
    const asOf = `${wareki(bunka.asOf)}現在`;
    const base = { unit: '件', source: 'bunka-shitei' };
    const col = (k) => bunka.rows.map((r) => ({ pref: r.pref, value: r[k] }));
    add(toIndicator({ ...base, id: 'bunka-kokuho-bijutsu', label: '国宝（美術工芸品）の件数', period: `${asOf}（都道府県別の件数は平成29年9月現在で把握している件数が基準）` }, col('kokuhoBijutsu')));
    add(toIndicator({ ...base, id: 'bunka-kokuho-kenzobutsu', label: '国宝（建造物）の件数', period: asOf }, col('kokuhoKenzobutsu')));
    add(toIndicator({ ...base, id: 'bunka-kokuho-total', label: '国宝の件数（美術工芸品と建造物の計）', period: `${asOf}（美術工芸品の都道府県別の件数は平成29年9月現在で把握している件数が基準）` }, col('kokuhoTotal')));
    add(toIndicator({ ...base, id: 'bunka-jubun-total', label: '重要文化財の件数（国宝を含む）', period: `${asOf}（美術工芸品の都道府県別の件数は平成29年9月現在で把握している件数が基準）` }, col('jubunTotal')));
  }

  const meta = [];
  if (used.has('nta-sake'))
    meta.push({
      id: 'nta-sake',
      title: '酒類製造業及び酒類卸売業の概況（令和7年アンケート）1 清酒製造業 表20 都道府県別の回答者数及び取引状況',
      publisher: '国税庁',
      url: NTA_URL,
      ...PDL,
      retrievedAt,
      note: '表20の都道府県別の値を抽出して作成。値は調査に回答した清酒製造業者の合計で、全製造業者の合計ではない。秘匿（X）と回答者なし（-）の都道府県は除外。「酒類製造業及び酒類卸売業の概況（令和7年アンケート）」（国税庁）を加工して作成。',
    });
  if (used.has('maff-yasai'))
    meta.push({
      id: 'maff-yasai',
      title: '令和6年産 地域特産野菜生産状況調査 表2 都道府県別の作付面積、収穫量及び出荷量',
      publisher: '農林水産省',
      url: MAFF_URL,
      ...PDL,
      retrievedAt,
      note: 'e-Stat で公開されている表から収穫量を抽出して作成。「－」（事実のないもの）は 0、「…」（事実不詳又は調査を欠くもの）と「x」（秘匿）は除外。「令和６年産地域特産野菜生産状況調査」（農林水産省）を加工して作成。',
    });
  if (used.has('bunka-shitei'))
    meta.push({
      id: 'bunka-shitei',
      title: '国宝・重要文化財等都道府県別指定件数一覧 1．国宝・重要文化財',
      publisher: '文化庁',
      url: BUNKA_URL,
      license: '文部科学省ウェブサイト利用規約（公共データ利用規約 第1.0版準拠）',
      licenseUrl: 'https://www.mext.go.jp/b_menu/1351168.htm',
      retrievedAt,
      note: `${wareki(bunka.asOf)}現在の一覧（Excel）から都道府県別の国宝・重要文化財の件数を抽出して作成。空欄は 0 件、「補遺」（所有者不明等）は都道府県に含めない。美術工芸品の都道府県別の件数は、表の注記のとおり平成29年9月現在で把握している件数が基準。「国宝・重要文化財等都道府県別指定件数一覧」（文化庁）を加工して作成。`,
    });

  return { meta, indicators };
}

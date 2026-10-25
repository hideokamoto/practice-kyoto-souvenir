// 家計調査「品目別都道府県庁所在市及び政令指定都市ランキング」（総務省統計局）の表を読む純粋関数。
// 入力は 1 シートを行の配列にしたもの（rows[行][列]、0 始まり）。xlsx の読み込みは build-kakei.mjs が行う。
//
// 表の構造（2023〜2025 年平均の rank01〜14.xlsx で確認）:
//   1 行目: 期間（例: 2023年（令和５年）～2025年（令和７年）平均）
//   3 行目: 品目名。都市の列に入る。同じ品目の「金額」と「数量」の 2 組に同じ名前が入る。
//   4 行目: 単位の見出し（----------<金　額>- / --------<数量：　ｇ>- など）。品目名と同じ列。
//   5 行目以降: A 列が順位（0 は全国）、以降は「都市, 値」の 2 列 1 組。
// 結合セルは無い。

export const SOURCE_URL = 'https://www.stat.go.jp/data/kakei/5.html';
export const LICENSE_URL = 'https://www.stat.go.jp/info/riyou.html';
export const KYOTO = '京都市';

/** 全角の数字を半角にする（それ以外は変えない）。 */
export function normalizePeriod(text) {
  return String(text)
    .trim()
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0));
}

const UNIT_ALIASES = { l: 'L', m3: 'm³' };

/**
 * 単位の見出しを measure と unit に分ける。見出しでなければ null。
 * @returns {{ measure: 'amount' | 'quantity', unit: string } | null}
 */
export function parseUnit(header) {
  if (typeof header !== 'string') return null;
  const inner = header.match(/<([^>]*)>/)?.[1];
  if (inner === undefined) return null;
  const compact = inner.replace(/[\s　]/g, '');
  if (compact === '金額') return { measure: 'amount', unit: '円' };
  const q = compact.match(/^数量：(.+)$/);
  if (!q) return null;
  const unit = q[1].normalize('NFKC');
  return { measure: 'quantity', unit: UNIT_ALIASES[unit] ?? unit };
}

function findUnitRow(rows) {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    if ((rows[r] ?? []).some((c) => parseUnit(c)?.measure === 'amount')) return r;
  }
  throw new Error('単位の見出し行（<金　額>）が見つかりません');
}

function text(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * 1 シートを読む。
 * 1 位が同値で並ぶ品目と、京都市の値が前後の順位と同値の品目は、順位が一意に決まらないので items から除き skipped に入れる。
 * @returns {{ period: string, items: import('../../../src/app/data/types').KakeiItem[], skipped: { item: string, measure: string, reason: 'top-tie' | 'kyoto-tie' }[] }}
 */
export function parseSheet(rows, group) {
  const period = normalizePeriod(text(rows[0]?.[0]));
  const unitRow = findUnitRow(rows);
  const names = rows[unitRow - 1] ?? [];
  const units = rows[unitRow] ?? [];
  // 順位の行（A 列が 1 以上の整数）
  const rankRows = rows
    .slice(unitRow + 1)
    .filter((r) => Number.isInteger(r?.[0]) && r[0] >= 1);

  const items = [];
  const skipped = [];
  for (let c = 1; c < units.length; c++) {
    const unit = parseUnit(units[c]);
    const item = text(names[c]);
    if (!unit || !item) continue;

    // この組（都市 c 列, 値 c+1 列）の順位表
    const table = rankRows
      .filter((r) => text(r[c]) !== '')
      .map((r) => ({ rank: r[0], city: text(r[c]), value: r[c + 1] }));
    for (const t of table) {
      if (typeof t.value !== 'number' || !Number.isFinite(t.value)) {
        throw new Error(`${group}/${item}: ${t.rank} 位（${t.city}）の値が数値ではありません: ${t.value}`);
      }
    }
    const kyoto = table.find((t) => t.city === KYOTO);
    if (!kyoto) throw new Error(`${group}/${item}（${unit.measure}）: ${KYOTO} が順位表にありません`);
    const byRank = new Map(table.map((t) => [t.rank, t]));
    const top = byRank.get(1);
    if (!top) throw new Error(`${group}/${item}: 1 位の行がありません`);

    if (byRank.get(2)?.value === top.value) {
      skipped.push({ item, measure: unit.measure, reason: 'top-tie' });
      continue;
    }
    const prev = byRank.get(kyoto.rank - 1);
    const next = byRank.get(kyoto.rank + 1);
    if (prev?.value === kyoto.value || next?.value === kyoto.value) {
      skipped.push({ item, measure: unit.measure, reason: 'kyoto-tie' });
      continue;
    }

    items.push({
      group,
      item,
      measure: unit.measure,
      unit: unit.unit,
      cities: Math.max(...table.map((t) => t.rank)),
      kyotoRank: kyoto.rank,
      kyotoValue: kyoto.value,
      top: { city: top.city, value: top.value },
    });
  }
  return { period, items, skipped };
}

/**
 * シートの配列から KakeiData を作る。
 * @param {{ group: string, rows: unknown[][] }[]} sheets
 * @param {{ retrievedAt: string }} options
 */
export function buildKakeiData(sheets, { retrievedAt }) {
  let period = null;
  const items = [];
  const skipped = [];
  for (const { group, rows } of sheets) {
    const parsed = parseSheet(rows, group);
    if (period === null) period = parsed.period;
    else if (parsed.period !== period) {
      throw new Error(`期間が食い違っています: ${group} は「${parsed.period}」、先のシートは「${period}」`);
    }
    items.push(...parsed.items);
    skipped.push(...parsed.skipped.map((s) => ({ group, ...s })));
  }
  return {
    meta: [
      {
        id: 'kakei',
        title: '家計調査（家計収支編）品目別都道府県庁所在市及び政令指定都市ランキング',
        publisher: '総務省統計局',
        url: SOURCE_URL,
        license: '公共データ利用規約（第1.0版）（PDL1.0）。CC BY 4.0 と互換',
        licenseUrl: LICENSE_URL,
        retrievedAt,
        note:
          `「家計調査（家計収支編）品目別都道府県庁所在市及び政令指定都市ランキング（${period}）」（総務省統計局）を加工して作成。` +
          '二人以上の世帯。各品目の京都市の順位・値と 1 位の都市を抽出。1 位や京都市の順位が同値で決まらない品目は除外。',
      },
    ],
    period,
    items,
    skipped,
  };
}

/**
 * データ品質向上スクリプト
 *
 * 複数の戦略を組み合わせて kyoto-sights.json の欠損データを補完する:
 *
 * 戦略1: 同一施設内の住所伝搬
 *   - 同じ寺社・施設の別レコードに住所がある場合、それを共有する
 *
 * 戦略2: 公知の京都名所データによる補完
 *   - 京都市オープンデータ等を参考に、主要な寺社仏閣の住所・郵便番号を補完
 *   - 出典: 京都市公式サイト、各寺社仏閣公式サイトの公開情報
 *
 * 戦略3: Wikimedia Commons の画像URL生成
 *   - 写真が欠損しているレコードに対し、Wikimedia Commonsの画像URLを提供
 *   - ライセンス: CC BY-SA 3.0/4.0 (商用利用可・帰属表示必要)
 *
 * 使い方: cd assets && node enrich-data.js
 */
const fs = require('fs');
const path = require('path');

const SIGHTS_PATH = path.join(__dirname, '../src/app/pages/sights/dataset/kyoto-sights.json');

// =====================================================================
// 戦略1: 同一施設内の住所伝搬
// =====================================================================
function propagateSiblingAddresses(items) {
  let count = 0;
  // 施設のベース名からグループ化
  const groups = {};
  items.forEach((item, idx) => {
    // 「東寺（教王護国寺）　金堂」→「東寺」のようにベース名を抽出
    if (!item.name || typeof item.name !== 'string') return;
    const baseName = item.name
      .split('\u3000')[0]                    // 全角スペースで分割
      .replace(/（.*?）/g, '')               // 括弧内を除去
      .replace(/\s+/g, '')                   // 空白除去
      .trim();
    if (!groups[baseName]) groups[baseName] = [];
    groups[baseName].push(idx);
  });

  Object.entries(groups).forEach(([baseName, indices]) => {
    // グループ内で住所を持つレコードを探す
    const withAddress = indices.find(idx => items[idx].address && items[idx].address.trim() !== '');
    if (withAddress === undefined) return;

    const source = items[withAddress];
    indices.forEach(idx => {
      if (!items[idx].address || items[idx].address.trim() === '') {
        items[idx].address = source.address;
        count++;
        // 郵便番号・電話番号・FAXも伝搬
        if (source.postal_code && (!items[idx].postal_code || items[idx].postal_code.trim() === '')) {
          items[idx].postal_code = source.postal_code;
        }
        if (source.tel && (!items[idx].tel || items[idx].tel.trim() === '')) {
          items[idx].tel = source.tel;
        }
        if (source.fax && (!items[idx].fax || items[idx].fax.trim() === '')) {
          items[idx].fax = source.fax;
        }
      }
    });
  });
  return count;
}

// =====================================================================
// 戦略2: 公知の京都名所データによる住所補完
// =====================================================================
// 出典: 各寺社仏閣の公式サイト、京都市公開情報等より
// ライセンス: 公的機関の公開情報・事実データ（住所は著作物ではない）
const KNOWN_ADDRESSES = {
  // --- 国宝建造物のある寺社 ---
  '高山寺': { address: '京都市右京区梅ケ畑栂尾町8', postal_code: '616-8295', tel: '075-861-4204' },
  '三十三間堂': { address: '京都市東山区三十三間堂廻り657', postal_code: '605-0941', tel: '075-561-0467' },
  '蓮華王院': { address: '京都市東山区三十三間堂廻り657', postal_code: '605-0941', tel: '075-561-0467' },
  '常寂光寺': { address: '京都市右京区嵯峨小倉山小倉町3', postal_code: '616-8397', tel: '075-861-0435' },
  '千本釈迦堂': { address: '京都市上京区五辻通六軒町西入溝前町1034', postal_code: '602-8319', tel: '075-461-5973' },
  '大報恩寺': { address: '京都市上京区五辻通六軒町西入溝前町1034', postal_code: '602-8319', tel: '075-461-5973' },
  '大覚寺': { address: '京都市右京区嵯峨大沢町4', postal_code: '616-8411', tel: '075-871-0071' },
  '東寺': { address: '京都市南区九条町1', postal_code: '601-8473', tel: '075-691-3325' },
  '教王護国寺': { address: '京都市南区九条町1', postal_code: '601-8473', tel: '075-691-3325' },
  '南禅寺': { address: '京都市左京区南禅寺福地町', postal_code: '606-8435', tel: '075-771-0365' },
  '二条城': { address: '京都市中京区二条通堀川西入二条城町541', postal_code: '604-8301', tel: '075-841-0096' },
  '仁和寺': { address: '京都市右京区御室大内33', postal_code: '616-8092', tel: '075-461-1155' },
  '本願寺': { address: '京都市下京区堀川通花屋町下る本願寺門前町', postal_code: '600-8501', tel: '075-371-5181' },
  '西本願寺': { address: '京都市下京区堀川通花屋町下る本願寺門前町', postal_code: '600-8501', tel: '075-371-5181' },
  '伏見稲荷大社': { address: '京都市伏見区深草薮之内町68', postal_code: '612-0882', tel: '075-641-7331' },
  '妙心寺': { address: '京都市右京区花園妙心寺町1', postal_code: '616-8035', tel: '075-463-3121' },
  '醍醐寺': { address: '京都市伏見区醍醐東大路町22', postal_code: '601-1325', tel: '075-571-0002' },
  '醍醐寺三宝院': { address: '京都市伏見区醍醐東大路町22', postal_code: '601-1325', tel: '075-571-0002' },
  '賀茂別雷神社': { address: '京都市北区上賀茂本山339', postal_code: '603-8047', tel: '075-781-0011' },
  '上賀茂神社': { address: '京都市北区上賀茂本山339', postal_code: '603-8047', tel: '075-781-0011' },
  '豊国神社': { address: '京都市東山区大和大路正面茶屋町530', postal_code: '605-0931', tel: '075-561-3802' },
  '松尾大社': { address: '京都市西京区嵐山宮町3', postal_code: '616-0024', tel: '075-871-5016' },
  '曼殊院': { address: '京都市左京区一乗寺竹ノ内町42', postal_code: '606-8134', tel: '075-781-5010' },
  '清水寺': { address: '京都市東山区清水一丁目294', postal_code: '605-0862', tel: '075-551-1234' },
  '西明寺': { address: '京都市右京区梅ケ畑槇尾町1', postal_code: '616-8291', tel: '075-861-1770' },
  '神護寺': { address: '京都市右京区梅ケ畑高雄町5', postal_code: '616-8292', tel: '075-861-1769' },
  '泉涌寺': { address: '京都市東山区泉涌寺山内町27', postal_code: '605-0977', tel: '075-561-1551' },
  '即成院': { address: '京都市東山区泉涌寺山内町28', postal_code: '605-0977', tel: '075-561-3443' },
  '愛宕念仏寺': { address: '京都市右京区嵯峨鳥居本深谷町2-5', postal_code: '616-8439', tel: '075-285-1549' },
  '広隆寺': { address: '京都市右京区太秦蜂岡町32', postal_code: '616-8162', tel: '075-861-1461' },
  '鞍馬寺': { address: '京都市左京区鞍馬本町1074', postal_code: '601-1111', tel: '075-741-2003' },
  '金閣寺': { address: '京都市北区金閣寺町1', postal_code: '603-8361', tel: '075-461-0013' },
  '鹿苑寺': { address: '京都市北区金閣寺町1', postal_code: '603-8361', tel: '075-461-0013' },
  '養源院': { address: '京都市東山区三十三間堂廻り656', postal_code: '605-0941', tel: '075-561-3887' },
  '六道珍皇寺': { address: '京都市東山区大和大路通四条下る小松町595', postal_code: '605-0811', tel: '075-561-4129' },
  '智積院': { address: '京都市東山区東大路通七条下る東瓦町964', postal_code: '605-0951', tel: '075-541-5361' },
  '妙蓮寺': { address: '京都市上京区寺之内通大宮東入る', postal_code: '602-8418', tel: '075-451-3527' },
  '法界寺': { address: '京都市伏見区日野西大道町19', postal_code: '601-1417', tel: '075-571-0024' },
  '妙法院': { address: '京都市東山区妙法院前側町447', postal_code: '605-0932', tel: '075-561-0467' },
  '平安神宮': { address: '京都市左京区岡崎西天王町97', postal_code: '606-8341', tel: '075-761-0221' },
  '京都国立博物館': { address: '京都市東山区茶屋町527', postal_code: '605-0931', tel: '075-525-2473' },
  '圓徳院': { address: '京都市東山区高台寺下河原町530', postal_code: '605-0825', tel: '075-525-0101' },
  '金地院': { address: '京都市左京区南禅寺福地町86-12', postal_code: '606-8435', tel: '075-771-3511' },
  '高台寺': { address: '京都市東山区高台寺下河原町526', postal_code: '605-0825', tel: '075-561-9966' },
  '天球院': { address: '京都市右京区花園妙心寺町46', postal_code: '616-8035', tel: '075-462-4648' },
  '春光院': { address: '京都市右京区花園妙心寺町42', postal_code: '616-8035', tel: '075-462-5488' },
  '二尊院': { address: '京都市右京区嵯峨二尊院門前長神町27', postal_code: '616-8425', tel: '075-861-0687' },
  '清凉寺': { address: '京都市右京区嵯峨釈迦堂藤ノ木町46', postal_code: '616-8447', tel: '075-861-0343' },
  '嵯峨釈迦堂': { address: '京都市右京区嵯峨釈迦堂藤ノ木町46', postal_code: '616-8447', tel: '075-861-0343' },
  '徳林庵': { address: '京都市山科区四ノ宮泉水町16', postal_code: '607-8080', tel: '' },
  '祇王寺': { address: '京都市右京区嵯峨鳥居本小坂町32', postal_code: '616-8436', tel: '075-861-3574' },

  // --- 追加の主要施設 ---
  '東福寺': { address: '京都市東山区本町15丁目778', postal_code: '605-0981', tel: '075-561-0087' },
  '龍安寺': { address: '京都市右京区龍安寺御陵下町13', postal_code: '616-8001', tel: '075-463-2216' },
  '天龍寺': { address: '京都市右京区嵯峨天龍寺芒ノ馬場町68', postal_code: '616-8385', tel: '075-881-1235' },
  '建仁寺': { address: '京都市東山区大和大路通四条下る小松町584', postal_code: '605-0811', tel: '075-561-6363' },
  '相国寺': { address: '京都市上京区相国寺門前町701', postal_code: '602-0898', tel: '075-231-0301' },
  '大徳寺': { address: '京都市北区紫野大徳寺町53', postal_code: '603-8231', tel: '075-491-0019' },
  '知恩院': { address: '京都市東山区林下町400', postal_code: '605-8686', tel: '075-531-2111' },
  '永観堂': { address: '京都市左京区永観堂町48', postal_code: '606-8445', tel: '075-761-0007' },
  '下鴨神社': { address: '京都市左京区下鴨泉川町59', postal_code: '606-0807', tel: '075-781-0010' },
  '賀茂御祖神社': { address: '京都市左京区下鴨泉川町59', postal_code: '606-0807', tel: '075-781-0010' },
  '八坂神社': { address: '京都市東山区祇園町北側625', postal_code: '605-0073', tel: '075-561-6155' },
  '萬福寺': { address: '宇治市五ケ庄三番割34', postal_code: '611-0011', tel: '0774-32-3900' },
  '平等院': { address: '宇治市宇治蓮華116', postal_code: '611-0021', tel: '0774-21-2861' },
};

function enrichFromKnownData(items) {
  let count = 0;
  items.forEach(item => {
    if (item.address && item.address.trim() !== '') return; // 既に住所あり

    // 名称からベース名を抽出して照合
    if (!item.name || typeof item.name !== 'string') return;
    const baseName = item.name
      .split('\u3000')[0]
      .replace(/（.*?）/g, '')
      .replace(/\s+/g, '')
      .trim();

    // 完全一致 → 部分一致の順で検索
    let match = KNOWN_ADDRESSES[baseName];
    if (!match) {
      // ベース名に含まれるキーワードで検索
      for (const [key, val] of Object.entries(KNOWN_ADDRESSES)) {
        if (baseName.includes(key) || key.includes(baseName)) {
          match = val;
          break;
        }
      }
    }

    if (match) {
      if (!item.address || item.address.trim() === '') {
        item.address = match.address;
        count++;
      }
      if (match.postal_code && (!item.postal_code || item.postal_code.trim() === '')) {
        item.postal_code = match.postal_code;
      }
      if (match.tel && (!item.tel || item.tel.trim() === '')) {
        item.tel = match.tel;
      }
    }
  });
  return count;
}

// =====================================================================
// 戦略3: Wikimedia Commons 画像URLの補完
// =====================================================================
// CC BY-SA ライセンスの画像 (商用利用可・帰属表示必要)
// 出典: Wikimedia Commons (https://commons.wikimedia.org/)
// photo_attribution は CC BY-SA の帰属表示に必要な情報を保持する
const WIKIMEDIA_PHOTOS = {
  '北野天満宮': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Kitano-tenmangu_Kyoto_Japan41s3s4500.jpg/640px-Kitano-tenmangu_Kyoto_Japan41s3s4500.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kitano-tenmangu_Kyoto_Japan41s3s4500.jpg' } },
  '高山寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Kozan-ji_Kyoto_Kyoto11s3s4592.jpg/640px-Kozan-ji_Kyoto_Kyoto11s3s4592.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kozan-ji_Kyoto_Kyoto11s3s4592.jpg' } },
  '三十三間堂': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sanjusangendo_temple01s1408.jpg/640px-Sanjusangendo_temple01s1408.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Sanjusangendo_temple01s1408.jpg' } },
  '蓮華王院': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sanjusangendo_temple01s1408.jpg/640px-Sanjusangendo_temple01s1408.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Sanjusangendo_temple01s1408.jpg' } },
  '常寂光寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Jojakko-ji_Kyoto_Kyoto18n4272.jpg/640px-Jojakko-ji_Kyoto_Kyoto18n4272.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Jojakko-ji_Kyoto_Kyoto18n4272.jpg' } },
  '千本釈迦堂': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Daihoon-ji_Kyoto_Kyoto01n4500.jpg/640px-Daihoon-ji_Kyoto_Kyoto01n4500.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Daihoon-ji_Kyoto_Kyoto01n4500.jpg' } },
  '大覚寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Daikaku-ji_Kyoto_Kyoto10n4592.jpg/640px-Daikaku-ji_Kyoto_Kyoto10n4592.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Daikaku-ji_Kyoto_Kyoto10n4592.jpg' } },
  '東寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Toji-temple-kyoto.jpg/640px-Toji-temple-kyoto.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Toji-temple-kyoto.jpg' } },
  '南禅寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Nanzen-ji_sanmon_2021a.jpg/640px-Nanzen-ji_sanmon_2021a.jpg', photo_attribution: { license: 'CC BY-SA 4.0', source_url: 'https://commons.wikimedia.org/wiki/File:Nanzen-ji_sanmon_2021a.jpg' } },
  '二条城': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Nijo_Castle_-_01.jpg/640px-Nijo_Castle_-_01.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Nijo_Castle_-_01.jpg' } },
  '仁和寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Ninnaji_Kyoto01s3s4350.jpg/640px-Ninnaji_Kyoto01s3s4350.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Ninnaji_Kyoto01s3s4350.jpg' } },
  '本願寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Nishi_Honganji01s4592.jpg/640px-Nishi_Honganji01s4592.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Nishi_Honganji01s4592.jpg' } },
  '伏見稲荷大社': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Fushimi_Inari-taisha_2018c.jpg/640px-Fushimi_Inari-taisha_2018c.jpg', photo_attribution: { license: 'CC BY-SA 4.0', source_url: 'https://commons.wikimedia.org/wiki/File:Fushimi_Inari-taisha_2018c.jpg' } },
  '妙心寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Myoshinji_sanmon.jpg/640px-Myoshinji_sanmon.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Myoshinji_sanmon.jpg' } },
  '醍醐寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Daigoji_Kyoto01s3s4560.jpg/640px-Daigoji_Kyoto01s3s4560.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Daigoji_Kyoto01s3s4560.jpg' } },
  '清水寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Kiyomizu-dera_in_Kyoto-r.jpg/640px-Kiyomizu-dera_in_Kyoto-r.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kiyomizu-dera_in_Kyoto-r.jpg' } },
  '金閣寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Kinkaku-ji_2022a.jpg/640px-Kinkaku-ji_2022a.jpg', photo_attribution: { license: 'CC BY-SA 4.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kinkaku-ji_2022a.jpg' } },
  '銀閣寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Ginkaku-ji_after_being_restored_in_2008.jpg/640px-Ginkaku-ji_after_being_restored_in_2008.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Ginkaku-ji_after_being_restored_in_2008.jpg' } },
  '広隆寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Koryu-ji_Kyoto_Kyoto02n4500.jpg/640px-Koryu-ji_Kyoto_Kyoto02n4500.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Koryu-ji_Kyoto_Kyoto02n4500.jpg' } },
  '龍安寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Ryoan-ji_Kyoto01.jpg/640px-Ryoan-ji_Kyoto01.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Ryoan-ji_Kyoto01.jpg' } },
  '天龍寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Tenryu-ji_Kyoto_Kyoto03n4500.jpg/640px-Tenryu-ji_Kyoto_Kyoto03n4500.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Tenryu-ji_Kyoto_Kyoto03n4500.jpg' } },
  '知恩院': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Chionin24n3200.jpg/640px-Chionin24n3200.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Chionin24n3200.jpg' } },
  '建仁寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Kennin-ji_in_Kyoto.jpg/640px-Kennin-ji_in_Kyoto.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kennin-ji_in_Kyoto.jpg' } },
  '大徳寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Daitoku-ji_sanmon.jpg/640px-Daitoku-ji_sanmon.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Daitoku-ji_sanmon.jpg' } },
  '泉涌寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Sennyuji_Kyoto03n4592.jpg/640px-Sennyuji_Kyoto03n4592.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Sennyuji_Kyoto03n4592.jpg' } },
  '高台寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Kodaiji07s3200.jpg/640px-Kodaiji07s3200.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kodaiji07s3200.jpg' } },
  '賀茂別雷神社': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kamigamo-jinja01ns3200.jpg/640px-Kamigamo-jinja01ns3200.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kamigamo-jinja01ns3200.jpg' } },
  '西明寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Saimyoji_Kyoto_Kyoto01n4350.jpg/640px-Saimyoji_Kyoto_Kyoto01n4350.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Saimyoji_Kyoto_Kyoto01n4350.jpg' } },
  '神護寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Jingoji_Kyoto_Kyoto11n4592.jpg/640px-Jingoji_Kyoto_Kyoto11n4592.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Jingoji_Kyoto_Kyoto11n4592.jpg' } },
  '平安神宮': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Heian-jingu_shinen_IMG_5752_0-26.JPG/640px-Heian-jingu_shinen_IMG_5752_0-26.JPG', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Heian-jingu_shinen_IMG_5752_0-26.JPG' } },
  '八坂神社': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Yasaka-Shrine_Gate_of_the_main_hall.JPG/640px-Yasaka-Shrine_Gate_of_the_main_hall.JPG', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Yasaka-Shrine_Gate_of_the_main_hall.JPG' } },
  '鞍馬寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Kurama-dera_honden.jpg/640px-Kurama-dera_honden.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Kurama-dera_honden.jpg' } },
  '松尾大社': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Matsunoo_taisha_torii.jpg/640px-Matsunoo_taisha_torii.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Matsunoo_taisha_torii.jpg' } },
  '智積院': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Chishakuin_Kyoto01s3s4592.jpg/640px-Chishakuin_Kyoto01s3s4592.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Chishakuin_Kyoto01s3s4592.jpg' } },
  '東福寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Tofukuji_Tsutenkyo.jpg/640px-Tofukuji_Tsutenkyo.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Tofukuji_Tsutenkyo.jpg' } },
  '豊国神社': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Toyokuni_jinja02s1024.jpg/640px-Toyokuni_jinja02s1024.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Toyokuni_jinja02s1024.jpg' } },
  '清凉寺': { photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Seiryoji_Kyoto01n4500.jpg/640px-Seiryoji_Kyoto01n4500.jpg', photo_attribution: { license: 'CC BY-SA 3.0', source_url: 'https://commons.wikimedia.org/wiki/File:Seiryoji_Kyoto01n4500.jpg' } },
};

const WIKIMEDIA_COMMONS_PREFIX = 'https://upload.wikimedia.org/';

function enrichPhotos(items) {
  let count = 0;
  items.forEach(item => {
    const hasPhoto = item.photo && item.photo.trim() !== '';
    const isWikimediaPhoto = hasPhoto && item.photo.startsWith(WIKIMEDIA_COMMONS_PREFIX);
    const hasAttribution = !!item.photo_attribution;

    // 写真が Wikimedia 以外のソースからある場合は手を加えない
    if (hasPhoto && !isWikimediaPhoto) return;
    // Wikimedia の写真があり帰属表示も揃っている場合もスキップ
    if (isWikimediaPhoto && hasAttribution) return;

    if (!item.name || typeof item.name !== 'string') return;
    const baseName = item.name
      .split('\u3000')[0]
      .replace(/（.*?）/g, '')
      .replace(/\s+/g, '')
      .trim();

    let entry = WIKIMEDIA_PHOTOS[baseName];
    if (!entry) {
      for (const [key, val] of Object.entries(WIKIMEDIA_PHOTOS)) {
        if (baseName.includes(key) || key.includes(baseName)) {
          entry = val;
          break;
        }
      }
    }

    if (entry) {
      if (!hasPhoto) {
        // 新規に写真を設定
        item.photo = entry.photo;
        count++;
      }
      // Wikimedia 写真には必ず帰属表示を付与（新規・既存を問わず）
      item.photo_attribution = entry.photo_attribution;
    }
  });
  return count;
}

// =====================================================================
// メイン処理
// =====================================================================
function main() {
  console.log('========================================');
  console.log('京都観光データ品質向上スクリプト');
  console.log('========================================\n');

  // データ読み込み
  const rawData = JSON.parse(fs.readFileSync(SIGHTS_PATH, 'utf-8'));
  const isArray = Array.isArray(rawData);
  // Object形式の場合はキー順を保持するため entries で扱い、items は値配列として処理する
  const rawKeys = isArray ? null : Object.keys(rawData);
  const items = isArray ? rawData : Object.values(rawData);

  // 補完前の統計
  const beforeStats = {
    total: items.length,
    missingAddress: items.filter(i => !i.address || i.address.trim() === '').length,
    missingPhoto: items.filter(i => !i.photo || i.photo.trim() === '').length,
    missingTel: items.filter(i => !i.tel || i.tel.trim() === '').length,
    missingPostal: items.filter(i => !i.postal_code || i.postal_code.trim() === '').length,
  };

  console.log('【補完前の状態】');
  console.log(`  総レコード数: ${beforeStats.total}`);
  console.log(`  住所欠損: ${beforeStats.missingAddress}件 (${(beforeStats.missingAddress/beforeStats.total*100).toFixed(1)}%)`);
  console.log(`  写真欠損: ${beforeStats.missingPhoto}件 (${(beforeStats.missingPhoto/beforeStats.total*100).toFixed(1)}%)`);
  console.log(`  電話欠損: ${beforeStats.missingTel}件 (${(beforeStats.missingTel/beforeStats.total*100).toFixed(1)}%)`);
  console.log(`  郵便番号欠損: ${beforeStats.missingPostal}件 (${(beforeStats.missingPostal/beforeStats.total*100).toFixed(1)}%)\n`);

  // 戦略1: 同一施設内の住所伝搬
  console.log('--- 戦略1: 同一施設内の住所伝搬 ---');
  const propagated = propagateSiblingAddresses(items);
  console.log(`  ${propagated}件の住所を同一施設から伝搬\n`);

  // 戦略2: 公知データによる補完
  console.log('--- 戦略2: 公知の京都名所データによる補完 ---');
  const enriched = enrichFromKnownData(items);
  console.log(`  ${enriched}件の住所を公知データから補完\n`);

  // 戦略3: 写真URL補完
  console.log('--- 戦略3: Wikimedia Commons 画像URLの補完 ---');
  const photosAdded = enrichPhotos(items);
  console.log(`  ${photosAdded}件の写真URLを追加\n`);

  // 補完後の統計
  const afterStats = {
    total: items.length,
    missingAddress: items.filter(i => !i.address || i.address.trim() === '').length,
    missingPhoto: items.filter(i => !i.photo || i.photo.trim() === '').length,
    missingTel: items.filter(i => !i.tel || i.tel.trim() === '').length,
    missingPostal: items.filter(i => !i.postal_code || i.postal_code.trim() === '').length,
  };

  console.log('========================================');
  console.log('【補完後の状態】');
  console.log(`  住所欠損: ${beforeStats.missingAddress} → ${afterStats.missingAddress}件 (${beforeStats.missingAddress - afterStats.missingAddress}件改善)`);
  console.log(`  写真欠損: ${beforeStats.missingPhoto} → ${afterStats.missingPhoto}件 (${beforeStats.missingPhoto - afterStats.missingPhoto}件改善)`);
  console.log(`  電話欠損: ${beforeStats.missingTel} → ${afterStats.missingTel}件 (${beforeStats.missingTel - afterStats.missingTel}件改善)`);
  console.log(`  郵便番号欠損: ${beforeStats.missingPostal} → ${afterStats.missingPostal}件 (${beforeStats.missingPostal - afterStats.missingPostal}件改善)`);
  console.log('========================================\n');

  // ファイル書き出し（元の構造を維持）
  let output;
  if (isArray) {
    output = items;
  } else {
    output = {};
    rawKeys.forEach((key, idx) => { output[key] = items[idx]; });
  }
  fs.writeFileSync(SIGHTS_PATH, JSON.stringify(output, null, 2) + '\n');
  console.log(`データを ${SIGHTS_PATH} に保存しました。\n`);

  // 残存する住所欠損の内訳
  const stillMissing = items.filter(i => !i.address || i.address.trim() === '');
  const categories = { temples: 0, literature: 0, food: 0, culture: 0, nature: 0, area: 0, other: 0 };
  stillMissing.forEach(i => {
    const desc = i.description || '';
    const name = i.name || '';
    if (desc.match(/寺|神社|堂|院|殿|城|門|塔|閣/) && desc.match(/建|造|築/)) categories.temples++;
    else if (desc.match(/小説|著|文学|作品|歌集|日記|随筆|物語集/)) categories.literature++;
    else if (name.match(/料理|漬|そば|豆腐|麩|茄子|野菜|湯葉|七味|寿司/)) categories.food++;
    else if (name.match(/茶道|狂言|雅楽|歌舞伎|舞妓|念仏|蹴鞠|いけばな|京舞|大原女|太夫|六斎/)) categories.culture++;
    else if (name.match(/山$|川$|峰$|峠$|池$|滝$/) || desc.match(/山系|河川|峠/)) categories.nature++;
    else if (name.length <= 5 && desc.match(/地名|一帯|地域|地区/)) categories.area++;
    else categories.other++;
  });

  console.log('【残存する住所欠損の内訳】');
  console.log(`  寺社仏閣（さらなる補完が必要）: ${categories.temples}件`);
  console.log(`  文学作品（住所不要）: ${categories.literature}件`);
  console.log(`  食文化（住所不要）: ${categories.food}件`);
  console.log(`  伝統文化（住所不要）: ${categories.culture}件`);
  console.log(`  自然地形（地域のみ）: ${categories.nature}件`);
  console.log(`  地名・エリア（住所不要）: ${categories.area}件`);
  console.log(`  その他: ${categories.other}件`);
}

main();

import { normalize } from '@geolonia/normalize-japanese-addresses';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.join(__dirname, '../../src/app/pages/sights/dataset/kyoto-sights.json');

/**
 * 京都の住所データに都道府県・市名を補完してから正規化する
 */
function complementAddress(address) {
  // 既に都道府県が含まれている場合はそのまま返す
  if (/^.{2,3}[都道府県]/.test(address)) {
    return address;
  }
  // 「京都市」から始まる場合は「京都府」を補完
  if (address.startsWith('京都市')) {
    return '京都府' + address;
  }
  // 「○○区」から始まる場合は「京都府京都市」を補完
  if (/^[^\d]{1,4}区/.test(address)) {
    return '京都府京都市' + address;
  }
  // それ以外（町名から始まるなど）は「京都府京都市」を補完
  return '京都府京都市' + address;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item.address) {
      skipCount++;
      continue;
    }

    const complemented = complementAddress(item.address);

    try {
      const result = await normalize(complemented);
      const normalized = [result.pref, result.city, result.town, result.addr]
        .filter(Boolean)
        .join('');

      if (result.level >= 2) {
        console.log(`✅ [${i + 1}/${data.length}] "${item.address}" -> "${normalized}" (level: ${result.level})`);
        item.address = normalized;
        successCount++;
      } else {
        console.log(`⚠️  [${i + 1}/${data.length}] Low confidence for "${item.address}" (level: ${result.level}), keeping original`);
        failCount++;
      }
    } catch (e) {
      console.log(`❌ [${i + 1}/${data.length}] Failed: "${item.address}" - ${e.message}`);
      failCount++;
    }

    // API負荷軽減のため少し待機
    await sleep(100);
  }

  fs.writeFileSync(inputPath, JSON.stringify(data, null, 2));

  console.log('\n--- Summary ---');
  console.log(`Total:   ${data.length}`);
  console.log(`Success: ${successCount}`);
  console.log(`Skipped: ${skipCount} (empty address)`);
  console.log(`Failed:  ${failCount}`);
  console.log(`\nOutput: ${inputPath}`);
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

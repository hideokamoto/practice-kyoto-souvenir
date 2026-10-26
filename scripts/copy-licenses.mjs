// ng build が配信フォルダの外に出力する 3rdpartylicenses.txt を、アプリ内のライセンス画面から読めるよう配信フォルダへコピーする。
import { copyFileSync, existsSync } from 'node:fs';

const from = 'dist/kyoto-ikezu-quiz/3rdpartylicenses.txt';
const to = 'dist/kyoto-ikezu-quiz/browser/3rdpartylicenses.txt';

if (!existsSync(from)) {
  console.error(`${from} がありません。先に本番ビルドを実行してください。`);
  process.exit(1);
}
copyFileSync(from, to);
console.log(`Copied ${from} -> ${to}`);

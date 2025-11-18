# 京都みやげアプリ

京都の観光スポットとお土産情報を提供するIonicアプリケーションです。

## セットアップ

### 必要な環境

- Node.js
- npm または yarn
- Ionic CLI

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm start
```

### ビルド

```bash
npm run build
```

## データの更新

### assetsフォルダのスクリプト・データについて

このプロジェクトでは、`assets`フォルダにCSVデータをJSONに変換するスクリプトが含まれています。

#### ディレクトリ構造

```
assets/
├── package.json          # csvtojsonパッケージの依存関係
├── sights/               # 観光スポットデータ
│   ├── csv2json.js      # CSV→JSON変換スクリプト
│   └── DSIGHT_1.csv     # 観光スポットのCSVデータ
└── souvenires/          # お土産データ
    ├── csv2json.js      # CSV→JSON変換スクリプト
    └── DSOURVENIR_0.csv # お土産のCSVデータ
```

#### データの更新手順

1. **依存関係のインストール**

   `assets`フォルダに移動して、必要なパッケージをインストールします：

   ```bash
   cd assets
   npm install
   ```

2. **CSVデータの更新**

   - 観光スポットデータを更新する場合：`assets/sights/DSIGHT_1.csv`を編集
   - お土産データを更新する場合：`assets/souvenires/DSOURVENIR_0.csv`を編集

3. **JSONデータの生成**

   - 観光スポットデータを変換する場合：

     ```bash
     cd assets/sights
     node csv2json.js

   - お土産データを変換する場合：

     ```bash
     cd assets/souvenires
     node csv2json.js

   **注意**: 出力先のパスは相対パスで指定してください。上記のコマンドは`assets`フォルダから実行することを想定しています。

4. **生成されたJSONの確認**

   生成されたJSONファイルが正しく作成されているか確認してください：
   - `src/app/pages/sights/dataset/kyoto-sights.json`
   - `src/app/pages/souvenir/dataset/kyoto-souvenir.json`

#### スクリプトの仕様

- **観光スポットスクリプト** (`assets/sights/csv2json.js`)
  - CSVファイルの各フィールドをマッピングし、郵便番号を結合する処理を含みます
  - 出力されるJSONには、id、name、name_kana、description、住所、連絡先などの情報が含まれます

- **お土産スクリプト** (`assets/souvenires/csv2json.js`)
  - CSVファイルから基本的な情報（id、name、name_kana、description）を抽出します
  - シンプルな構造でJSONを生成します

#### トラブルシューティング

- CSVファイルのエンコーディングがUTF-8であることを確認してください
- CSVファイルのヘッダー行がない場合、スクリプト内で定義されたヘッダーが使用されます
- JSONの生成に失敗する場合は、CSVファイルの形式を確認してください


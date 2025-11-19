# E2E Tests (Playwright)

このディレクトリには、Playwrightを使用したE2Eテストが含まれています。

## 再発防止テスト

これらのテストは、過去に発生した問題の再発を防ぐために作成されました：

### 1. `discover-page.spec.ts`
Discoverページの重要な機能を検証します：

- **ion-router-outletの重複チェック**
  - 問題: `app.component.html`に明示的な`ion-router-outlet`が存在し、`ion-tabs`が自動生成するものと重複していた
  - 修正: 明示的な`ion-router-outlet`を削除
  - テスト: `should have only one ion-router-outlet`

- **スクロール機能の検証**
  - 問題: `ion-content`のスクロールが機能していなかった
  - 修正: CSSでスクロールを有効化
  - テスト: `should enable scrolling`

- **ナビゲーション機能の検証**
  - ボタンクリックによる遷移が正常に動作することを確認
  - テスト: `should navigate when clicking recommendation buttons`, `should navigate when clicking list items`

## 実行方法

### 開発サーバーを起動してから実行
```bash
npm start
# 別のターミナルで
npm run e2e:playwright
```

### UIモードで実行（推奨）
```bash
npm run e2e:playwright:ui
```

### ヘッド付きモードで実行（デバッグ用）
```bash
npm run e2e:playwright:headed
```

## CI/CDでの実行

`playwright.config.ts`でCI環境用の設定が含まれています：
- CI環境では自動的にリトライが有効になります
- スクリーンショットとトレースが自動的に保存されます

## テストの追加

新しいテストを追加する際は、以下の点に注意してください：

1. **再発防止テストには明確なコメントを追加**
   - どの問題を防ぐためのテストか
   - どのような修正が行われたか

2. **適切な待機処理**
   - Ionicアプリは非同期でデータを読み込むため、適切な待機処理が必要です
   - `waitForSelector`や`waitForTimeout`を使用してください

3. **テストの独立性**
   - 各テストは独立して実行できるようにしてください
   - `beforeEach`で適切な初期化を行ってください


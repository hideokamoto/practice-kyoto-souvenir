# Private Plugin 登録ガイド（apple-hig-design）

このドキュメントは、`apple-hig-design` を **あなたのアカウントだけ** で使うための手順です。

アカウント: `kokkoku214@gmail.com`（Hidetaka Okamoto）

---

## 方法を選ぶ

| 方法 | プラン | 特徴 |
|---|---|---|
| **A. ローカル登録** | 全プラン | その Mac の Cursor にだけ入る。Dashboard 操作不要 |
| **B. Team Marketplace** | Teams / Enterprise | Dashboard から private repo を import。チーム配布も可 |

公開 Marketplace（cursor.com/marketplace/publish）への登録は **プライベートにはなりません**。

---

## A. 個人アカウント向け：ローカル登録（推奨・即日）

Cursor が公式に案内している「テスト用ローカル読み込み」と同じ仕組みです。private 相当の使い方になります。

### 1. プラグインを配置

```bash
# このリポジトリを clone 済みなら
./cursor-plugins/apple-hig-design/scripts/install.sh plugin
```

手動の場合:

```bash
mkdir -p ~/.cursor/plugins/local/
rm -rf ~/.cursor/plugins/local/apple-hig-design
cp -R cursor-plugins/apple-hig-design ~/.cursor/plugins/local/apple-hig-design
```

### 2. Cursor を再読み込み

- `Developer: Reload Window` を実行、または Cursor を再起動

### 3. 確認

1. サイドバー **Customize** を開く
2. **Skills** に `apple-hig-design` が表示されるか確認
3. チャットで `/apple-hig-design` または「HIG に沿って UI を設計して」と試す

### トラブルシュート

- **設定** → `Include third-party Plugins, Skills, and other configs` が **ON** か確認
- パスは `~/.cursor/plugins/local/apple-hig-design/.cursor-plugin/plugin.json` であること（1 階層深くないこと）
- Enterprise で `userLocal=false` になっている場合は、組織管理者にローカルプラグイン許可を依頼

### 開発中は symlink が便利

```bash
ln -sf "$(pwd)/cursor-plugins/apple-hig-design" ~/.cursor/plugins/local/apple-hig-design
```

---

## B. Team Marketplace：Dashboard から private 登録

**Teams または Enterprise プラン** が必要です。リポジトリは **GitHub private repo** でホストします。

### 前提

- リポジトリルートに `.cursor-plugin/marketplace.json` がある（本リポジトリに追加済み）
- プラグイン本体は `cursor-plugins/apple-hig-design/` にある

### 手順

1. **GitHub**
   - このブランチ（または main）を private repo に push 済みであること
   - [Cursor GitHub App](https://cursor.com/dashboard?tab=integrations) をインストールし、対象 repo へアクセスを付与

2. **Cursor Dashboard**
   - https://cursor.com/dashboard を開く
   - **Plugins** → **Team Marketplaces** → **Add Marketplace**
   - **Import from Repo** を選択
   - リポジトリ URL を入力:
     `https://github.com/hideokamoto/practice-kyoto-souvenir`
   - 解析後、`apple-hig-design` が一覧に出ることを確認 → **Add to Marketplace**

3. **配布設定**（任意）
   - **Marketplace Access**: 自分だけ / 特定グループ
   - **Installation mode**:
     - `Default Off` … 自分でインストール
     - `Default On` … 自動インストール（オプトアウト可）
     - `Required` … 常時インストール
   - **Enable Auto Refresh** … push で自動更新（GitHub App 必須）

4. **IDE 側**
   - **Customize** → Team marketplace の `apple-hig-design` をインストール

### private repo でインストールが空になる場合

既知の不具合で、Dashboard 経由の clone が失敗することがあります。その場合は **方法 A（ローカル配置）** で回避できます。

---

## リポジトリ構成（Team Marketplace 用）

```text
practice-kyoto-souvenir/
├── .cursor-plugin/
│   └── marketplace.json          ← Dashboard が読む
└── cursor-plugins/
    └── apple-hig-design/
        ├── .cursor-plugin/
        │   └── plugin.json
        └── skills/apple-hig-design/
            ├── SKILL.md
            └── references/
```

---

## よくある質問

**Q. Pro プランだけでも Dashboard に登録できる？**  
A. Team Marketplace は Teams/Enterprise 限定です。Pro では **方法 A** を使ってください。

**Q. このアプリのプロジェクトだけで使いたい**  
A. プロジェクトスコープなら次でも可:

```bash
./cursor-plugins/apple-hig-design/scripts/install.sh project
# → .cursor/skills/apple-hig-design/
```

**Q. Cloud Agent でも使える？**  
A. Cloud Agent の環境に skill を同梱するか、リポジトリの `.cursor/skills/` に置くとエージェントが読めます。

# Apple HIG Design — Cursor Plugin

Apple Human Interface Guidelines（HIG, 2025年6月 Liquid Glass 改訂版）を単一ソースとする UI/UX 設計スキルの Cursor プラグインです。

HIG 公式分類（Foundations / Patterns / Components / Inputs / Technologies / Platforms）を MECE の骨格とし、**7 フェーズの設計ワークフロー**で設計判断・レビューを行います。

## 含まれるもの

| パス | 内容 |
|---|---|
| `skills/apple-hig-design/SKILL.md` | メインスキル（ワークフロー・監査チェックリスト・禁則） |
| `skills/apple-hig-design/references/index.md` | HIG 全ページ台帳（MECE 完全性チェック用） |
| `skills/apple-hig-design/references/foundations.md` | レイアウト・タイポ・色・マテリアル等 |
| `skills/apple-hig-design/references/structure-navigation.md` | ナビゲーション・モーダリティ・提示方式 |
| `skills/apple-hig-design/references/components.md` | コンポーネントカタログ（7 分類） |
| `skills/apple-hig-design/references/patterns-inputs.md` | 場面別パターン・入力手段 |
| `skills/apple-hig-design/references/platforms.md` | 6 プラットフォーム固有仕様 |
| `skills/apple-hig-design/references/accessibility-privacy.md` | アクセシビリティ・インクルージョン・プライバシー |
| `skills/apple-hig-design/references/web-adaptation.md` | Web サイトへの翻訳指針（HIG 外の解釈） |

## Private 登録（このアカウント向け）

詳細手順は [PRIVATE_SETUP.md](./PRIVATE_SETUP.md) を参照。

**個人アカウント（全プラン）— いちばん手軽:**

```bash
./scripts/install.sh plugin
# → ~/.cursor/plugins/local/apple-hig-design
```

**Teams / Enterprise — Dashboard から private repo import:**

1. https://cursor.com/dashboard → **Plugins** → **Add Marketplace** → **Import from Repo**
2. `https://github.com/hideokamoto/practice-kyoto-souvenir` を指定
3. `apple-hig-design` を marketplace に追加

リポジトリルートの `.cursor-plugin/marketplace.json` が import 用マニフェストです。

## インストール

### 方法 A: プロジェクトにコピー（推奨）

```bash
# リポジトリ直下で
cp -R cursor-plugins/apple-hig-design/skills/apple-hig-design .cursor/skills/
```

### 方法 B: グローバルインストール

```bash
cp -R cursor-plugins/apple-hig-design/skills/apple-hig-design ~/.cursor/skills/
```

### 方法 C: Cursor プラグインとしてローカル配置

```bash
mkdir -p ~/.cursor/plugins/local/
cp -R cursor-plugins/apple-hig-design ~/.cursor/plugins/local/apple-hig-design
```

Cursor を再起動すると、スキル `apple-hig-design` がエージェントに読み込まれます。

## 使い方

エージェントに次のような依頼をすると、スキルが自動適用されます（`description` に基づくトリガー）。

- 「アプリの UI を設計して」
- 「HIG に準拠しているかレビューして」
- 「タブバーとサイドバーどちらにすべき？」
- 「シートとアラートの使い分け」
- 「Dynamic Type / ダークモード対応を確認して」

手動で呼び出す場合:

```
/apple-hig-design
```

## 7 フェーズワークフロー

1. **前提確定** — プラットフォーム・デバイス・入力手段
2. **構造とナビゲーション** — 情報階層・ナビ部品選定
3. **視覚基盤** — タイポ・色・マテリアル・レイアウト
4. **コンポーネント選定** — システム部品優先
5. **パターンとインタラクション** — 起動〜エラー時の定石
6. **プラットフォーム適応** — 各 OS 固有仕様への調整
7. **アクセシビリティ監査** — 最終チェックリスト

## 注意

- 本プラグインの `web-adaptation.md` は **HIG 原文ではない** Web 向け翻訳指針です
- references のコーパスは 2025-07-20 抽出時点。2026 年 6 月以降は原典の改訂有無を確認してください
- San Francisco / SF Symbols / Liquid Glass の見た目模倣は禁則（スキル本文参照）

## ライセンス

MIT

## 原典

https://developer.apple.com/design/human-interface-guidelines

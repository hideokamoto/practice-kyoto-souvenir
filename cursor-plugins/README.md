# Cursor Plugins

このディレクトリには、Cursor IDE 向けのプラグインパッケージを格納します。

## プラグイン一覧

| プラグイン | 説明 |
|---|---|
| [apple-hig-design](./apple-hig-design/) | Apple Human Interface Guidelines に基づく UI/UX 設計スキル |

## ディレクトリ構成（共通）

各プラグインは [Cursor Plugins reference](https://cursor.com/docs/reference/plugins) に準拠しています。

```text
<plugin-name>/
├── .cursor-plugin/
│   └── plugin.json        # 必須マニフェスト
├── skills/                # Agent Skills（SKILL.md）
├── rules/                 # （任意）Cursor Rules
├── commands/              # （任意）スラッシュコマンド
└── README.md
```

---
name: apple-hig-design
description: >-
  Apple Human Interface Guidelines（HIG, 2025年6月 Liquid Glass 改訂版）を単一ソースとする、
  サイト・アプリの UI/UX デザインスキル。HIG の公式分類（Foundations / Patterns / Components /
  Inputs / Technologies / Platforms）を MECE の骨格として、構造設計→ナビゲーション→視覚基盤→
  コンポーネント選定→インタラクション→プラットフォーム適応→アクセシビリティ監査の 7 フェーズで
  設計判断を行う。以下のリクエストで必ずこのスキルを使うこと：「アプリのUIを設計して」
  「iOS/iPadOS/macOS/watchOS/tvOS/visionOS アプリのデザイン」「HIGに準拠しているかレビューして」
  「Apple らしいデザインにして」「Liquid Glass に対応させたい」「この画面のナビゲーション構成を考えて」
  「タブバーとサイドバーどちらにすべき？」「シートとアラートの使い分け」「Dynamic Type 対応」
  「ダークモード対応」「アプリのアクセシビリティを確認して」等。Web サイトのデザインでも、
  Apple 的な設計原則（階層・一貫性・アクセシビリティ・タイポグラフィ）を適用したい文脈なら
  スキル名が明示されなくても使うこと。モバイルアプリ・デスクトップアプリの画面設計、
  UI コンポーネントの選定・使い分け、デザインレビューが話題になったら参照する。
---

# apple-hig-design

Apple Human Interface Guidelines（以下 HIG）を単一ソースとして、サイト・アプリの設計判断を行うスキル。

## 出典と鮮度（最初に読むこと）

- 原典: https://developer.apple.com/design/human-interface-guidelines
- 本スキルの references/ は HIG 全文抽出コーパス（2025-07-20 抽出、2025-06-09 の Liquid Glass 改訂を含む）から蒸留したもの。各項目に原典 URL を付す
- **一次情報ルール**: 数値仕様（pt 値・寸法・比率）や最新のコンポーネント挙動を根拠に断定する場合、references の記載だけで足りなければ原典 URL を fetch して確認する。HIG は年次改訂（WWDC 期）があるため、2026 年 6 月以降の作業では改訂有無を最初に確認する
- `references/index.md` の凡例: ● = 蒸留済み（コーパス検証済み）、○ = 台帳のみ（原典 URL を直接参照すること）

## 適用範囲の判定

| 対象 | 扱い |
|---|---|
| Apple プラットフォームのアプリ（iOS / iPadOS / macOS / tvOS / visionOS / watchOS） | HIG をそのまま規範として適用 |
| Web サイト・Web アプリ | HIG の原則を翻訳して適用。`references/web-adaptation.md` を読む。HIG 外の判断であることを成果物に明記する |
| Android 等 他プラットフォーム | 本スキルの対象外。HIG の押し付けはプラットフォーム規範違反（HIG 自身が「プラットフォームに馴染むこと」を要求している） |

## MECE 全体マップ

HIG 公式の 6 分類をそのまま骨格とする。この分類は「何についての指針か」で相互排他になっている：

1. **Foundations（基礎）** — すべての画面に横断適用される視覚・情報設計の原則。レイアウト、タイポグラフィ、色、マテリアル（Liquid Glass）、アイコン、画像、モーション、ブランディング、アクセシビリティ、インクルージョン、プライバシー、ダークモード、RTL、ライティング
2. **Patterns（パターン）** — 特定のユーザー行為・場面に対する定石。起動、オンボーディング、ローディング、検索、データ入力、フィードバック、モーダリティ、通知、設定、Undo、評価依頼など
3. **Components（コンポーネント）** — 部品カタログ。HIG 内でさらに 7 分類（Content / Layout and organization / Menus and actions / Navigation and search / Presentation / Selection and input / Status）で MECE
4. **Inputs（入力手段）** — デバイス固有の入力。ジェスチャ、キーボード、ポインタ、Digital Crown、視線（Eyes）、リモコン、Apple Pencil など
5. **Technologies（技術統合）** — Apple 技術との統合指針。Widgets、Live Activities、SF Symbols、Apple Pay、Siri、SharePlay、Sign in with Apple など
6. **Platforms（プラットフォーム）** — 6 プラットフォーム各々の性格と固有仕様

分類間の境界規則：「部品そのもの」は Components、「部品を使う場面の定石」は Patterns、「全画面共通の視覚原則」は Foundations に属する。迷ったら `references/index.md` の台帳で所属を確認する。

## 設計ワークフロー（7 フェーズ）

新規設計でもレビューでも、この順で判断する。レビューの場合は各フェーズを監査観点として使う。

### Phase 1: 前提確定
対象プラットフォーム・デバイス・入力手段を確定する。ここが決まらないと以降の判断基準（タップターゲット、ナビゲーション部品、レイアウト値）がすべて宙に浮く。
→ `references/platforms.md`

### Phase 2: 構造とナビゲーション
情報階層を決め、ナビゲーション方式（タブバー / サイドバー / 階層ナビゲーション / モーダル）を選定する。iPadOS では両対応の convertible tab bar も検討。モーダリティは「完結する単一タスク」にのみ使う。
→ `references/structure-navigation.md`

### Phase 3: 視覚基盤（Foundations）
レイアウトグリッド・safe area・タイポグラフィ（テキストスタイルと Dynamic Type）・カラー（システムカラー優先・ライト/ダーク両対応）・マテイアルの層構造（Liquid Glass はコントロール層専用、コンテンツ層に使わない）を決める。
→ `references/foundations.md`

### Phase 4: コンポーネント選定
画面の各要素に対し、カスタム実装より先にシステムコンポーネントを検討する。使い分けに迷う組（アラート vs アクションシート vs シート、ポップオーバー vs シート、セグメンテッドコントロール vs タブバー等）は必ずカタログの使い分け規則を確認する。
→ `references/components.md`

### Phase 5: パターンとインタラクション
起動〜オンボーディング〜日常利用〜エラー時の各場面をパターン集に照らす。入力手段ごとの作法（ジェスチャの標準割当を上書きしない等）を確認する。
→ `references/patterns-inputs.md`

### Phase 6: プラットフォーム適応
Phase 1〜5 の設計を各プラットフォーム固有仕様（tvOS のグリッド寸法と focus、visionOS の 60pt 間隔と ornaments、watchOS の全幅レイアウト等）に照らして調整する。
→ `references/platforms.md`

### Phase 7: アクセシビリティ・品質監査
最終チェックリスト（下記）と `references/accessibility-privacy.md` で監査する。アクセシビリティは最後の追加作業ではなく Phase 3〜5 の判断に織り込むのが本来だが、監査としても必ず独立実施する。

## 最終監査チェックリスト（数値はコーパス検証済み）

- [ ] タップ/クリックターゲットは最小 44x44pt（visionOS のインタラクティブ要素は中心間 60pt 以上）
- [ ] テキストコントラスト: 17pt 以下は 4.5:1 以上、18pt 以上または Bold は 3:1 以上（WCAG AA 準拠、Increase Contrast 設定時の代替も用意）
- [ ] Dynamic Type 対応（iOS 既定 Large: Body 17/22pt。最小 Caption2 11pt。全サイズで崩れないか）
- [ ] システムカラー・セマンティックカラーを優先し、ライト/ダーク両外観で確認済み
- [ ] Liquid Glass はコントロール/ナビゲーション層のみ。コンテンツ層は標準マテリアル
- [ ] safe area・レイアウトマージンを尊重（Dynamic Island、カメラハウジング、tvOS 上下 60pt / 左右 80pt インセット）
- [ ] 色だけに依存した情報伝達をしていない（アイコン・テキストの併用）
- [ ] VoiceOver ラベル、フォーカス順序、キーボード操作（macOS/iPadOS）
- [ ] RTL 言語・ローカライズ時のテキスト伸長を考慮
- [ ] 標準ジェスチャ・標準ショートカットの意味を上書きしていない
- [ ] モーション: 意味のあるアニメーションのみ。Reduce Motion 設定への応答
- [ ] プライバシー: データ収集は目的を明示して最小限、許可要求は文脈のあるタイミングで

## references/ 振り分け表

| 知りたいこと | 参照先 |
|---|---|
| HIG 全ページの台帳・所属・URL（MECE の完全性確認） | `references/index.md` |
| レイアウト・タイポ・色・マテリアル・アイコン・モーション | `references/foundations.md` |
| アクセシビリティ・インクルージョン・プライバシー | `references/accessibility-privacy.md` |
| ナビゲーション構成・モーダリティ・提示方式の使い分け | `references/structure-navigation.md` |
| コンポーネント個別の用途・使い分け・仕様値 | `references/components.md` |
| 場面別パターン（起動・検索・通知等）と入力手段 | `references/patterns-inputs.md` |
| プラットフォーム別の性格・固有仕様・寸法表 | `references/platforms.md` |
| Web サイトへの翻訳指針（HIG 外） | `references/web-adaptation.md` |

読み方: 単発の質問（例「シートとポップオーバーの使い分け」）は該当 reference だけを読む。画面設計・全体レビューはワークフロー順に必要な reference を読む。台帳（index.md）で ○ 印の項目は蒸留がないため、原典 URL を fetch してから答える。

## 禁則

- HIG の記憶だけで数値仕様を断定しない。references か原典で裏を取る
- 「Apple 風の見た目」だけを目的に Liquid Glass や翻訳版 San Francisco 風フォントを他プラットフォームや Web に持ち込む提案をしない（ライセンスとプラットフォーム規範の両面で不適切。San Francisco フォントは Apple プラットフォーム向けにのみ許諾されている）
- カスタムコンポーネントを提案する前に、必ずシステムコンポーネントで足りないかを検討し、足りない理由を明示する

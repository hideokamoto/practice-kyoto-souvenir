# Foundations — 全画面横断の視覚・情報設計原則

出典: HIG 各ページ（2025-06 Liquid Glass 改訂を含む）。URL は developer.apple.com/design/human-interface-guidelines/ 配下のスラッグ。

## Layout（/layout）

- **グルーピング**: 余白・背景形状・色・マテリアル・区切り線で関連要素をまとめ、コンテンツとコントロールを明確に区別する
- **重要情報を最初に**: 読み順（上→下、leading→trailing）で最重要項目を上・leading 側に置く。RTL 言語で読み順が反転することを前提に設計する
- **端まで広げる**: 背景・全画面アートは画面端まで。スクロール領域は画面の下端・側端まで届かせる。サイドバーやタブバーはコンテンツの「上に浮く」層なので、コンテンツが全幅に満たない場合は background extension view で背後の見た目を補う（Liquid Glass 前提の 2025 改訂点）
- **視覚階層**: コントロールとコンテンツの区別に Liquid Glass を使う。コンテンツとコントロール領域の境界には背景ではなく scroll edge effect を使う（soft edge = iOS/iPadOS の標準、hard edge = macOS の不透明で強い境界。ピン留めテーブルヘッダ等）
- **整列と段階的開示**: 整列でスキャン性と階層を伝える。全部見せられないコレクションは「まだある」ことを部分表示やディスクロージャで示す
- **適応性**: 画面サイズ・向き・Dynamic Island・Display Zoom・Dynamic Type・ロケール（RTL、テキスト伸長）への適応を SwiftUI / Auto Layout で担保。最大レイアウトと最小レイアウトを先にテストする
- **ガイドと safe area**: システム定義の layout guide（可読幅の制限を含む）と safe area を尊重する。Dynamic Island・カメラハウジング等の回避は safe area で行う
- **サイズクラス**: regular / compact の組み合わせで適応（iPhone 縦 = compact width × regular height 等。機種別表は原典 /layout の Specifications）
- **iOS**: 縦横両対応が基本。full-width ボタンは避け、システムマージンにインセットする。ステータスバーは原則表示（没入体験のみ非表示可）
- **iPadOS**: ウィンドウは macOS 同様に自由リサイズされる。フルスクリーン設計を先に行い、compact への切替は可能な限り遅らせる。1/2・1/3・1/4 分割サイズでテスト。ナビゲーションは convertible tab bar（サイドバー⇔タブバー切替）を検討
- **macOS**: ウィンドウ下端に重要コントロールを置かない（下端は画面外に出されがち）。カメラハウジング領域を避ける

## Typography（/typography）

- システムフォントは **SF Pro**（および SF Compact / SF Mono / New York〔セリフ〕ファミリー）。San Francisco フォントの使用許諾は Apple プラットフォーム向けに限られる
- **テキストスタイルを使う**: 生のポイント指定ではなくスタイル（Large Title〜Caption 2）を使うことで Dynamic Type に自動追従する
- iOS/iPadOS の既定サイズ（Large。コーパス検証済み、単位 pt: サイズ/行送り）:

| スタイル | ウェイト | サイズ/行送り |
|---|---|---|
| Large Title | Regular | 34/41 |
| Title 1 | Regular | 28/34 |
| Title 2 | Regular | 22/28 |
| Title 3 | Regular | 20/25 |
| Headline | Semibold | 17/22 |
| Body | Regular | 17/22 |
| Callout | Regular | 16/21 |
| Subhead | Regular | 15/20 |
| Footnote | Regular | 13/18 |
| Caption 1 | Regular | 12/16 |
| Caption 2 | Regular | 11/13 |

- Dynamic Type は xSmall〜xxxLarge + アクセシビリティ 5 段階。全サイズで崩れないこと（サイズ別の全表は原典 /typography）
- カスタムフォントは可読性が担保でき、Bold Text・Larger Type 等のアクセシビリティ設定に応答できる場合のみ。見出しにカスタム、本文にシステムフォントの併用が定石（/branding）
- 2025 改訂: 左揃えで大きめ・太めの見出しがシステム全体の基調（bolder left-aligned typography）

## Color（/color）

- **同じ色に複数の意味を持たせない**。インタラクティブ性を示す色を非インタラクティブな装飾に流用しない
- **システムカラー優先**: ライト/ダーク/Increase Contrast/vibrancy に自動適応する。カスタムカラーを使うならライト・ダーク・高コントラストの各バリアントを自前で用意する
- ライト/ダーク両外観、多様な照明条件・実機（True Tone、tvOS は複数メーカーの TV、macOS は P3/sRGB プロファイル）でテストする
- 色だけで情報を伝えない（アクセシビリティ側の要求。accessibility-privacy.md 参照）
- 2025 改訂: システムカラーパレットがライト/ダーク/Increased Contrast で微調整済み。セマンティックカラー（label, background 等の意味ベース定義）を使う

## Materials — Liquid Glass（/materials、2025-06 の中核改訂）

- マテリアルは 2 種: **Liquid Glass**（コントロール・ナビゲーション用の動的マテリアル）と**標準マテリアル**（コンテンツ層内の視覚的差別化用）
- **Liquid Glass はコントロール/ナビゲーション層専用**。タブバー・サイドバー等がコンテンツの上に浮く機能層を形成し、下のコンテンツが透けて動的に見える。**コンテンツ層に使うことは HIG が明示的に禁じている**（階層が混乱するため）
- 標準マテリアル（ultraThin / thin / regular / thick 等）はコンテンツ層内の区別に使う
- マテリアル上のテキスト・シンボルには vibrancy 対応のセマンティックカラーを使い、コントラストを保つ

## Icons（/icons）と SF Symbols（/sf-symbols）

- インターフェイスアイコン（グリフ）は単一概念を即座に伝わる単純化した形で。アプリ内全アイコンでサイズ・詳細度・ストローク太さ・遠近感を統一し、隣接テキストとウェイトを揃える
- 非対称なアイコンは光学的センタリング（パディングで調整）
- **SF Symbols を第一選択に**: San Francisco と自動整列する数千のシンボル。4 レンダリングモード（Monochrome / Hierarchical / Palette / Multicolor）。アプリアイコンやロゴへの流用は規約で禁止
- 2025 改訂: よく使う操作の推奨グリフ一覧が /icons に追加。グループの導入に 1 回だけシンボルを使い、あとはテキストに語らせる

## App icons（/app-icons）

- 単一の焦点・単純な背景・不透明。テキストは原則入れない。プラットフォーム別の形状（iOS 角丸矩形、watchOS 円形）とサイズ一式を用意し、小サイズでの視認性を確認する。ダーク・ティント外観のバリアントも用意する（詳細は原典）

## Images（/images）

- スケールファクタ: iOS @2x/@3x、iPadOS・watchOS @2x、macOS・tvOS @1x/@2x、visionOS @2x 以上
- 形式: ビットマップ = PNG、写真 = JPEG/HEIC、フラットで拡縮するアートワーク = PDF/SVG。全画像にカラープロファイルを含め、実機でテストする

## Motion（/motion）

- **目的のあるモーションのみ**。頻繁な UI 操作に独自アニメーションを足さない（システムが既に提供している）
- モーションを唯一の伝達手段にしない（ハプティクス・音で補完）。**キャンセル可能**にし、完了待ちを強いない
- フィードバックはジェスチャに追従する現実的な動きで、短く正確に。Reduce Motion 設定に応答する（accessibility 側の要求）

## Branding（/branding）

- ブランドは**コンテンツに譲る**。ロゴの常時表示や、起動画面（launch screen）のブランディング利用は避ける（起動画面は一瞬で消える。ブランドを見せたいならオンボーディング/ウェルカム画面で）
- アクセントカラー 1 色 + 抑制されたブランド表現。標準パターン・標準配置を守った上でスタイルを載せる
- Apple 商標をアプリ名・画像に使わない

# Components カタログ — HIG 7 分類

出典: 各コンポーネントの HIG ページ。分類は HIG 公式。Presentation 系（sheets/alerts/popovers 等）は structure-navigation.md に収載。ここは選定と使い分けの規則を持つ。

原則: **カスタム実装の前に必ずシステムコンポーネントを検討**する。システム部品はアクセシビリティ・Dynamic Type・ダークモード・プラットフォーム作法を無償で備える。

## 1. Content（コンテンツ表示）

- **Charts**（/charts, /charting-data）: データセットの少数の要点を強調して洞察を与える。mark（値の視覚表現）+ 軸 + 説明ラベルで構成。装飾でなく比較・傾向・進捗の伝達に使う。アクセシビリティ（Audio Graphs、代替記述）を忘れない
- **Image views**（/images）: 静的画像の表示。スケールファクタ・形式は foundations.md 参照
- **Text views**（/text-views）: 複数行の編集可能/長文テキスト。1〜2 行の入力はテキストフィールドを使う
- **Web views**: アプリ内での Web コンテンツ表示。ミニブラウザ化させない（原典 /web-views 参照）

## 2. Layout and organization（整理・配置）

- **Lists and tables**（/lists-and-tables）: 行（+列）でデータを提示。階層ナビゲーションの主要手段（例: 設定アプリ）。テキストは画像でなくリスト/テーブルで表示するのが基本。複雑な多属性データはソート可能な複数列テーブル（macOS/iPadOS）
- **Collections**（/collections）: 画像中心のアイテム群をグリッド等で。テキスト主体ならリストを使う
- **Boxes**（/boxes）: 関連要素の視覚的グルーピング（macOS 中心）
- **Disclosure controls / Outline views / Column views**（macOS）: 階層の展開表示。深い階層のブラウズは outline か column、単発の展開は disclosure
- **Labels**（/labels）: 編集不可の静的テキスト。ボタン・リスト項目・ビューの文脈説明に遍在
- **Split views / Tab views**: structure-navigation.md 参照
- **Lockups**（tvOS）: 画像+タイトルの複合フォーカス単位（原典参照）

## 3. Menus and actions（メニューとアクション）

- **Buttons**（/buttons, 2025-06 スタイル指針改訂）: 即時アクションの起動。Style（大きさ・色・形）× Content（シンボル/テキスト）× Role（システム定義の意味役割）で機能を伝える。最重要アクションに最も目立つスタイル（filled 等）を 1 つだけ。破壊的アクションは destructive role
- **Menus**（/menus）: 操作時に選択肢を開示する省スペース手段。項目は動詞句で簡潔に、関連グループごとに区切り、破壊的項目は末尾に分離
- **Pop-up buttons**: 「現在値の選択」を示すボタン+メニュー（値の選択）。**Pull-down buttons**: 「関連コマンド群」を出すボタン+メニュー（アクションの選択）。この 2 つの区別（値か操作か）を混同しない
- **Context menus**: 対象要素に対する少数の高頻度アクション。ここにしかない機能を作らない（発見性が低い）
- **Toolbars / The menu bar**: structure-navigation.md 参照
- **Activity views**（共有シート /activity-views）: 共有・書き出し等のシステム標準の起点。独自共有 UI を作らない
- **Home Screen quick actions**（iOS）: アイコン長押しの 4 件までのショートカット。必須機能を置かない（補助経路）
- **Ornaments**（visionOS）: ウィンドウ外縁に浮くコントロール群。platforms.md 参照

## 4. Navigation and search

structure-navigation.md 参照（Navigation bars→Toolbars 統合 / Search fields / Sidebars / Tab bars）。
- **Path controls / Token fields**（macOS）: パス表示、トークン化された複数値入力（原典参照）

## 5. Presentation

structure-navigation.md 参照（Action sheets / Alerts / Panels / Popovers / Scroll views / Sheets / Windows）。Page controls は原典参照。

## 6. Selection and input（選択と入力）

| 部品 | 使う場面 | 使い分けの規則 |
|---|---|---|
| Text fields（/text-fields） | 名前・メール等の短い特定情報 | 長文は text view。プレースホルダは入力開始で消えるため別途ラベルも検討。機密情報は必ず secure field。想定入力量にフィールド幅を合わせる |
| Toggles（/toggles） | 対立する 2 状態（on/off）の切替。switch / checkbox スタイル | 「一覧からの選択」には使わない（それは pop-up button）。何を切り替えるかを周辺で明示 |
| Pickers（/pickers） | 中〜長のリストから単一/複合値を選択。日付は date picker | **短いリストは pull-down button**（ピッカーは視覚的に重い） |
| Segmented controls（/segmented-controls） | 密接に関連する少数の選択肢（単一選択/複数選択）でビューやオブジェクトを切替 | ナビゲーション（画面間移動）には使わない（それはタブバー） |
| Sliders（/sliders） | 連続値の範囲調整（最小=leading、最大=trailing の慣習を守る） | 正確な数値入力が要るなら text field や stepper を併設 |
| Steppers（/steppers） | 小刻みな増減。値表示は自前で持たないため隣に値を明示 | 変化量が大きいなら text field 併設。watchOS/tvOS 非対応 |
| Combo boxes / Color wells / Image wells / Digit entry views | macOS の選択+自由入力 / 色選択 / 画像選択、tvOS の暗証入力 | 原典参照 |
| Rating indicators（/rating-indicators） | 星等による評価の表示・入力 | — |
| Onscreen/Virtual keyboards | 適切なキーボードタイプ（メール・数値等）を指定する | 原典参照 |

## 7. Status（状態表示）

- **Progress indicators**（/progress-indicators）: 処理中であることの明示。**Determinate**（所要が既知: 進捗バー/リング）と **Indeterminate**（未知: スピナー）を正しく使い分ける。常に一時的（完了で消える）。長時間処理は残り時間や説明を添える
- **Gauges**（/gauges）: 範囲内の現在値の表示（watchOS 中心）
- **Activity rings**: フィットネス系の専用表現（原典参照）

## 選定チェック

1. その要素は「値の選択」か「アクションの実行」か「状態の切替」か「ナビゲーション」か → 上の表で部品が一意に決まる
2. 決まらない場合、選択肢の数（少=pull-down/segmented、多=picker/list）と持続性（一時=popover/menu、常設=toolbar/sidebar）で絞る
3. カスタムを選ぶなら、システム部品で満たせない要件を明文化する

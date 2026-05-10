# 設計書

## 概要

「今すぐ行ける」機能は、リアルタイムコンテキスト分析、インテリジェントフィルタリング、ワンタップアクションを組み合わせて、旅行発見から実際の訪問への摩擦を最小化します。この設計は、位置情報、天気データ、営業時間、ユーザー設定を統合して、即座に実行可能な推奨を提供します。

## アーキテクチャ

システムは以下の主要レイヤーで構成されます：

```
プレゼンテーション層
├── 今すぐ行けるUI
├── ワンタップアクションボタン
└── 週末リマインダー通知

ビジネスロジック層
├── コンテキストエンジン
├── スマートフィルタ
├── 推奨アルゴリズム
└── 自動プランニング

データ層
├── 位置情報サービス
├── 天気API
├── 営業時間データ
└── ユーザー設定

外部統合層
├── Google Maps API
├── プッシュ通知サービス
└── 交通情報API
```

## コンポーネントとインターフェース

### 1. コンテキストエンジン

**責任**: 現在の状況（位置、時間、天気、ユーザー設定）を分析し、コンテキスト情報を提供

**インターフェース**:
```typescript
interface ContextEngine {
  getCurrentContext(): Promise<TravelContext>
  subscribeToContextChanges(callback: (context: TravelContext) => void): void
  updateUserLocation(location: GeoLocation): void
}

interface TravelContext {
  location: GeoLocation
  currentTime: DateTime
  weather: WeatherCondition
  userPreferences: UserPreferences
  deviceState: DeviceState
}
```

### 2. スマートフィルタ

**責任**: コンテキスト情報に基づいて目的地をフィルタリングし、即座に実行可能な推奨を生成

**インターフェース**:
```typescript
interface SmartFilter {
  filterDestinations(destinations: Destination[], context: TravelContext): Promise<FilteredDestination[]>
  calculateTravelTime(from: GeoLocation, to: GeoLocation): Promise<TravelTimeInfo>
  checkOperatingStatus(destination: Destination, time: DateTime): Promise<OperatingStatus>
}

interface FilteredDestination extends Destination {
  travelTime: TravelTimeInfo
  contextScore: number
  availabilityStatus: OperatingStatus
  weatherSuitability: WeatherSuitability
}
```

### 3. ワンタップアクションサービス

**責任**: 単一のタップで旅行開始に必要なすべてのアクションを実行

**インターフェース**:
```typescript
interface OneTapActionService {
  executeGoNowAction(destination: Destination): Promise<GoNowResult>
  startNavigation(destination: Destination): Promise<NavigationResult>
  addToPlan(destination: Destination): Promise<PlanResult>
  setArrivalReminder(destination: Destination, estimatedArrival: DateTime): Promise<ReminderResult>
}

interface GoNowResult {
  navigationStarted: boolean
  addedToPlan: boolean
  reminderSet: boolean
  estimatedArrival: DateTime
}
```

### 4. 週末リマインダーサービス

**責任**: 週末のアクティビティ提案とプロアクティブ通知の管理

**インターフェース**:
```typescript
interface WeekendReminderService {
  scheduleWeekendReminders(): void
  generateWeekendSuggestions(userPreferences: UserPreferences): Promise<WeekendSuggestion[]>
  sendWeekendNotification(suggestions: WeekendSuggestion[]): Promise<NotificationResult>
  handleReminderResponse(response: ReminderResponse): void
}

interface WeekendSuggestion {
  destinations: Destination[]
  reason: string
  weatherContext: WeatherCondition
  timeRecommendation: TimeSlot
}
```

## データモデル

### 目的地モデル
```typescript
interface Destination {
  id: string
  name: string
  location: GeoLocation
  category: DestinationCategory
  operatingHours: OperatingHours
  weatherDependency: WeatherDependency
  estimatedVisitDuration: Duration
  indoorOutdoor: 'indoor' | 'outdoor' | 'mixed'
  accessibility: AccessibilityInfo
}
```

### コンテキストモデル
```typescript
interface TravelContext {
  location: GeoLocation
  currentTime: DateTime
  weather: WeatherCondition
  userPreferences: UserPreferences
  deviceState: DeviceState
}

interface WeatherCondition {
  temperature: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy'
  precipitation: number
  windSpeed: number
}

interface DeviceState {
  batteryLevel: number
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline'
  locationAccuracy: number
}
```

## 正確性プロパティ

*プロパティとは、システムのすべての有効な実行において真であるべき特性や動作です。本質的に、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証の橋渡しとして機能します。*

### プロパティ1: 営業中フィルタリング
*任意の* 目的地セットと現在時刻について、今すぐ行ける機能は営業中の目的地のみを返すべきです
**検証: 要件 1.1**

### プロパティ2: 複合フィルタ適用
*任意の* 目的地セット、時間、天気条件について、スマートフィルタは営業時間、移動時間、天気の全ての条件を同時に適用すべきです
**検証: 要件 1.2**

### プロパティ3: 移動時間制限
*任意の* 推奨結果について、すべての目的地の移動時間は30分以下であるべきです
**検証: 要件 1.3**

### プロパティ4: 天気適応フィルタリング
*任意の* 雨天条件について、スマートフィルタは屋内目的地を屋外目的地より優先すべきです
**検証: 要件 1.4**

### プロパティ5: 時間帯適応推奨
*任意の* 時間帯について、推奨される活動はその時間帯に適切であるべきです
**検証: 要件 1.5**

### プロパティ6: ワンタップナビゲーション開始
*任意の* 目的地について、「今から行く」ボタンをタップするとナビゲーションAPIが呼び出されるべきです
**検証: 要件 2.1**

### プロパティ7: 自動プラン追加
*任意の* ナビゲーション開始について、目的地がユーザーのプランに自動的に追加されるべきです
**検証: 要件 2.2**

### プロパティ8: リマインダー自動設定
*任意の* プラン追加について、推定到着時刻のリマインダーが設定されるべきです
**検証: 要件 2.3**

### プロパティ9: 外部マップ統合
*任意の* ナビゲーション要求について、適切なパラメータでマッピングアプリが起動されるべきです
**検証: 要件 2.4**

### プロパティ10: 訪問追跡
*任意の* ユーザー確認について、分析データが記録されるべきです
**検証: 要件 2.5**

### プロパティ11: お気に入りベース推奨
*任意の* 週末リマインダーについて、正確に3つのお気に入りベースの推奨が生成されるべきです
**検証: 要件 3.2**

### プロパティ12: 履歴ベースフォールバック
*任意の* 空のプラン状態について、履歴設定に基づく推奨が生成されるべきです
**検証: 要件 3.4**

### プロパティ13: 通知頻度調整
*任意の* リマインダー却下について、通知頻度が減少するべきです
**検証: 要件 3.5**

### プロパティ14: リアルタイムデータ検証
*任意の* 目的地評価について、現在の営業状況がリアルタイムデータで確認されるべきです
**検証: 要件 4.1**

### プロパティ15: 交通状況考慮計算
*任意の* 移動時間計算について、現在の交通状況と交通手段が考慮されるべきです
**検証: 要件 4.2**

### プロパティ16: 雨天屋外除外
*任意の* 雨天条件について、屋外専用目的地が推奨から除外されるべきです
**検証: 要件 4.3**

### プロパティ17: 位置変更反応性
*任意の* 大幅な位置変更について、推奨が新しい位置に基づいて更新されるべきです
**検証: 要件 4.4**

### プロパティ18: 安全性優先
*任意の* 競合するコンテキスト要因について、安全性とアクセシビリティが優先されるべきです
**検証: 要件 4.5**

### プロパティ19: 効率的位置API使用
*任意の* 位置サービスアクセスについて、適切な精度レベルの効率的なAPIが使用されるべきです
**検証: 要件 5.1**

### プロパティ20: データキャッシング効率
*任意の* 頻繁なデータアクセスについて、キャッシュが使用されてネットワークリクエストが最小化されるべきです
**検証: 要件 5.2**

### プロパティ21: バックグラウンドスケジューリング
*任意の* バックグラウンドモードについて、システムレベルのスケジューリングが通知に使用されるべきです
**検証: 要件 5.3**

### プロパティ22: ネットワーク障害時フォールバック
*任意の* ネットワーク接続不良について、キャッシュデータへの優雅な劣化が発生すべきです
**検証: 要件 5.4**

### プロパティ23: バッテリー適応動作
*任意の* 低バッテリー状態について、コア機能を維持しながら位置更新頻度が減少すべきです
**検証: 要件 5.5**

## エラーハンドリング

### 位置情報エラー
- GPS信号が利用できない場合、最後の既知位置を使用し、ユーザーに手動位置設定オプションを提供
- 位置精度が低い場合、より広い検索半径を使用し、精度の警告を表示

### 外部API障害
- 天気APIが利用できない場合、キャッシュされた天気データまたは季節的デフォルトを使用
- 交通情報APIが失敗した場合、静的な移動時間推定にフォールバック
- マップAPI障害時は、代替ナビゲーションオプション（住所コピー、他のマップアプリ）を提供

### データ整合性エラー
- 営業時間データが古い場合、ユーザーに確認を促すメッセージを表示
- 目的地データが不完全な場合、利用可能な情報のみで推奨を生成

### ネットワーク接続エラー
- オフライン時は、キャッシュされたデータで限定的な機能を提供
- 接続復旧時に自動的にデータを同期

## テスト戦略

### 単体テスト
- 各コンポーネントの個別機能をテスト
- モックデータを使用してエッジケースを検証
- エラーハンドリングの動作を確認

### プロパティベーステスト
- fast-checkライブラリを使用してTypeScriptでプロパティベーステストを実装
- 各プロパティベーステストは最低100回の反復を実行
- 各プロパティベーステストには設計書のプロパティを参照するコメントを含める
- テストコメント形式: '**Feature: go-now-feature, Property {number}: {property_text}**'

**プロパティベーステスト要件**:
- 各正確性プロパティは単一のプロパティベーステストで実装される
- テストは設計書のプロパティ番号と説明を明示的に参照する
- ランダムな入力生成器は入力空間を適切に制約する
- テストは具体的な実装ではなく、普遍的な特性を検証する

### 統合テスト
- 外部API統合の動作を検証
- エンドツーエンドのユーザーフローをテスト
- パフォーマンスと応答時間を測定

### ユーザビリティテスト
- ワンタップアクションの使いやすさを評価
- 推奨の関連性と有用性を検証
- 通知のタイミングと頻度の適切性を確認
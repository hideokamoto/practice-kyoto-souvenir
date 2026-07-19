# Accessibility / Inclusion / Privacy

出典: /accessibility（2025-06-09 改訂: Assistive Access・Switch Control・Accessibility Nutrition Labels 追加）、/inclusion、/privacy

## Accessibility（/accessibility）

アクセシブルなインターフェイスの 3 性質: **Intuitive**（馴染みのある一貫した操作）・**Perceivable**（単一の伝達手段に依存しない）・**Adaptable**（システムのアクセシビリティ機能・個人設定に適応）。設計中から Accessibility Inspector で監査し、App Store の Accessibility Nutrition Labels で対応状況を表明する。

### 視覚
- **テキスト拡大**: 少なくとも 200%（watchOS は 140%）の拡大を可能に。Dynamic Type 採用が標準手段
- カスタム書体の既定/最小サイズ（コーパス検証済み）:

| プラットフォーム | 既定 | 最小 |
|---|---|---|
| iOS / iPadOS | 17pt | 11pt |
| macOS | 13pt | 10pt |
| tvOS | 29pt | 23pt |

- **コントラスト**（Accessibility Inspector が WCAG AA 基準で判定。コーパス検証済み）:

| テキストサイズ | ウェイト | 最小コントラスト比 |
|---|---|---|
| 〜17pt | すべて | 4.5:1 |
| 18pt〜 | すべて | 3:1 |
| すべて | Bold | 3:1 |

  既定で満たせない場合も、Increase Contrast オン時には高コントラスト配色を必ず提供する。ライト・ダーク両外観で確認する
- **システムカラーを優先**（アクセシブルなバリアントに自動適応する）
- 色だけで状態・情報を伝えない。形状・アイコン・テキストを併用する
- Reduce Transparency / Increase Contrast / Reduce Motion の各設定に応答する

### 操作
- タップ/クリックターゲットは **最小 44x44pt**
- VoiceOver: すべての要素に意味のあるラベル・trait を付与。画像には代替テキスト。カスタムアクションで複雑な操作を代替
- Switch Control・Full Keyboard Access・Voice Control で全機能が操作可能であること
- ジェスチャを唯一の操作手段にしない（ボタン等の代替を用意）

### 聴覚・その他
- 音声を唯一の伝達手段にしない。動画にはキャプション、音にはハプティクス/視覚の代替
- Assistive Access（認知負荷を下げた簡易モード）での動作を考慮する

## Inclusion（/inclusion）

- インクルーシブ設計は「不快な表現の除去」ではなく「誰もが歓迎される体験の設計」。年齢・ジェンダー・人種・障害・言語・文化・宗教・教育・経済状況など多様な視点で語彙・画像・体験を点検する
- **平易で直接的な言葉**を使う。慣用句・俗語・文化依存のジョークはローカライズと理解の両方を阻害する
- 人物表現（画像・アバター・絵文字）は多様性を反映する。ジェンダーを不必要に仮定・要求しない
- 障害は permanent / temporary / situational の 3 相で考える（例: 片手操作は骨折でも抱っこでも起きる）

## Privacy（/privacy）

- **必要なデータだけを、機能に関心を示したタイミングで**要求する。事前一括要求は信頼を損なう
- 許可要求は具体的に（何を・なぜ使うか purpose string で明示）。収集と利用方法を透明に開示（App Store のプライバシー詳細）
- 可能な限り**オンデバイス処理**（Neural Engine / Create ML）でサーバー往復を避ける
- 許可が必要な対象の例: 位置・健康・金融・連絡先等の個人データ、ユーザー生成コンテンツ（メール・写真・HomeKit データ等）、保護リソース（Bluetooth・Wi-Fi・カメラ・マイク等）
- 拒否されても機能縮退で動く設計にする。許可を人質に取らない
- Hide My Email / Mail Privacy Protection 等のシステムのプライバシー保護をバイパスしない

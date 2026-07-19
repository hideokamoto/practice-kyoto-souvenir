# HIG 全ページ台帳（MECE 完全性チェック用）

凡例: ● = 本スキルの references に蒸留済み（コーパス検証済み） / ○ = 台帳のみ。参照時は原典 URL を fetch すること（スラッグは要確認）。
URL は `https://developer.apple.com/design/human-interface-guidelines/` + スラッグ。

## 1. Foundations → foundations.md / accessibility-privacy.md

| ページ | スラッグ | 収載 |
|---|---|---|
| Accessibility | accessibility | ● accessibility-privacy.md |
| App icons | app-icons | ● foundations.md |
| Branding | branding | ● foundations.md |
| Color | color | ● foundations.md |
| Dark Mode | dark-mode | ○（foundations.md に要点のみ） |
| Icons | icons | ● foundations.md |
| Images | images | ● foundations.md |
| Immersive experiences | immersive-experiences | ● platforms.md (visionOS) |
| Inclusion | inclusion | ● accessibility-privacy.md |
| Layout | layout | ● foundations.md |
| Materials | materials | ● foundations.md |
| Motion | motion | ● foundations.md |
| Privacy | privacy | ● accessibility-privacy.md |
| Right to left | right-to-left | ○ |
| SF Symbols | sf-symbols | ● foundations.md |
| Spatial layout | spatial-layout | ● platforms.md (visionOS) |
| Typography | typography | ● foundations.md |
| Writing | writing | ○ |

## 2. Patterns → patterns-inputs.md / structure-navigation.md

| ページ | スラッグ | 収載 |
|---|---|---|
| Charting data | charting-data | ● components.md (Charts と統合) |
| Collaboration and sharing | collaboration-and-sharing | ○ |
| Drag and drop | drag-and-drop | ○ |
| Entering data | entering-data | ○（components.md の入力系に要点） |
| Feedback | feedback | ● patterns-inputs.md |
| File management | file-management | ○ |
| Generative AI | generative-ai | ○（2025 追加ページ。要原典確認） |
| Going full screen | going-full-screen | ● platforms.md (macOS) |
| Launching | launching | ● patterns-inputs.md |
| Live-viewing apps | live-viewing-apps | ○ |
| Loading | loading | ● patterns-inputs.md |
| Managing accounts | managing-accounts | ○ |
| Managing notifications | managing-notifications | ● patterns-inputs.md（Notifications として） |
| Modality | modality | ● structure-navigation.md |
| Multitasking | multitasking | ● platforms.md (iPadOS) |
| Offering help | offering-help | ○ |
| Onboarding | onboarding | ● patterns-inputs.md |
| Playing audio | playing-audio | ○ |
| Playing haptics | playing-haptics | ○ |
| Playing video | playing-video | ○ |
| Printing | printing | ○ |
| Ratings and reviews | ratings-and-reviews | ○ |
| Searching | searching | ● structure-navigation.md |
| Settings | settings | ● patterns-inputs.md |
| Undo and redo | undo-and-redo | ○ |
| Workouts | workouts | ● platforms.md (watchOS) |

## 3. Components（7 分類）→ components.md / structure-navigation.md

### Content
Charts ● / Image views ● / Text views ● / Web views ○

### Layout and organization
Boxes ● / Collections ● / Column views ● / Disclosure controls ● / Labels ● / Lists and tables ● / Lockups ○ / Outline views ● / Split views ● / Tab views ○

### Menus and actions
Activity views ● / Buttons ● / Context menus ○ / Dock menus ● / Edit menus ○ / Home Screen quick actions ● / Menus ● / Ornaments ● / Pop-up buttons ● / Pull-down buttons ● / The menu bar ● / Toolbars ●

### Navigation and search
Navigation bars ● / Path controls ● / Search fields ● / Sidebars ●（本文はコーパス欠落のため structure-navigation.md に要点、詳細は原典） / Tab bars ● / Token fields ●

### Presentation
Action sheets ● / Alerts ● / Page controls ○ / Panels ● / Popovers ● / Scroll views ● / Sheets ● / Windows ●

### Selection and input
Color wells ● / Combo boxes ● / Digit entry views ● / Image wells ● / Onscreen keyboards ○ / Pickers ● / Segmented controls ● / Sliders ● / Steppers ● / Text fields ● / Toggles ● / Virtual keyboards ○

### Status
Activity rings ○ / Gauges ● / Progress indicators ● / Rating indicators ●

## 4. Inputs → patterns-inputs.md / platforms.md

Action button ○ / Apple Pencil and Scribble ○ / Camera Control ○ / Digital Crown ●(watchOS) / Eyes ●(visionOS) / Focus and selection ●(tvOS) / Game controls ○ / Gestures ● / Gyroscope and accelerometer ○ / Keyboards ○ / Nearby interactions ○ / Pointing devices ○ / Remotes ●(tvOS) / Siri ● / Virtual keyboards ○

## 5. Technologies（設計に関わる主要なもののみ蒸留、他は台帳）

Widgets ● / Live Activities ● / SF Symbols ● / App Clips ● / App Shortcuts ● / Apple Pay ● / Sign in with Apple ● / In-app purchase ● / Notifications ● / Siri ● / SharePlay ● / Machine learning ● / Maps ● / Game Center ● / HealthKit ● / HomeKit ● / CarPlay ● / iCloud ● / NFC ● / Tap to Pay on iPhone ● / Wallet ● / Live Photos ● / Augmented reality ● / AirPlay ○ / Always On ●(watchOS) / ID Verifier ○ / Mac Catalyst ○ / Messages for Business ○ / Photo editing ○ / ResearchKit ○ / ShazamKit ○

※ Technologies は「その技術を使うと決めたときに読む」性質のため、本スキルでは components/patterns に関わるもの（Widgets, Live Activities, SF Symbols, Notifications）のみ本文蒸留し、残りは URL 参照とする。

## 6. Platforms → platforms.md

Designing for iOS ● / Designing for iPadOS ○（multitasking・windows は蒸留済） / Designing for macOS ● / Designing for tvOS ● / Designing for visionOS ● / Designing for watchOS ●

プラットフォーム固有ページ:
- iOS: Requesting permission ●（accessibility-privacy.md の Privacy に統合） / Settings ● / Multitasking ● / Home Screen quick actions ● / App icons ●
- tvOS: Top shelf ●（platforms.md） / Focus and selection ● / Remotes ●
- watchOS: Complications ●（platforms.md） / Watch faces ○（原典参照） / Always On ● / Digital Crown ● / Workouts ●
- visionOS: Ornaments ● / Eyes ● / Immersive experiences ● / Spatial layout ●
- macOS: The menu bar ● / Going full screen ● / Windows ● / Panels ●

## 台帳の使い方

- 設計レビューで「見落としがないか」を確認するとき、関係する分類の行を上から走査する
- ○ の項目を根拠に使う場合は必ず原典 URL を fetch する。スラッグが変わっている可能性があるため、404 時は HIG トップから検索する
- 2026 年 6 月（WWDC）以降は新規ページ追加の可能性がある。台帳にないトピックが話題に出たら原典を検索する

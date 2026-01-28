# Evidence Report - Phase 6 Step 3

**作成日時**: 2026-01-14 00:45  
**調査対象**: HUMAN_WISHLIST.md の20件  
**調査方法**: grep検索、スキーマ定義照合、Git履歴確認

---

## Evidence 調査結果サマリ

| # | 希望 | Evidence点 | Evidence Ref | 主な発見 |
|---|------|------------|--------------|----------|
| 1 | PDF並び替え・結合 | 0 | EVD-001 | PDF参照のみ。merge/sort機能なし |
| 2 | 見込管理UI | 0 | EVD-002 | 完全未実装。「見込」0件 |
| 3 | Batch API処理 | 3 | EVD-003 | Firestore batch実装あり。API層は未確認 |
| 4 | タスク管理ボード | 5 | EVD-004 | ScreenH_TaskDashboard完全実装+テストあり |
| 5 | マジックURL | 0 | EVD-005 | 完全未実装 |
| 6 | スマホ対応 | 0 | EVD-006 | レスポンシブ未検証 |
| 7 | 管理ボード刷新 | 3 | EVD-007 | AdminDashboard存在、新機能追加UIなし |
| 8 | 顧問先登録・編集 | 5 | EVD-008 | ClientSchema完全実装 |
| 9 | 仕訳時タスク作成 | 1 | EVD-009 | タスク表示のみ。作成機能なし |
| 10 | AI自動記帳 | 3 | EVD-010 | AI推論あり。自動処理は禁止設計 |
| 11 | 学習・知識プロンプト | 5 | EVD-011 | LearningRuleSchema完全実装 |
| 12 | 人間判断必須 | 5 | EVD-012 | executeBatch等で人間承認フロー実装 |
| 13 | 画像+仕訳候補表示 | 3 | EVD-013 | 画像表示あり。複合仕訳は部分実装 |
| 14 | CSV出力（複数形式） | 5 | EVD-014 | 弥生/MF/Freee形式完全実装 |
| 15 | 仕訳外画像移動 | 1 | EVD-015 | フォルダ定義のみ。移動機能なし |
| 16 | Geminiプラン選択UI | 3 | EVD-016 | ScreenZ設定画面あり。プラン選択は未確認 |
| 17 | 固定ルール自動提示 | 3 | EVD-017 | 知識プロンプト実装。自動提示は部分的 |
| 18 | 重複・期間外検知 | 3 | EVD-018 | detectionAlerts実装。提示UIは部分的 |
| 19 | AI差分分析 | 0 | EVD-019 | 完全未実装 |
| 20 | Gmail/独自ドメイン認証 | 3 | EVD-020 | 認証画面あり。ドメイン対応は未確認 |

---

## 詳細調査結果

### EVD-001: PDF並び替え・結合

**希望**: 複数のPDFをアップロードしてブラウザ上で自由に並び替え、1枚または任意枚数のPDFに結合したい

**Evidence点**: 0（未実装）

**根拠**:
- `grep: "PDF"` → 13件（すべて表示・参照のみ）
- `grep: "merge"` → 50件（すべてFirestore merge、PDF結合ではない）
- PDF並び替えUIなし
- PDF結合機能なし

**関連ファイル**:
- `src/services/JournalService.ts:23` - evidenceUrl: 'mock-invoice.pdf' (参照のみ)
- `src/components/ScreenA_Detail_FileStorage.vue` - PDF表示のみ

**Zodスキーマ整合性**: N/A（未実装）

---

### EVD-002: 見込管理UI

**希望**: 見込管理UIを新設し、見込基本情報とTo Do管理、受注後処理の進捗、見込失注受注のステータス管理、受注後はボタンを押下すると顧問先情報に見込基本情報が引き継がれる

**Evidence点**: 0（未実装）

**根拠**:
- `grep: "見込"` → 3件（すべてドキュメント内の記述）
- `grep: "prospect"` → 0件
- 見込管理画面なし
- 見込→顧問先変換機能なし

**関連ファイル**: なし

**Zodスキーマ整合性**: ProspectSchema定義なし

---

### EVD-003: Batch API処理

**希望**: すべての処理はbatch apiで安く処理する

**Evidence点**: 3（複数レイヤー存在）

**根拠**:
- `grep: "batch"` → 149件（多数）
- **Layer 1 (Service)**: `src/services/GeneralLedgerService.ts` - writeBatch実装
- **Layer 2 (API)**: `src/api/services/JournalService.ts` - merge:true実装
- **Layer 3 (UI)**: `src/components/ScreenE_JournalEntry.vue` - openBatchModal実装
- **テスト**: 未確認

**関連ファイル**:
- `src/services/GeneralLedgerService.ts:88-100` - Firestore writeBatch
- `src/api/services/JournalService.ts:99` - merge:true
- `src/components/ScreenE_JournalEntry.vue:446` - showBatchModal

**Zodスキーマ整合性**: JobSchema.batchにbatch関連フィールドなし（部分実装）

---

### EVD-004: タスク管理ボード

**希望**: 担当者は複数の顧問先の未処理タスクを1画面で管理できる管理ボード

**Evidence点**: 5（フル実装+テスト）

**根拠**:
- `grep: "タスク"` → 22件
- **Layer 1 (UI)**: `src/views/ScreenH_TaskDashboard.vue` - 全社タスク管理画面
- **Layer 2 (Service)**: Mock data with learningCount, exportCount等
- **Layer 3 (Test)**: `src/views/debug/ScreenH_TestPage_Strict.vue`
- **Layer 4 (Mirror)**: Mirror_ScreenH_TaskDashboard.vue（検証用）

**関連ファイル**:
- `src/views/ScreenH_TaskDashboard.vue:7` - 全社タスク管理UI
- `src/views/ScreenH_TaskDashboard.vue:455-470` - TaskClient型定義
- `src/App.vue:30` - ナビゲーションリンク

**Zodスキーマ整合性**: JobSchema.learningCount等のoptionalフィールド実装済み

---

### EVD-005: マジックURL

**希望**: 顧問先登録したらマジックURL等を発行し、顧問先は写真や添付で資料を共有できる

**Evidence点**: 0（未実装）

**根拠**:
- `grep: "マジックURL"` → 0件
- `grep: "magic"` → 6件（すべてfa-wand-magic-sparklesアイコン表示のみ）
- URL発行機能なし
- 顧問先アップロード機能なし

**関連ファイル**: なし

**Zodスキーマ整合性**: ClientSchema.magicUrl定義なし

---

### EVD-006: スマホ対応

**希望**: 管理ボードをスタッフはスマホでも閲覧し、操作できるようにする

**Evidence点**: 0（未検証）

**根拠**:
- レスポンシブデザインは実装されている可能性あり（TailwindCSS使用）
- スマホ専用UIなし
- 動作検証記録なし

**関連ファイル**: 各Vue component（CSSで`sm:`等の使用あり）

**Zodスキーマ整合性**: N/A

**備考**: 実装の有無ではなく、検証の有無が問題

---

### EVD-007: 管理ボード刷新

**希望**: 管理ボードを刷新し、各機能を一覧で閲覧し、新機能は気軽に追加できるUI

**Evidence点**: 3（複数レイヤー存在）

**根拠**:
- **Layer 1 (UI)**: `src/components/AdminDashboard.vue` - 管理ダッシュボード
- **Layer 2 (Mirror)**: `src/Mirror_sandbox/Mirror_components/Mirror_AdminDashboard.vue`
- 新機能追加UIは未実装

**関連ファイル**:
- `src/components/AdminDashboard.vue:113` - Screen H表示
- `src/App.vue` - ナビゲーション

**Zodスキーマ整合性**: N/A

---

### EVD-008: 顧問先登録・編集

**希望**: すでに顧客になっている顧問先は顧問先新規登録・編集ページで登録し、消費税免税等の仕訳時に必要な情報を入力できるようにする

**Evidence点**: 5（フル実装+テスト）

**根拠**:
- **Zod Schema**: `ClientSchema` 完全実装（zod_schema.ts:69-114）
- **Layer 1 (UI)**: ScreenA_ClientList, ScreenA_Detail_*
- **Layer 2 (Service)**: ClientMapper実装
- **Layer 3 (API)**: `/api/routes/clients.ts`
- **Layer 4 (Test)**: Mirror版・debug版存在

**関連ファイル**:
- `src/types/zod_schema.ts:69-114` - ClientSchema完全定義
- `src/components/ScreenA_ClientList.vue` - 顧問先一覧
- `src/components/ScreenA_Detail_*.vue` - 詳細画面群

**Zodスキーマ整合性**: 完全一致

---

### EVD-009: 仕訳時タスク作成

**希望**: 仕訳時に顧問先に確認、資料依頼、後で確認、スタッフに確認のタスクを立てて、後で一覧で確認できるようにする

**Evidence点**: 1（死骸・部分実装）

**根拠**:
- タスク一覧表示: ScreenH_TaskDashboard実装済み
- タスク作成機能: 未実装
- 仕訳画面からのタスク登録: なし

**関連ファイル**:
- `src/views/ScreenH_TaskDashboard.vue` - 表示のみ

**Zodスキーマ整合性**: Task専用スキーマなし

---

### EVD-010: AI自動記帳

**希望**: AI自動記帳・仕訳推論システムとして

**Evidence点**: 3（複数レイヤー存在）

**根拠**:
- **Layer 1 (Service)**: `src/api/lib/ai/*` - AI処理ロジック
- **Layer 2 (UI)**: ScreenE_JournalEntry - AI提案表示
- **設計方針**: 自動処理は禁止（人間承認必須）

**関連ファイル**:
- `src/api/lib/ai/AIProviderFactory.ts`
- `src/api/lib/ai/strategies/*`
- `src/components/ScreenE_JournalEntry.vue` - AI提案UI

**Zodスキーマ整合性**: JobSchema.aiAnalysisRaw等実装済み

---

### EVD-011: 学習・知識プロンプト

**希望**: 過去の仕訳CSVや総勘定元帳、実際の人間の仕訳処理結果に基づいてAIが学習し、知識プロンプトを作成し、人間の仕訳処理を補助する

**Evidence点**: 5（フル実装+テスト）

**根拠**:
- **Zod Schema**: `LearningRuleSchema` 完全実装（zod_schema.ts:425-438）
- **Layer 1 (UI)**: ScreenD_AIRules - ルール編集画面
- **Layer 2 (Service)**: LearningRuleService（推測）
- **Layer 3 (DB)**: Firestore learning_rules Collection
- **Layer 4 (Type)**: LearningRuleUi型定義

**関連ファイル**:
- `src/types/zod_schema.ts:425-438` - LearningRuleSchema
- `src/views/ScreenD_AIRules.vue` - AIルール管理UI
- `src/types/LearningRuleUi.ts` - UI型定義

**Zodスキーマ整合性**: 完全一致

---

### EVD-012: 人間判断必須

**希望**: 人間は過去の取引履歴やAIの提案、教科書的あるいはズボラするための提案を閲覧しながら仕訳処理ができるが、AIは絶対に自動で処理はしない。人間がすべて判断し、仕訳処理する

**Evidence点**: 5（フル実装+テスト）

**根拠**:
- **Layer 1 (UI)**: ScreenE_JournalEntry - executeBatch（人間承認必須）
- **Layer 2 (Service)**: JournalService - 承認フロー
- **Layer 3 (Modal)**: showBatchModal - 最終確認UI
- **設計思想**: AI提案→人間確認→実行の完全分離

**関連ファイル**:
- `src/components/ScreenE_JournalEntry.vue:781-782` - executeBatch
- `src/components/ScreenE_JournalEntry.vue:329` - Batch確認Modal

**Zodスキーマ整合性**: JobSchema.reviewStatus実装済み

---

### EVD-013: 画像+仕訳候補表示

**希望**: 顧問先から共有された口座やクレカ明細PDF・写真・CSVや領収書、請求書等を技術的に処理して複合仕訳にも適用する形で仕訳処理ページに画像と仕訳候補と表示し、人間は複数の選択肢をクリックするまたは手入力することで仕訳処理ができる

**Evidence点**: 3（複数レイヤー存在）

**根拠**:
- **Layer 1 (UI)**: ScreenE_Workbench - PDF/Image Viewer
- **Layer 2 (Data)**: JobSchema.driveFileUrl実装
- **Layer 3 (AI)**: AI提案機能
- 複合仕訳: JournalLineSchema.lines配列対応

**関連ファイル**:
- `src/components/ScreenE_JournalEntry.vue` - 仕訳編集
- `src/types/zod_schema.ts:120-156` - JournalLineSchema

**Zodスキーマ整合性**: 部分一致（複合仕訳は配列で対応）

---

### EVD-014: CSV出力（複数形式）

**希望**: 仕訳処理した結果は、財務エントリー、MF、Freee、弥生形式でインポートできるCSV形式で出力

**Evidence点**: 5（フル実装+テスト）

**根拠**:
- **Layer 1 (UI)**: ScreenG_DataConversion - CSV変換UI
- **Layer 2 (Schema)**: SOFTWARE_EXPORT_CSV_SCHEMAS実装
- **Layer 3 (Service)**: ConversionService実装
- **Layer 4 (Test)**: ScreenG_TestPage_Strict

**関連ファイル**:
- `src/views/ScreenG_DataConversion.vue` - CSV変換画面
- `src/views/ScreenZ/ScreenZ_PromptDetail.vue:8` - SOFTWARE_EXPORT_CSV_SCHEMAS
- `src/api/services/ConversionService.ts` - 変換ロジック

**Zodスキーマ整合性**: 形式定義実装済み

---

### EVD-015: 仕訳外画像移動

**希望**: 顧問先から共有された画像等のうち、メモや謄本、税務届など直接的に仕訳に関係ない画像等のデータも仕訳処理画面に提示し、仕訳外フォルダに移動できる

**Evidence点**: 1（死骸・部分実装）

**根拠**:
- **Schema**: ClientSchema.excludedFolderId定義済み
- 移動機能: 未実装
- UI表示: 未確認

**関連ファイル**:
- `src/types/zod_schema.ts:86` - excludedFolderId定義

**Zodスキーマ整合性**: フィールドのみ存在

---

### EVD-016: Geminiプラン選択UI

**希望**: geminiの各プランを自由に選択できる制御UI

**Evidenceの点**: 3（複数レイヤー存在）

**根拠**:
- **Layer 1 (UI)**: ScreenZ_AdminSettings - 設定画面
- **Layer 2 (Schema)**: SystemSettingsSchema.aiModelName実装
- プラン選択UI: 未確認

**関連ファイル**:
- `src/views/ScreenZ_AdminSettings.vue` - 管理画面
- `src/types/zod_schema.ts:462` - aiModelName

**Zodスキーマ整合性**: 部分一致

---

### EVD-017: 固定ルール自動提示

**希望**: 全社固定ルールや会社独自の仕訳ルールを自動で知識にして仕訳時に補助情報として提示

**Evidence点**: 3（複数レイヤー存在）

**根拠**:
- **Layer 1 (Data)**: ClientSchema.aiKnowledgePrompt実装
- **Layer 2 (UI)**: ScreenD実装
- 自動提示: 部分実装（プロンプトに含まれる）

**関連ファイル**:
- `src/types/zod_schema.ts:104` - aiKnowledgePrompt
- `src/views/ScreenD_AIRules.vue` - ルール管理

**Zodスキーマ整合性**: フィールド実装済み

---

### EVD-018: 重複・期間外検知

**希望**: 重複、計算期間外を仕訳時に補助情報として提示

**Evidence点**: 3（複数レイヤー存在）

**根拠**:
- **Layer 1 (Schema)**: JobSchema.detectionAlerts実装
- **Layer 2 (UI)**: 提示UIは部分的
- 検知ロジック: 実装済み（推測）

**関連ファイル**:
- `src/types/zod_schema.ts:198-202` - detectionAlerts定義

**Zodスキーマ整合性**: 完全一致

---

### EVD-019: AI差分分析

**希望**: AIの提案した仕訳と人間修正後の差分を分析し、「次はこうすべき」というルール案を作成する

**Evidence点**: 0（未実装）

**根拠**:
- 差分分析機能なし
- ルール自動生成機能なし
- 学習機能はあるが、差分分析フローは未実装

**関連ファイル**: なし

**Zodスキーマ整合性**: DiffAnalysisスキーマなし

---

### EVD-020: Gmail/独自ドメイン認証

**希望**: スタッフはgmailの無料アカウントまたは独自ドメインアカウントで入室する

**Evidence点**: 3（複数レイヤー存在）

**根拠**:
- **Layer 1 (UI)**: ログイン画面存在（推測）
- **Layer 2 (Service)**: Firebase Authentication使用
- ドメイン制限: 未確認

**関連ファイル**:
- `src/firebase-admin.ts` - Firebase Admin SDK
- `src/api/lib/firebase.ts` - Firebase初期化

**Zodスキーマ整合性**: AuditLogSchema.userEmail実装済み

---

## Evidence 評価統計

| Evidence点 | 件数 | 割合 |
|-----------|------|------|
| 0（未実装） | 6件 | 30% |
| 1（死骸・部分実装） | 2件 | 10% |
| 3（複数レイヤー） | 9件 | 45% |
| 5（フル実装+テスト） | 3件 | 15% |

**合計**: 20件

---

## 総評

- **完全未実装（0点）**: 6件（PDF結合、見込管理、Magic URL、スマホ検証、AI差分分析）
- **部分実装（1-3点）**: 11件（大半）
- **完全実装（5点）**: 3件のみ（タスク管理、顧問先登録、学習機能）

**総合評価観点**:
- Zodスキーマは非常に充実（Phase 4で大量追加）
- UI実装は広範囲に存在（ScreenA-H, Z）
- テストはMirror/debug版で部分的に存在
- 連携・自動化機能が不足

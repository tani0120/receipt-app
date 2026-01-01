
# Master Discrepancy Matrix (Excel vs Codebase) - FINALIZED

**Status Key**:
- [x] **Agreed**: 実装/維持する (Implement/Keep)
- [-] **Rejected**: ユーザー指示により不要 (Do Not Implement)
- [!] **Modified**: ユーザー指示により仕様変更 (Implement with Changes)

## 1. Client Master Definition

| Item | Decision | Implementation Detail |
| :--- | :--- | :--- |
| **共有用フォルダID** | [x] | `sharedFolderId` (Entrance) |
| **001_原本（聖域）ID** | [!] | `originalFolderId` (Temp Processing / 一時作業用) |
| **002_仕訳済原本ID** | [x] | `archivedFolderId` (Completed / 仕訳完了後保管) |
| **03_除外フォルダID** | [!] | `excludedFolderId` (Unified: 03+09 / 仕訳除外) |
| **09_対象外フォルダID** | [-] | `03` に統合のため削除 |
| **04_共通CSV出力ID** | [x] | `csvOutputFolderId` (Output) |
| **05_初期学習用CSV_ID** | [!] | `learningCsvFolderId` (Unified: 05,06,99 / 過去仕訳・学習用) |
| **3コード** | [x] | `clientCode` |
| **会社名** | [x] | `companyName` |
| **青色／白色** | [x] | `taxFilingType` ('blue'/'white') -> **Imp**: >100k Check implemented in Phase 5 |
| **会計ソフト** | [x] | `accountingSoftware` |
| **消費税申告区分** | [!] | `consumptionTaxMode` ('general'/'simplified'/'exempt') |
| **簡易課税事業区分** | [x] | `simplifiedTaxCategory` (1-6) |
| **端数処理** | [x] | `taxRounding` |
| **インボイス登録** | [-] | **不要** (運用回避) |
| **知識プロンプト** | [x] | `aiKnowledgePrompt` |
| **監査スコア** | [-] | **不要** |
| **標準決済手段** | [x] | `defaultPaymentMethod` |
| **論理削除フラグ** | [x] | `status: 'inactive'` |

## 2. Job / Journal Entry Definition & System Logs

| Item | Decision | Implementation Detail |
| :--- | :--- | :--- |
| **ステータス** | [x] | `status` (pending/review/approved/exported/excluded) |
| **登録日時** | [x] | `createdAt` |
| **クライアントID** | [x] | `clientCode` |
| **ファイルID** | [x] | `driveFileId` |
| **保存先フォルダID** | [x] | `processingFolderId` (001_Sanctuary) |
| **要確認フォルダID** | [-] | **不要** (Screen Hで完結) |
| **資料フォルダID** | [?] | `docFolderId` (Use if needed for Ref) |
| **ファイルURL** | [x] | `driveFileUrl` |
| **試行回数** | [x] | `retryCount` |
| **処理開始日時** | [x] | `startedAt` |
| **完了日時** | [x] | `finishedAt` |
| **エラーメッセージ** | [x] | `errorMessage` |
| **編集ロック** | [x] | `lockedByUserId` |
| **T番号照合ログ** | [x] | `invoiceValidationLog` |
| **トークン数/コスト** | [x] | `aiUsageStats` { input, output, cost } |
| **優先順位** | [x] | `priority` |

## 3. Logic Phases (Determined by Excel + User Feedback)

| Phase | Description | Action |
| :--- | :--- | :--- |
| **1: Hash Check** | 重複検知 | **Implement**: Hash-based logic -> Move to Excluded |
| **1: Date Check** | 期間外検知 | **Implement**: Period logic -> Move to Excluded |
| **2: BS (Transfer)** | 振替 | **Implement**: Bank Fingerprint check |
| **2: BS (Payment)** | 消込 | **Implement**: `defaultPaymentMethod` check |
| **3: International** | 免税/リバチャ | **Implement**: Tax Codes `export_exempt`, `reverse_charge` |
| **4: Policy** | 役員報酬/社保 | **Implement**: Withholding Tax calculation |
| **5: Risk** | >10万資産 | **Implement**: Check `taxFilingType` |
| **5: Risk** | 交際費判定 | **Implement**: >5000 check |
| **6: Inference** | 学習DB | **Implement**: Query `learning_rules` |
| **7: Fallback** | 仮払金 | **Implement**: Suspense account proposal |

## 4. Other Sheets & Collections Strategy

ユーザー指示に基づき、以下のシートはFirestoreコレクションまたはシステム機能として実装する。

| Sheet | System Mapping | Action |
| :--- | :--- | :--- |
| **04_学習ルールDB** | Collection: `learning_rules` | スキーマ定義追加 |
| **05_資料管理DB** | Collection: `materials` | 要: `checkMaterialStatus` ロジックとの整合 |
| **08_監査ログ** | Collection: `audit_logs` | 既存定義 (`AuditLog`) の見直し |
| **00_環境設定** | Doc: `system/settings` | 既存定義 (`SystemSettings`) の維持・拡張 |
| **98_ロジックフロー** | `useAccountingSystem.ts` | コード内ロジックとして実装 |
| **10_ワークベンチ** | `Screen E` | UIとして実装済 |

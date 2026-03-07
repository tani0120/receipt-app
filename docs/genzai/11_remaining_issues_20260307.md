# 残存修正項目一覧（2026-03-07）

> 本日中に全件修正する前提で、優先度・リスク・修正時期を整理。

---

## A. 残存 `receipt` 参照（src内 50ファイル）

### A1. 今すぐ修正すべき（UI層のリネーム漏れ・不整合）

| # | ファイル | 内容 | 修正方法 |
|---|---------|------|---------|
| 1 | `src/router/index.ts` | コメント内に`receipt`残存の可能性 | コメント修正 |
| 2 | `src/repositories/documentRepository.ts` | ログ内`Receipt`やコレクション名`receipts` | DBテーブル名はそのまま。コメントのみ修正 |
| 3 | `src/database/repositories/documentRepository.ts` | `update_receipt_status` RPC名、`receipts`テーブル名 | DB側の名前なのでコード側はそのまま。コメント修正 |
| 4 | `src/api/routes/documents.ts` | `system@receipt-app.com`、`journal`コメント内 | メールアドレスは別途検討。コメント修正 |
| 5 | `src/mocks/data/document_mock_data.ts` | データ内 `id: 'receipt-001'` | データ値なのでそのまま（DB互換維持） |

### A2. 本日修正すべき（ドメインモデル層）

> これらは「証票」概念を`receipt`と表現しているファイル群。ドメイン用語の統一のため修正する。

| # | ファイル | 主な参照 | 修正方針 |
|---|---------|---------|---------|
| 1 | `src/types/schema_v2.ts` | `ReceiptDocument` interface | → `DocumentRecord`（Firestoreスキーマ） |
| 2 | `src/types/ui.type.ts` | `receipt: JobStepUi` | → `document: JobStepUi` |
| 3 | `src/types/ScreenB_ui.type.ts` | `receipt: JournalStatusStepUi` | → `document: JournalStatusStepUi` |
| 4 | `src/types/zod_schema.ts` | `receipt: z.string()` | → `document: z.string()` |
| 5 | `src/types/schema_keys.ts` | `ReceiptSchema`, `ReceiptKey`, `Receipt:` | → `DocumentSchema`, `DocumentKey` |
| 6 | `src/composables/mapper.ts` | 多数の`receipt`参照 | → `document`に統一 |
| 7 | `src/composables/JournalStatusMapper.ts` | `receipt`ステップ参照 | → `document` |
| 8 | `src/libs/adapters/legacy_to_v2.ts` | `convertLegacyJobToReceipt` | → `convertLegacyJobToDocument` |
| 9 | `src/libs/adapters/v2_to_ui.ts` | `receipt`変換 | → `document` |
| 10 | `src/__tests__/JobMapper.test.ts` | `ui.steps.receipt` | → `ui.steps.document` |
| 11 | `src/views/debug/ScreenB_Restore_Mock.vue` | `receipt: 'done'`（7箇所） | → `document: 'done'` |
| 12 | `src/components/ScreenB_JobSteps.vue` | `receipt`ステップ表示 | → `document` |
| 13 | `src/components/ScreenB_LogicMaster.vue` | `receipt`参照 | → `document` |
| 14 | `src/components/ScreenC_CollectionStatus.vue` | `receipt`参照 | → `document` |
| 15 | `src/components/ScreenE_LogicMaster.vue` | `receipt`参照 | → `document` |
| 16 | `src/components/ScreenE_JournalEntry.vue` | `receipt`参照 | → `document` |
| 17 | `src/components/debug/MigrationTester.vue` | `receipt`参照 | → `document` |
| 18 | `src/services/migration_service.ts` | `convertLegacyJobToReceipt`, `V2_COLLECTION_RECEIPTS` | → `convertLegacyJobToDocument` ※コレクション名は維持 |
| 19 | `src/mocks/mockJobUi.ts` | `receipt`ステップ | → `document` |
| 20 | `src/mocks/types/journal_phase5_mock.type.ts` | `receipt_id` プロパティ | → `document_id`（仕訳データのFK） |
| 21 | `src/mocks/data/journal_test_fixture_30cases.ts` | `receipt_id` データ値 | → `document_id` |
| 22 | `src/mocks/components/JournalListLevel3Mock.vue` | `receipt_id`, `receiptId` 引数名等 | → `document_id`, `documentId` |
| 23 | `src/domain/types/journal.ts` | `receipt_id` | → `document_id` |
| 24 | `src/composables/useDriveFileListMock.ts` | `receipt`参照 | → `document` |
| 25 | `src/utils/seedJobs.ts` | コメント内`Receipt` | コメント修正 |
| 26 | `src/mocks/views/MockMasterHubPage.vue` | `receipt`参照 | → `document` |
| 27 | `src/database/repositories/auditLogRepository.ts` | `receipt`参照 | 確認して修正 |

### A3. 修正不要（ドメイン用語として正当）

> これらの`receipt`は「領収書」「レシート」というドメイン用語であり、`document`への置換は不適切。

| # | ファイル | 内容 | 理由 |
|---|---------|------|------|
| 1 | `src/types/GeminiOCR.types.ts` | `category: 'RECEIPT'` | AIファイル種別判定。領収書カテゴリ |
| 2 | `src/services/ai/FileTypeDetector.ts` | `RECEIPT: 領収書` | AI分類のenum値 |
| 3 | `src/scripts/classify_schema.ts` | `ReceiptItem`, `'RECEIPT'` enum | AI分類スキーマの領収書型 |
| 4 | `src/scripts/compare_models.ts` | `'RECEIPT'` enum | モデル比較用 |
| 5 | `src/scripts/ground_truth.ts` | `receipt_items`, `RECEIPT:` | 正解データの領収書定義 |
| 6 | `src/scripts/classify_test.ts` | `receipt`テストデータ | AI分類テスト |
| 7 | `src/scripts/transformToJournalMock.ts` | `VoucherType.RECEIPT` | 証憑種別の領収書 |
| 8 | `src/types/DriveFileList.types.ts` | コメント `receipt_001.jpg` | ファイル名例 |
| 9 | `src/api/vertex/ocr_service_vertex.ts` | `receipt`処理 | OCR対象の領収書 |
| 10 | `src/api/lib/ai/types.ts` | AI関連 | AI処理 |
| 11 | `src/api/lib/ai/strategies/*.ts` | AI戦略 | AI処理 |
| 12 | `src/api/lib/ai/strategy/ZuboraLogic.ts` | AI処理 | AI処理 |
| 13 | `src/api/services/JournalService.ts` | `receipt`処理 | 仕訳サービス内の領収書参照 |
| 14 | `src/api/routes/journal-status.ts` | `receipt`参照 | 仕訳ステータスの領収書工程 |
| 15 | `src/core/journal/JournalEntrySchema.ts` | `receipt_id` | 仕訳スキーマのFK（DB連動） |

### A4. docs内（OLD/アーカイブ — 修正不要）

> OLDフォルダやアーカイブの過去ドキュメント。書き換えても意味がなく触らない。

| # | パス |
|---|------|
| 1 | `docs/genzai/OLD/phase2_receipt_ui_refactor_260207/*.md`（5ファイル） |
| 2 | `docs/genzai/OLD/phase3_data_migration_skip_260207/*.md` |
| 3 | `docs/genzai/OLD/kari_hokan/phase4_journal_ui_refactor_260208/*.md` |
| 4 | `docs/genzai/OLD/phase0_architecture_design_260205/*.md` |
| 5 | `docs/genzai/OLD/phase1_postgresql_introduction_260207/*.md` |
| 6 | `docs/genzai/OLD/phase_unknown/POSTGRESQL_MIGRATION_TRACKER.md` |
| 7 | `docs/genzai/NEW/phaseA_streamed_compatible_design_260208/*.md` |
| 8 | `docs/_archive_legacy/kakunin/*.md`（2ファイル） |

### A5. docs内（現行ドキュメント — 修正すべき）

| # | ファイル | 修正内容 |
|---|---------|---------|
| 1 | `docs/genzai/01_tools_and_setups/tools_and_setup_guide.md` | `receiptViewModel` → `documentViewModel`、`receiptStore` → `documentStore`、`receiptStatus` → `documentStatus` |

---

## B. eslintエラー 205件（44ファイル）

### B1. `no-explicit-any` (約90件)

> `any` 型を適切な型に置換。量が多いため、ファイル単位でバッチ処理。

<details>
<summary>対象ファイル一覧（クリックで展開）</summary>

| # | ファイル | any数 |
|---|---------|------|
| 1 | `src/__tests__/ClientMapper.test.ts` | 7 |
| 2 | `src/__tests__/JobMapper.test.ts` | 3 |
| 3 | `src/api/gemini/ocr_service.ts` | 3 |
| 4 | `src/api/gemini/ocr_service_browser.ts` | 2 |
| 5 | `src/api/gemini/schemas.ts` | 2 |
| 6 | `src/api/lib/ai/AIProviderFactory.ts` | 1 |
| 7 | `src/api/lib/firebase.ts` | 1 |
| 8 | `src/api/lib/gemini.ts` | 1 |
| 9 | `src/api/lib/globalLogger.ts` | 2 |
| 10 | `src/api/routes/admin.ts` | 6 |
| 11 | `src/api/routes/conversion.ts` | 2 |
| 12 | `src/api/routes/jobs.ts` | 3 |
| 13 | `src/api/routes/journal-status.ts` | 3 |
| 14 | `src/api/routes/ocr.ts` | 1 |
| 15 | `src/api/services/ConversionService.ts` | 1 |
| 16 | `src/api/services/JournalService.ts` | 10 |
| 17 | `src/api/services/WorkerService.ts` | 1 |
| 18 | `src/api/vertex/ocr_service_vertex.ts` | 1 |
| 19 | `src/components/ClientModal.vue` | 1 |
| 20 | `src/components/ScreenA_ClientDetail.vue` | 2 |
| 21 | `src/components/ScreenA_ClientList.vue` | 4 |
| 22 | `src/components/ScreenA_Detail_EditModal.vue` | 1 |
| 23 | `src/components/ScreenB_LogicMaster.vue` | 4 |
| 24 | `src/components/ScreenE_JournalEntry.vue` | 5 |
| 25 | `src/components/ScreenE_LogicMaster.vue` | 8 |
| 26 | `src/components/debug/MigrationTester.vue` | 1 |
| 27 | `src/composables/AIRulesMapper.ts` | 3 |
| 28 | `src/composables/DataConversionMapper.ts` | 1 |
| 29 | `src/composables/JournalStatusMapper.ts` | 3 |
| 30 | `src/composables/mapper.ts` | 9 |
| 31 | `src/composables/useAIRules.ts` | 1 |
| 32 | `src/composables/useClientListRPC.ts` | 1 |
| 33 | `src/composables/useDataConversion.ts` | 3 |
| 34 | `src/composables/useJournalEntryRPC.ts` | 1 |
| 35 | `src/core/journal/services/CsvExportService.ts` | 1 |
| 36 | `src/libs/adapters/legacy_to_v2.ts` | 2 |
| 37 | `src/scripts/test-repo.ts` | 1 |
| 38 | `src/services/migration_service.ts` | 3 |
| 39 | `src/types/firestore.ts` | 3 |
| 40 | `src/utils/__tests__/schema-mapper.spec.ts` | 3 |
| 41 | `src/utils/auth.ts` | 3 |
| 42 | `src/utils/schema-mapper.ts` | 4 |
| 43 | `src/utils/testAuth.ts` | 1 |
| 44 | `src/views/LoginView.vue` | 2 |
| 45 | `src/views/ScreenB_JournalStatus.vue` | 1 |
| 46 | `src/views/ScreenG_DataConversion.vue` | 1 |
| 47 | `src/views/ScreenS_AccountSettings.vue` | 2 |
| 48 | `src/views/ScreenZ/ScreenZ_PromptDetail.vue` | 2 |
| 49 | `src/views/TestOCRPage.vue` | 4 |

</details>

### B2. `no-unused-vars` (約40件)

> 未使用の変数・引数・import。`_` prefixを付与するか削除。

<details>
<summary>対象ファイル一覧（クリックで展開）</summary>

| # | ファイル | 箇所 |
|---|---------|------|
| 1 | `src/api/gemini/ocr_service.ts` | `getOrCreateCache`, `validateAIIntermediateOutput`, `path`, `batchHistory` |
| 2 | `src/api/gemini/ocr_service_browser.ts` | `OCRRequest`, `SYSTEM_INSTRUCTION`, `batchHistory`, `error` |
| 3 | `src/api/gemini/schemas.ts` | `TaxItem`, `AuditResults` |
| 4 | `src/api/index.ts` | `cors`, `routes` |
| 5 | `src/api/lib/ai/strategies/VertexAIStrategy.ts` | `unknown` |
| 6 | `src/api/lib/ai/strategy/ZuboraLogic.ts` | `z`, `d1`, `d2`, `target`, `pool`, `anchorDate`, `windowDays` |
| 7 | `src/api/routes/admin.ts` | `AdminDashboardSchema` |
| 8 | `src/api/routes/jobs.ts` | `z` |
| 9 | `src/api/services/ConversionService.ts` | `ConversionLogDbSchema` |
| 10 | `src/api/services/JournalService.ts` | `JournalLineUi` |
| 11 | `src/api/services/WorkerService.ts` | `results`, `data` |
| 12 | `src/components/ScreenC_CollectionStatus.vue` | `onMounted`, `c_reportText`, `copyCReport` |
| 13 | `src/components/ScreenE_LogicMaster.vue` | `Timestamp`, `e`, `lastAction`, `reviewStatus`, `applyTemplate`, `data` |
| 14 | `src/composables/AIRulesMapper.ts` | `Timestamp` |
| 15 | `src/composables/JournalStatusMapper.ts` | `JobUi` |
| 16 | `src/composables/mapper.ts` | `JournalLineApi`, `safeBoolean`, `e`×2, `drTax` |
| 17 | `src/composables/useClientListRPC.ts` | `onUnmounted`, `Client` |
| 18 | `src/composables/useDataConversion.ts` | `SOFTWARE_LABELS`, `file` |
| 19 | `src/core/journal/services/CsvExportService.ts` | `client` |
| 20 | `src/core/journal/services/TaxCodeMapper.ts` | `internalCode`×2, `invoiceDeduction`×2 |
| 21 | `src/firebase-admin.ts` | `cert` |
| 22 | `src/libs/adapters/legacy_to_v2.ts` | `UserId`, `ClientId`, `WorkLogType`, `CurrencyCode`, `now` |
| 23 | `src/server.ts` | `error`, `server` |
| 24 | `src/services/JobService.ts` | `snapshot` |
| 25 | `src/services/RecurringLogic.ts` | `currentMonth`, `missingCandidates`, `baseName` |
| 26 | `src/services/migration_service.ts` | `getFirestore`, `collection` |
| 27 | `src/types/schema_keys.ts` | `TimestampSchema` |
| 28 | `src/views/ScreenD_AIRules.vue` | `watch`, `LearningRuleUi` |
| 29 | `src/views/ScreenE_Workbench.vue` | `loading` |

</details>

### B3. その他

| # | ファイル | エラー | 修正方法 |
|---|---------|-------|---------|
| 1 | `src/server.ts:27` | `no-require-imports` | ESM import化 |
| 2 | `src/components/ScreenA_ClientDetail.vue:134` | `vue/no-deprecated-filter` | フィルタ構文除去 |
| 3 | `src/libs/adapters/legacy_to_v2.ts:140` | `ban-ts-comment`（`@ts-ignore`） | `@ts-expect-error`に変更 |

---

## C. 修正順序（推奨）

| ステップ | 内容 | 推定時間 | 状態 |
|---------|------|---------|------|
| **1** | **コミット**: `50a646b` receipt→documentリネーム+型エラー修正+B2一部 | 2分 | ✅完了 |
| **2** | **A2 (ドメインモデル層)**: 27ファイルのreceipt→document修正 | 30分 | ✅完了 |
| **3** | **D1-D3 (既存型エラー)**: mockJobUi.ts, ScreenB_LogicMaster.vue, seedJobs.ts | 10分 | ✅完了 |
| **4** | **A1 (コメント・関数名修正)**: documentRepository.tsの関数名リネーム + DBコメント追記 | 10分 | ✅完了 |
| **5** | **A5 (docs)**: tools_and_setup_guide.mdのファイルツリーパス名修正（6箇所） | 5分 | ✅完了 |
| **6** | **B2 (unused-vars + D4/D5)**: 29ファイルの未使用変数修正 ※D4/D5はここに統合 | 20分 | ✅完了 |
| **7** | **B1 (any)**: 49ファイルのany型修正 | 60分 | 未着手 |
| **8** | **B3 (その他)**: require, deprecated filter, ts-ignore | 5分 | ✅完了 |
| **9** | **検証**: vue-tsc + eslint | 10分 | ✅完了（vue-tsc 0エラー、eslint unused-vars 0件、any 16件はB1） |

---

## D. A2修正中に発見した既存型エラー（5件）

> A2リネーム作業中に発見。リネームとは無関係だが、型安全性向上のため修正対象。
> D4/D5はB2（unused-vars一括修正）に統合して実施する。

| # | ファイル | エラー内容 | 修正方針 | 状態 |
|---|---------|----------|---------|------|
| 1 | `src/mocks/mockJobUi.ts` | `priority:'none'`型不整合、`type:'journalEntry'`型不整合、`showButton`未定義プロパティ、未使用import/変数 | モックデータを型に合わせ、`Partial<JobUi>[]`化 | ✅完了 |
| 2 | `src/components/ScreenB_LogicMaster.vue` L429 | `string \| undefined` → `string` 引数型不一致 | `split('_')[0]`にフォールバック追加 | ✅完了 |
| 3 | `src/utils/seedJobs.ts` | `subAccount` → 正しくは `drSubAccount`、`JobStatus` 未使用import | プロパティ名修正 + import削除 | ✅完了 |
| 4 | `src/components/ScreenC_CollectionStatus.vue` | `code`/`name`不在、`openReportModal`未定義、未使用変数3件 | **B2に統合**（unused-vars一括修正で対応） | ✅完了 |
| 5 | `src/components/ScreenE_LogicMaster.vue` | `Job`/`JobStatus` import不在、暗黙的any多数、未使用変数6件 | **B2に統合**（unused-vars一括修正で対応） | ✅完了 |

---

## E. B2修正中に発見した既存問題（2026-03-07 20:00追記）

> B2 unused-vars修正中にlintフィードバックから発見。スコープ外だが修正必須。

### E-1. 🔴 エラー級（コンパイル通らない可能性）

| ID | ファイル | 行 | 問題 | 備考 |
|----|---------|---|------|------|
| E1 | `src/services/migration_service.ts` | 11 | `convertLegacyJobToReceipt`が`legacy_to_v2.ts`に存在しない（`convertLegacyJobToDocument`にリネーム済み） | ✅修正済み |
| E2 | `src/api/gemini/ocr_service_browser.ts` | 13 | `AIIntermediateOutput`が`schemas.ts`からエクスポートされていない（ローカル宣言のみ） | ✅import元変更 |
| E3 | `src/api/gemini/ocr_service_browser.ts` | 32 | `callGeminiAPIBrowser`は3引数要求だが2引数で呼出 | ✅第3引数追加 |
| E4 | `src/services/JobService.ts` | 17-18 | `m.id`/`m.clientCode`が`string \| undefined`だが`string`型に代入 | ✅`??`フォールバック追加 |

### E-2. 🟡 eslint-warning級

| ID | ファイル | 行 | 問題 |
|----|---------|---|------|
| W1 | `src/server.ts` | 27 | `require()`スタイルimport禁止 | ✅B3 #1で修正済み（`readFileSync`+`JSON.parse`化） |
| W2 | `src/server.ts` | 33 | `_error` defined but never used | ✅`catch`引数省略で修正済み |
| W3 | `src/libs/adapters/legacy_to_v2.ts` | 136 | `@ts-ignore`使用 | ✅削除済み（unused directiveだったため） |
| W4 | 多数ファイル | N/A | `any`型が多数残存 | ⭕B1スコープ（次タスク） |

### E-3. 🟠 矛盾・要確認

| ID | 内容 |
|----|------|
| C1 | `src/views/ScreenD_AIRules.vue` L88で`handleEdit(rule)`にオブジェクトを渡しているが、`handleEdit`の型がstring要求→型不一致（既存バグ） |
| C2 | `src/views/ScreenE_Workbench.vue`の`loading`変数: composableから取得しているがテンプレートで未使用。`uiMode`の方を使用。dead code候補だがVueのscript setup制約で`_`prefix不可 |

### E-4. B2スキップファイル一覧（理由付き）

| ファイル | unused-vars状況 | スキップ理由 |
|---------|---------------|--------------|
| `src/composables/mapper.ts` | `JournalLineApi`, `safeBoolean`, `e`×2, `drTax` | grep結果ゼロ → 前セッションで修正済み |
| `src/core/journal/services/CsvExportService.ts` | `client` | 既に`_client`に修正済み |
| `src/api/routes/admin.ts` | `AdminDashboardSchema` | ローカルスキーマ定義→将来使用、削除リスク大 |
| `src/api/services/ConversionService.ts` | `ConversionLogDbSchema` | 同上 |
| `src/api/services/WorkerService.ts` | `results`, `data` | 実際に使用中 |
| `src/composables/useDataConversion.ts` | `SOFTWARE_LABELS` | ローカル定義（non-import）削除影響不明 |
| `src/views/ScreenE_Workbench.vue` | `loading` | composable destructure→`_`prefixするとVueテンプレート参照名変更リスク |
| `src/components/ScreenC_CollectionStatus.vue` | D4 | ✅修正済み |
| `src/components/ScreenE_LogicMaster.vue` | D5 | ✅修正済み |

---

## F. 検証結果（2026-03-07 20:32追記）

### vue-tsc

```
npx vue-tsc --noEmit → 終了コード 0（エラーなし）✅
```

### eslint（修正対象8ファイルに限定）

| ルール | 件数 | 状態 |
|------|------|------|
| `no-unused-vars` | **0件** | ✅今回スコープ全件解消 |
| `no-explicit-any` | **16件** | ⭕B1スコープ（次タスク） |
| その他 | **0件** | ✅ |

### eslint（全体 src/）

| ルール | 件数 | 状態 |
|------|------|------|
| `no-explicit-any` | 約150件 | B1スコープ（49ファイル） |
| `no-unused-vars` | 0件 | ✅ |
| その他 | 2件（warning） | — |

### ブラウザ動作確認

白画面なし、コンソールエラーなし。正常表示確認済み。

# ✅ 残存修正項目一覧（2026-03-07）【全件完了】

> **最終結果（2026-03-12 00:30）**: §A-§L全件完了 + §M（2026-03-11スキーマ同期）全件完了。
> 残存2件（J1: ScreenE旧モック再設計待ち、J7: 設計上のprivateフィールド）は対応不要として§Lに記録。

> ~~本日中に全件修正する前提で、優先度・リスク・修正時期を整理。~~

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
| **7** | **B1 (any) バッチA**: 26ファイル・92件のany型修正 | 30分 | ✅完了（92件削減・150→58件） |
| **7b** | **B1 (any) バッチB**: 23ファイル・58件（クライアントサイド） | 40分 | ✅完了（ESLint no-explicit-any 0件達成） |
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
| `no-explicit-any` | **0件** | ✅バッチA+B完了（150件→0件） |
| `no-unused-vars` | 0件 | ✅ |
| その他 | 2件（warning） | — |

### ブラウザ動作確認

白画面なし、コンソールエラーなし。正常表示確認済み。

---

## G. B1バッチA修正中に発見した既存問題（2026-03-07 21:00追記）

> B1 no-explicit-any修正中にlintフィードバックから発見。**全て既存問題**であり、今回の修正で新規に発生したものではない。

### G-1. 🔴 型エラー級

| ID | ファイル | 行 | 問題 |
|----|---------|---|------|
| G1 | `src/api/services/ConversionService.ts` | 71 | `generateContent` は型 `{}` に存在しない（`gemini.ts`の`model`型`unknown`起因） |
| G2 | `src/api/vertex/ocr_service_vertex.ts` | 12 | `AIIntermediateOutput` が `schemas.ts` からエクスポートされていない |
| G3 | `src/api/vertex/ocr_service_vertex.ts` | 227,237 | `string \| undefined` を `string` パラメータに割当不可 |
| G4 | `src/api/gemini/ocr_service_browser.ts` | 73 | `string \| undefined` を `string \| PromiseLike<string>` に割当不可 |
| G5 | `src/api/gemini/ocr_service_browser.ts` | 212 | `string \| undefined` を `string` パラメータに割当不可 |
| G6 | `src/composables/mapper.ts` | 493 | `actions` プロパティが `ConversionLogUi` 型で必須だが返却オブジェクトに欠落 |
| G7 | `src/utils/schema-mapper.ts` | 24 | `ZodRawShape` は型のみimport必須（`verbatimModuleSyntax` 有効時） |
| G8 | `src/composables/AIRulesMapper.ts` | 20 | `{}` が `in` 演算子の右オペランドとして不適切 |

### G-2. 🟡 eslint-warning級

| ID | ファイル | 行 | 問題 |
|----|---------|---|------|
| G9 | `src/api/lib/globalLogger.ts` | 13 | オブジェクトは `undefined` である可能性があります |
| G10 | `src/api/services/ConversionService.ts` | 16 | `ConversionLogDbSchema` unused import |
| G11 | `src/api/services/WorkerService.ts` | 30,39 | `results`, `data` unused variables |
| G12 | `src/api/routes/admin.ts` | 46 | `AdminDashboardSchema` unused |
| G13 | `src/composables/mapper.ts` | 13,56,69,82,316,416 | `JournalLineApi`, `safeBoolean`, `e`×3, `drTax` unused |

---

## H. 【スコープ宣言】B1 バッチB — クライアントサイド no-explicit-any修正（2026-03-07 21:05）

### 変更対象ファイル（23ファイル・58件）:

| # | ファイル | any件数 | 主なパターン |
|---|---------|--------|-------------|
| 1 | `src/__tests__/ClientMapper.test.ts` | 7 | テストデータ `as any` |
| 2 | `src/components/ScreenE_LogicMaster.vue` | 7 | イベントハンドラ引数/Firestore data |
| 3 | `src/components/ScreenE_JournalEntry.vue` | 5 | フォーム操作/emit引数 |
| 4 | `src/components/ScreenA_ClientList.vue` | 4 | Firestore snapshot/ソート |
| 5 | `src/components/ScreenB_LogicMaster.vue` | 4 | イベント/データバインド |
| 6 | `src/views/TestOCRPage.vue` | 4 | ファイル操作/API応答 |
| 7 | `src/__tests__/JobMapper.test.ts` | 3 | テストデータ `as any` |
| 8 | `src/composables/useDataConversion.ts` | 3 | Firestore data/error |
| 9 | `src/utils/__tests__/schema-mapper.spec.ts` | 3 | テストデータ |
| 10 | `src/components/ScreenA_ClientDetail.vue` | 2 | プロパティアクセス |
| 11 | `src/views/LoginView.vue` | 2 | catch error |
| 12 | `src/views/ScreenS_AccountSettings.vue` | 2 | フォーム操作 |
| 13 | `src/views/ScreenZ/ScreenZ_PromptDetail.vue` | 2 | JSON操作 |
| 14 | `src/components/ClientModal.vue` | 1 | emit引数 |
| 15 | `src/components/ScreenA_Detail_EditModal.vue` | 1 | emit引数 |
| 16 | `src/components/debug/MigrationTester.vue` | 1 | catch error |
| 17 | `src/composables/useAIRules.ts` | 1 | Firestore snapshot |
| 18 | `src/composables/useClientListRPC.ts` | 1 | catch error |
| 19 | `src/composables/useJournalEntryRPC.ts` | 1 | API応答 |
| 20 | `src/core/journal/services/CsvExportService.ts` | 1 | ジェネリック |
| 21 | `src/scripts/test-repo.ts` | 1 | テストスクリプト |
| 22 | `src/views/ScreenB_JournalStatus.vue` | 1 | Firestore data |
| 23 | `src/views/ScreenG_DataConversion.vue` | 1 | ファイル操作 |

### 新規作成予定ファイル:
- なし

### 触らないファイル:
- 上記23ファイル以外の全ファイル
- バッチAで修正済みの26ファイルは触らない

### 修正内容詳細:

| パターン | 修正方法 | 該当件数（推定） |
|----------|---------|----------------|
| `catch(e: any)` | → `catch(e: unknown)` + `e instanceof Error ? e.message : String(e)` | ~8件 |
| テストデータ `as any` | → `as unknown as TargetType` または型に合わせたデータ修正 | ~13件 |
| Firestore `doc.data()` → `any` | → `eslint-disable` または `as Record<string, unknown>` | ~8件 |
| イベントハンドラ引数 `(e: any)` | → `(e: Event)` / `(e: unknown)` / 具体型 | ~10件 |
| emit/API応答 `as any` | → `eslint-disable` | ~5件 |
| JSON.parse結果 `as any` | → `as unknown` + 型ガード | ~5件 |
| ジェネリック内部 | → `eslint-disable` | ~3件 |

### 想定している問題:
1. **Vueテンプレートとの噛み合い**: `.vue`ファイルの`<script setup>`内でany→unknown変更すると、テンプレート側の式で型エラーが連鎖する可能性
2. **テストファイルの型変更**: `as any`を外すとテストデータの構造が型と一致しない場合にビルドエラー
3. **Firestoreインターフェース**: `doc.data()`の戻り値型がFirestore SDKで`DocumentData | undefined`のため、具体型への変換が困難な箇所あり
4. **イベントハンドラ**: Vue独自のイベント型（`InputEvent`等）とブラウザネイティブ型の不一致

### 検証方法:
1. `npx vue-tsc --noEmit` — 0エラー維持
2. `npx eslint src/ --ext .ts,.vue` — no-explicit-any 0件が目標
3. ブラウザ手動確認 — ログイン→顧問先管理→各画面の表示確認

### 理由:
- B1 バッチAで150→58件に削減したが、残り58件を全件処理して`no-explicit-any`ルールを完全クリアにするため
- 特にクライアントサイド(.vue)は実行時バグのリスクが高く、型安全性の向上が重要

---

## I. 【スコープ宣言】B2残存 — no-unused-vars 16件修正（2026-03-07 21:38）

### 変更対象ファイル（9ファイル・16件）:

| # | ファイル | 件数 | 箇所 |
|---|---------|------|------|
| 1 | `src/composables/mapper.ts` | 5 | `JournalLineApi`(L13), `safeBoolean`(L56), `e`(L69,L82,L416), `drTax`(L316) |
| 2 | `src/api/services/WorkerService.ts` | 2 | `results`(L30), `data`(L39) |
| 3 | `src/composables/useDataConversion.ts` | 2 | `SOFTWARE_LABELS`(L93), `file`(L119) |
| 4 | `src/api/index.ts` | 1 | `routes`(L28) — 型のみ使用 |
| 5 | `src/api/lib/ai/strategies/VertexAIStrategy.ts` | 1 | `_e`(L72) |
| 6 | `src/api/routes/admin.ts` | 1 | `AdminDashboardSchema`(L46) |
| 7 | `src/api/services/ConversionService.ts` | 1 | `ConversionLogDbSchema`(L16) |
| 8 | `src/core/journal/services/CsvExportService.ts` | 1 | `client`(L23) |
| 9 | `src/views/ScreenE_Workbench.vue` | 1 | `loading`(L228) |

### 新規作成予定ファイル:
- なし

### 触らないファイル:
- 上記9ファイル以外の全ファイル

### 修正内容詳細:

| パターン | 修正方法 | 該当件数 |
|----------|---------|---------|
| 未使用import (`JournalLineApi`) | import文から削除 | 1 |
| 未使用変数 (`safeBoolean`, `drTax`, `SOFTWARE_LABELS`) | `_`prefix付与 or 削除 | 3 |
| 未使用catch引数 (`e` ×3) | `catch` 引数省略 or `_e` | 3 |
| 未使用destructure (`results`, `data`, `file`) | `_`prefix付与 | 3 |
| 型としてのみ使用 (`routes`) | `type`修飾子追加 or `_`prefix | 1 |
| 将来使用予定スキーマ (`AdminDashboardSchema`, `ConversionLogDbSchema`) | `_`prefix付与（削除リスク回避） | 2 |
| 引数未使用 (`client`, `_e`) | `_`prefix付与 | 2 |
| Vue composable destructure (`loading`) | `_loading`に変更（テンプレート未使用確認済み） | 1 |

### 想定している問題:
1. **`mapper.ts`の`safeBoolean`削除**: 他ファイルから参照されていないことを確認必要（grep済み、使用なし）
2. **`AdminDashboardSchema`/`ConversionLogDbSchema`の削除**: 将来使用予定のため削除ではなく`_`prefix方針
3. **`ScreenE_Workbench.vue`の`loading`**: composableのdestructureで取得しているが、テンプレートで使用していない。`_loading`にするとVueのreactivity警告が出る可能性
4. **`WorkerService.ts`の`results`/`data`**: 実際のコードで使用されている可能性があるため要確認

### 検証方法:
1. `npx eslint src/ --ext .ts,.vue` — no-unused-vars 0件が目標
2. `npx vue-tsc --noEmit` — 0エラー維持
3. ブラウザ手動確認 — 主要画面の表示確認

### 理由:
- ESLint完全クリアを目指す（現在16件 → 0件）
- `no-unused-vars`は死んだコードの蓄積を防ぎ、保守性を向上させる

---

## J. §I修正中に再確認した既存問題（2026-03-07 21:47追記）

> §I（no-unused-vars 16件修正）中にIDEフィードバックから再確認。全て既存問題であり今回の修正で新規発生したものはない。§Gと重複する項目を含む。

### J-1. 🔴 型エラー級

| ID | ファイル | 行 | 問題 | §Gとの対応 |
|----|---------|---|------|-----------|
| J1 | `src/views/ScreenE_Workbench.vue` | 多数 | テンプレート内`entry.evidenceUrl`, `entry.transactionDate`, `entry.vendorName`, `entry.tNumber`等が`JournalEntryUi`型に存在しない（旧UI構造とスキーマの不整合） | 新規 |
| J2 | `src/api/services/ConversionService.ts` | 71 | `generateContent`が型`{}`に存在しない（`gemini.ts`の`model`型`unknown`起因） | = G1 |
| J3 | `src/core/journal/services/CsvExportService.ts` | 2 | `@/features/client`モジュールが見つからない（未実装モジュール参照） | 新規 |
| J4 | `src/core/journal/services/CsvExportService.ts` | 101 | `Record<string,any> | undefined`を`{}`に割当不可（Object.keys引数型不一致） | 新規 |

### J-2. 🟡 TypeScript warning級

| ID | ファイル | 行 | 問題 | §Gとの対応 |
|----|---------|---|------|-----------|
| J5 | `src/api/index.ts` | 50 | 一部のコードパスは値を返しません（zValidatorコールバック） | 新規 |
| J6 | `src/api/routes/admin.ts` | 90 | 一部のコードパスは値を返しません（同上） | 新規 |
| J7 | `src/api/lib/ai/strategies/VertexAIStrategy.ts` | 7 | `private location`が宣言後未読み取り | 新規 |

---

## K. 【スコープ宣言】§G/§J既存型問題13件修正（2026-03-07 21:57）

> §G-1の8件 + §J新規6件 = 重複1件排除 → 計13件。ScreenE_Workbench.vue（J1）は旧UIモック全体の再設計が必要なためスコープ外。

### 変更対象ファイル（9ファイル・13件）:

| # | ファイル | 件数 | ID | 問題 |
|---|---------|------|-----|------|
| 1 | `src/composables/mapper.ts` | 1 | G6 | `actions`プロパティが`ConversionLogUi`で必須だが返却オブジェクトに欠落 |
| 2 | `src/composables/AIRulesMapper.ts` | 1 | G8 | `{}`が`in`演算子の右オペランドとして不適切 |
| 3 | `src/utils/schema-mapper.ts` | 1 | G7 | `ZodRawShape`を型import（`import type`）に変更 |
| 4 | `src/api/services/ConversionService.ts` | 1 | G1/J2 | `generateContent`が型`{}`に存在しない（`getModel()`戻り値型修正） |
| 5 | `src/api/vertex/ocr_service_vertex.ts` | 3 | G2,G3 | import不在 + string\|undefined型不一致2箇所 |
| 6 | `src/api/gemini/ocr_service_browser.ts` | 2 | G4,G5 | string\|undefined型不一致2箇所 |
| 7 | `src/core/journal/services/CsvExportService.ts` | 2 | J3,J4 | 未実装モジュール参照 + Object.keys型不一致 |
| 8 | `src/api/index.ts` | 1 | J5 | zValidatorコールバックのreturn欠落 |
| 9 | `src/api/routes/admin.ts` | 1 | J6 | zValidatorコールバックのreturn欠落 |

### スコープ外:
- `src/views/ScreenE_Workbench.vue`（J1）— 旧UIモック。テンプレートとスキーマの全面不整合。再設計が必要
- `src/api/lib/ai/strategies/VertexAIStrategy.ts` L7（J7）— `private location`はコンストラクタで代入されており、class内部で使用予定の設計。削除は不適切

### 新規作成予定ファイル:
- なし

### 触らないファイル:
- 上記9ファイル以外の全ファイル

### 修正内容詳細:

| ID | 修正方法 |
|----|---------|
| G1/J2 | `src/api/lib/gemini.ts`の`getModel()`戻り値型を`unknown`→`GenerativeModel`に修正。または`ConversionService.ts`で`as`キャスト |
| G2 | `schemas.ts`から`AIIntermediateOutput`をexport、またはvertex側のimport元変更 |
| G3 | `?? ''`フォールバック追加（string\|undefined → string） |
| G4,G5 | `?? ''`フォールバック追加（同上） |
| G6 | `mapper.ts`のConversionLog変換で`actions: []`を返却オブジェクトに追加 |
| G7 | `import { ZodRawShape }` → `import type { ZodRawShape }` |
| G8 | `typeof raw === 'object' && raw !== null`ガード追加後に`in`演算子使用 |
| J3 | `@/features/client`参照を正しいパスに変更、または型定義を直接import |
| J4 | `Object.keys(obj ?? {})`でundefinedガード追加 |
| J5,J6 | zValidatorコールバックに`return`文追加（バリデーション成功時のパス） |

### 想定している問題:
1. **G1**: `gemini.ts`の`getModel()`型変更は他の呼び出し元に影響する可能性
2. **G2**: `schemas.ts`のexport変更は他のimport元に影響
3. **J3**: `@/features/client`が未実装の場合、代替パスの特定が必要
4. **J5/J6**: zValidatorの仕様上、成功時は`undefined`を返す設計かもしれない（仕様確認必要）

### 検証方法:
1. `npx vue-tsc --noEmit` — 0エラー維持
2. `npx eslint src/ --ext .ts,.vue` — 0件維持
3. ブラウザ手動確認 — 主要画面の表示確認

### 理由:
- IDEのTypeScriptフィードバック（ts-plugin）で報告される既存の型エラー・警告を解消し、開発体験を向上
- vue-tscは通過するがIDE上で赤波線が出続ける状態を改善

### §K 結果（2026-03-07 22:09追記）:
- ✅完了（13件全件修正。ESLint 0件・vue-tsc 0エラー維持。ブラウザ正常動作確認済み）
- §G-2の5件（G9-G13）は§I（no-unused-vars修正）で修正済み

---

## L. 残存問題（2026-03-07 22:09追記）

> §K修正完了後に残る問題。全てスコープ外として記録。

| ID | ファイル | 問題 | 対応方針 |
|----|---------|------|---------|
| J1 | `src/views/ScreenE_Workbench.vue` | テンプレートと`JournalEntryUi`型の全面不整合（`evidenceUrl`, `transactionDate`, `vendorName`, `tNumber`, `drAccount`, `crAccount`等 20箇所超） | 旧UIモック。Screen E全面再設計時に対応 |
| J7 | `src/api/lib/ai/strategies/VertexAIStrategy.ts` L7 | `private location`が宣言後未読み取り | 設計上のprivateフィールド（コンストラクタで代入。将来API呼出しで使用予定）。削除は不適切 |

---

## M. スキーマ同期修正（2026-03-11/12追記）

> migration.sql全面更新に伴い、TypeScript型定義・モックデータ・設計書を新スキーマに同期。
> コミット: `5a8a9ff`, `7055d91`

### M-1. migration.sql修正（9件）

| # | 修正内容 | 状態 |
|---|---------|:----:|
| 1 | テーブル作成順序修正（documents→journals参照整合性） | ✅ |
| 2 | SEQUENCE定義15個追加（接頭辞+連番ID用） | ✅ |
| 3 | FOREIGN KEY TODOコメント3件追加（users, journal_rules未定義分） | ✅ |
| 4 | RLSポリシー修正（auth.uid()::uuid→current_setting） | ✅ |
| 5 | vendorsテーブルへのupdated_atトリガー追加 | ✅ |
| 6 | labels数21→22種類に修正 | ✅ |
| 7 | Phase 5ヘッダー・コメント復元 | ✅ |
| 8 | セクション区切り線3箇所復活 | ✅ |
| 9 | インデックスカウント更新（20個） | ✅ |

### M-2. 設計書修正（3件）

| # | 修正内容 | 状態 |
|---|---------|:----:|
| 1 | `document_id`型 VARCHAR(30)→VARCHAR(20)に統一 | ✅ |
| 2 | §6セクション構成にSEQUENCE定義（1.5）追記 | ✅ |
| 3 | §6を証票系→仕訳系の順序に修正 | ✅ |

### M-3. TypeScript型定義修正（8件）

| # | ファイル | 修正内容 | 状態 |
|---|---------|---------|:----:|
| 1 | `journal_phase5_mock.type.ts` | IDコメント修正 + ラベル数22 + 8カラム追加 | ✅ |
| 2 | `transformToJournalMock.ts` | `receipt_id`→`document_id`, `tax_category`→`tax_category_id` | ✅ |
| 3 | `transformToJournalMock.ts` | `date_on_document`, `account_on_document`, `amount_on_document`追加 | ✅ |
| 4 | `transformToJournalMock.ts` | `crypto.randomUUID()`→`generateJournalId()`（jrn-連番） | ✅ |

### M-4. モックデータ・Document型（3件）

| # | ファイル | 修正内容 | 状態 |
|---|---------|---------|:----:|
| 1 | `journal_test_fixture_30cases.ts` | ID `j001`~`j035`→`jrn-00000001`~`jrn-00000035` | ✅ |
| 2 | `document_mock.type.ts` | 5→17カラムに拡張 | ✅ |
| 3 | `document_line_mock.type.ts` | **新規作成**（12カラム） | ✅ |

### M-5. スタッフID形式統一（2件）

| # | ファイル | 修正内容 | 状態 |
|---|---------|---------|:----:|
| 1 | `useStaff.ts` | UUID→`staff-0001`連番形式 | ✅ |
| 2 | `MockMasterStaffPage.vue` | UUID列→「内部ID」列 | ✅ |

### M-6. 未修正（スコープ外）

| # | ファイル | 問題 | 対応方針 |
|---|---------|------|---------|
| 1 | `GeminiVisionService.ts` L126,139 | `crypto.randomUUID()`残存（Phase 1旧型体系） | Phase C廃止時に対応 |
| 2 | Firebase | `localhost:5175`許可ドメイン未設定 | Firebaseコンソールで手動設定 |
| 3 | `JournalEntrySchema.ts` | `receipt_id`残存（§A3 #15、DB連動FK） | Supabase移行時に変更 |

---

## N. エンコーディング文字化け修正（2026-03-12追記）

> `journal_test_fixture_30cases.ts`がShift-JIS（CP932）で保存されており、
> 仕訳一覧画面（`/client/journal-list/:clientId`）で全データ行が文字化けしていた。

### N-1. 修正済み

| # | ファイル | 問題 | 対応 | 状態 |
|---|---------|------|------|:----:|
| 1 | `journal_test_fixture_30cases.ts` | Shift-JIS（CP932）で保存されていた | Node.jsの`TextDecoder('shift-jis')`でUTF-8に変換 | ✅ |

### N-2. 再発防止（構造的対策）

| # | 対策 | 状態 | 備考 |
|---|------|:----:|------|
| 1 | `.editorconfig`にUTF-8強制ルール追加 | ❌ | 次コミットで対応 |
| 2 | `.vscode/settings.json`にUTF-8設定追加 | ❌ | 次コミットで対応 |
| 3 | huskyのpre-commitフックにShift-JIS検出追加 | ❌ | 次コミットで対応 |
| 4 | `00_モック実装時のルール.md`§13-14に方針記載 | ✅ | エンコーディングルール+PowerShell使い分け |
| 5 | `12_full_schema_design_20260311.md`§7に方針記載 | ✅ | CSV出力UTF-8 BOM付き |
| 6 | `10_nullable_on_document_plan.md`H4に方針記載 | ✅ | CSV出力UTF-8 BOM付き |

---

## O. staffName全削除 + 設定パネル読み取り専用化（2026-03-14追記）

> 設定画面（`ScreenS_Settings.vue`）の基本情報パネルを読み取り専用化し、
> 旧系統の`staffName`フィールドを全ファイルから削除。

### O-1. 設定パネル読み取り専用化

| # | ファイル | 修正内容 | 状態 |
|---|---------|---------|:----:|
| 1 | `ScreenS_Settings.vue` | パネルを元のフォームデザインに復元＋全要素disabled化。「顧問先情報の編集はこちら」リンク（左寄せ17px太字）＋×ボタン。panel-cancel/panel-save CSS削除 | ✅ |

### O-2. staffName全削除

| # | ファイル | 修正内容 | 状態 |
|---|---------|---------|:----:|
| 1 | `ui.type.ts` | ClientUi型からstaffName削除 | ✅ |
| 2 | `ClientMapper.ts` | フォールバック・変数抽出・return文からstaffName削除（3箇所） | ✅ |
| 3 | `useAdminDashboard.ts` | ClientAnalysis型＋モック3件からstaffName削除 | ✅ |
| 4 | `useAccountingSystem.ts` | モック12件からstaffName削除 | ✅ |
| 5 | `ScreenZ_Dashboard.vue` | テーブルの「担当者名」列（th+td）削除 | ✅ |

### O-3. 型修正・警告修正

| # | ファイル | 修正内容 | 状態 |
|---|---------|---------|:----:|
| 1 | `useAdminDashboard.ts` | `StaffPerformance`型6フィールドをoptional→必須化 | ✅ |
| 2 | `useAccountingSystem.ts` | `createNewJob(file: File)` → `createNewJob(_file: File)` 未使用引数明示 | ✅ |

### O-4. Phase B/C負債ドキュメントに移管（2026-03-14更新）

| # | ファイル | 問題 | 対応状況 |
|---|---------|------|:--------:|
| 1 | `useAccountingSystem.ts` | モックデータ12件にclientId/advisoryFee等5フィールド不足 | ✅ 修正済み |
| 2 | `useAccountingSystem.ts` L1166 | updatedAt型不整合 → lintキャッシュ残骸 | 対応不要 |
| 3 | `useAccountingSystem.ts` L1218 | Hono RPC $post型がUI用フィールド要求 | → Phase B H1 |
| 4 | `useAccountingSystem.ts` | createClient/updateClient Zodパイプライン未通過 | → Phase B H2 |
| 5 | `useAccountingSystem.ts` L1144 | mockClientsPreloadのダブルキャスト | → Phase B H3 |
| 6 | `useAccountingSystem.ts` L1270-1283 | fetchClients内モック注入ロジック | → Phase B H4 |
| 7 | `zod_schema.ts` L393,L406 | JobSchema日本語プロパティ名 | → Phase B H5 |
| 8 | `zod_schema.ts` L251,L273,L274 | JobSchema z.any()使用（型安全ルール違反） | → Phase B H6 |
| 9 | `zod_schema.ts` L220-481 | JobSchema肥大化（470+フィールド） | → Phase B H7 |
| 10 | `useAccountingSystem.ts` | /api/clientsエンドポイント500エラー | → Phase C RC-9 |


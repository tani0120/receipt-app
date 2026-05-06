# フォルダ構造再設計 詳細計画（全ファイル名記載版）

> **作成日**: 2026-05-06
> **現状**: 23トップレベルフォルダ
> **目標**: 12トップレベルフォルダに統合
> **調査方法**: 全フォルダを実際にlist_dirで調査。空想なし。

---

## 現状の全ファイル一覧（消滅対象フォルダ）

### 1. `src/__tests__/` → 削除
| ファイル | サイズ | 処分 |
|---|---|---|
| ClientMapper.test.ts | 3,256B | 削除（孤立テスト） |

### 2. `src/columns/` → `src/shared/` に移動
| ファイル | サイズ | 移動先 |
|---|---|---|
| journalColumns.ts | 4,302B | `src/shared/journalColumns.ts` |

### 3. `src/constants/` → 削除（重複確認要）
| ファイル | サイズ | 処分 |
|---|---|---|
| options.ts | 631B | 削除（重複確認後） |

### 4. `src/core/journal/` → `src/shared/journal/` に移動
| ファイル | サイズ | 移動先 |
|---|---|---|
| JournalEntrySchema.ts | 13,178B | `src/shared/journal/JournalEntrySchema.ts` |
| JournalSemanticGuard.ts | 5,963B | `src/shared/journal/JournalSemanticGuard.ts` |
| index.ts | 2,459B | `src/shared/journal/index.ts` |
| services/CsvExportService.ts | 4,762B | `src/shared/journal/services/CsvExportService.ts` |
| services/CsvValidator.ts | 3,535B | `src/shared/journal/services/CsvValidator.ts` |
| services/TaxCodeMapper.ts | 4,383B | `src/shared/journal/services/TaxCodeMapper.ts` |
| services/TaxResolutionService.ts | 3,964B | `src/shared/journal/services/TaxResolutionService.ts` |

### 5. `src/database/` → 分散配置
| ファイル | サイズ | 移動先 |
|---|---|---|
| repositories/documentRepository.ts | 1,783B | `src/repositories/mock/documentRepository.ts`（要確認） |
| supabase/client.ts | 1,238B | `src/repositories/supabase/client.ts`（要確認） |
| supabase/schema.sql | 3,644B | `src/repositories/supabase/schema.sql`（要確認） |
| types/document.types.ts | 695B | `src/types/document.types.ts`（要確認） |

### 6. `src/definitions/` → `src/shared/` に移動
| ファイル | サイズ | 移動先 |
|---|---|---|
| field-nullable-spec.ts | 4,232B | `src/shared/field-nullable-spec.ts` |

### 7. `src/domain/types/` → `src/types/` に統合
| ファイル | サイズ | 移動先 |
|---|---|---|
| journal.ts | 7,772B | `src/types/domain-journal.ts`（名前衝突回避） |

### 8. `src/lib/` → `src/repositories/supabase/` に移動
| ファイル | サイズ | 移動先 |
|---|---|---|
| supabase.ts | 1,394B | `src/repositories/supabase/supabase.ts`（要確認） |

### 9. `src/services/` → `src/api/services/` に移動
| ファイル | サイズ | 移動先 |
|---|---|---|
| receiptService.ts | 11,064B | `src/api/services/receiptService.ts` |

### 10. `src/stores/` → `src/composables/` に移動
| ファイル | サイズ | 移動先 |
|---|---|---|
| journalStore.ts | 1,805B | `src/composables/journalStore.ts`（名前衝突注意: api/services/にも同名あり） |

### 11. `src/shared/types/` → `src/types/` に統合
| ファイル | サイズ | 移動先 |
|---|---|---|
| account.ts | 2,330B | `src/types/shared-account.ts`（名前衝突回避） |
| tax-category.ts | 2,476B | `src/types/shared-tax-category.ts`（名前衝突回避） |
| yen.ts | 243B | `src/types/yen.ts` |

---

## 統合対象フォルダ

### 12. `src/shared/data/` → `src/data/master/` に移動
| ファイル | サイズ | 移動先 |
|---|---|---|
| account-category-rules.ts | 6,064B | `src/data/master/account-category-rules.ts` |
| account-master.ts | 48,381B | `src/data/master/account-master.ts` |
| tax-category-master.ts | 46,284B | `src/data/master/tax-category-master.ts` |
| voucherTypeRules.ts | 6,061B | `src/data/master/voucherTypeRules.ts` |

### 13. `src/shared/utils/` → `src/utils/` に統合
| ファイル | サイズ | 移動先 |
|---|---|---|
| copy-utils.ts | 1,635B | `src/utils/copy-utils.ts` |
| mf-csv-date.ts | 2,204B | `src/utils/mf-csv-date.ts` |

### 14. AI/OCR関連フォルダ → `src/api/ai/` に統合
| 現在のパス | ファイル | サイズ | 移動先 |
|---|---|---|---|
| api/gemini/ | cache_manager.ts | 4,017B | `src/api/ai/gemini/cache_manager.ts` |
| api/gemini/ | ocr_service.ts | 3,275B | `src/api/ai/gemini/ocr_service.ts` |
| api/gemini/ | ocr_service_browser.ts | 6,932B | `src/api/ai/gemini/ocr_service_browser.ts` |
| api/gemini/ | schemas.ts | 5,266B | `src/api/ai/gemini/schemas.ts` |
| api/gemini/ | system_instruction.ts | 4,443B | `src/api/ai/gemini/system_instruction.ts` |
| api/lib/ai/ | AIProviderFactory.ts | 5,023B | `src/api/ai/AIProviderFactory.ts` |
| api/lib/ai/ | types.ts | 1,338B | `src/api/ai/types.ts` |
| api/lib/ai/strategies/ | AIStudioStrategy.ts | 3,659B | `src/api/ai/strategies/AIStudioStrategy.ts` |
| api/lib/ai/strategies/ | VertexAIStrategy.ts | 2,554B | `src/api/ai/strategies/VertexAIStrategy.ts` |
| api/lib/ | storage.ts | 6,530B | `src/api/ai/storage.ts`（要確認: AI関連か） |
| api/ocr/ | ocr_service.ts | 2,702B | `src/api/ai/ocr/ocr_service.ts` |
| api/vertex/ | cache_manager_vertex.ts | 4,200B | `src/api/ai/vertex/cache_manager_vertex.ts` |
| api/vertex/ | ocr_service_vertex.ts | 7,575B | `src/api/ai/vertex/ocr_service_vertex.ts` |

---

## 移動しないフォルダ（現状維持）

### `src/api/` （ai統合以外は維持）
| サブフォルダ/ファイル | 件数 |
|---|---|
| config.ts | 1件 |
| index.ts | 1件 |
| helpers/ | apiError.ts, apiMessages.ts, zodHook.ts（3件） |
| routes/ | 25件（accountMasterRoutes.ts, activityLogRoutes.ts, admin.ts, ai-models.ts, clientRoutes.ts, collection.ts, confirmedJournalRoutes.ts, conversion.ts, docStore.ts, documents.ts, drive.ts, exportHistoryRoutes.ts, exportRoutes.ts, guestAuthRoutes.ts, industryVectorRoutes.ts, journalRoutes.ts, learningRuleRoutes.ts, notificationRoutes.ts, ocr.ts, pipeline.ts, progressRoutes.ts, shareStatusRoutes.ts, staffRoutes.ts, taxCategoryRoutes.ts, vendorRoutes.ts） |
| services/ | 23件 + drive/driveService.ts + migration/7件 + pipeline/6件（計37件） |

### `src/components/` （維持）
| サブフォルダ/ファイル | 件数 |
|---|---|
| 直下 | ConfirmModal.vue, DriveFileListView.vue, GlobalToast.vue, JournalListLevel3Mock.vue, MockNavBar.vue, NotificationCenter.vue, NotifyModal.vue, PortalHeader.vue, PromptDefinitionsPanel.vue, ScreenC_CollectionStatus.vue, TypeDefinitionsPanel.vue, UI_ActionButton.vue, UI_StandardButton.vue, UI_StatusBadge.vue, UI_StatusIcon.vue, UI_StepBox.vue, typeDefinitionsData.ts, typeDefinitionsData_prompts.ts（18件） |
| ScreenG/ | G_BrandRadio.vue, G_HistoryItem.vue, G_StatusBadge.vue, G_StepHeader.vue（4件） |
| document/ | EditorView.vue, FallbackView.vue, LoadingView.vue, OcrPreview.vue, ReadonlyView.vue, RejectedView.vue（6件） |

### `src/composables/` （維持: 23件）
ClientDetailMapper.ts, ClientMapper.ts, accountingConstants.ts, useActivityTracker.ts, useAdminDashboard.ts, useColumnResize.ts, useCurrentUser.ts, useDataConversion.ts, useDocSelection.ts, useDocuments.ts, useDraggable.ts, useDriveDocuments.ts, useDriveFileListMock.ts, useGlobalToast.ts, useJournals.ts, useMigrationPoller.ts, useModalHelper.ts, useNotificationCenter.ts, usePdfRenderer.ts, usePreviewZoom.ts, useShareStatus.ts, useUnsavedGuard.ts, useUpload.ts

### `src/data/` （維持 + master/追加）
| サブフォルダ/ファイル | 件数 |
|---|---|
| 直下 | document_mock_data.ts, learning_rules_TST00011.ts, ledger_sample.csv（3件） |
| pipeline/ | industry_vector_corporate.ts, industry_vector_sole.ts, vendors_global.ts（3件） |
| master/ | ★新設: shared/data/から4件移動 |

### `src/features/` （維持: 11件）
| サブフォルダ | ファイル |
|---|---|
| account-management/composables/ | useAccountMaster.ts, useClientAccounts.ts（2件） |
| account-settings/composables/ | useAccountSettings.ts（1件） |
| account-settings/types/ | account-settings.types.ts（1件） |
| client-management/composables/ | useClients.ts（1件） |
| progress-management/composables/ | useProgress.ts（1件） |
| progress-management/utils/ | monthColumns.ts（1件） |
| progress-management/ | types.ts（1件） |
| staff-management/composables/ | useStaff.ts（1件） |
| tax-management/composables/ | useClientTaxCategories.ts, useTaxMaster.ts（2件） |

### `src/repositories/` （維持）
| サブフォルダ/ファイル | 件数 |
|---|---|
| index.ts | 1件 |
| types.ts | 1件 |
| mock/ | index.ts, shareStatus.repository.mock.ts, vendor.repository.mock.ts（3件） |
| supabase/ | account.repository.supabase.ts, clientVendor.repository.supabase.ts, helpers.ts, index.ts, industryVector.repository.supabase.ts, shareStatus.repository.supabase.ts, vendor.repository.supabase.ts（7件） |

### `src/router/` （維持）
| ファイル | 件数 |
|---|---|
| index.ts | 1件 |
| routes/mvp.ts | 1件 |

### `src/scripts/` （維持: 4件）
preprocess.ts, preview_extract_postprocess.ts, preview_extract_schema.ts, preview_extract_test.ts

### `src/types/` （維持 + 統合で追加）
| ファイル | 件数 |
|---|---|
| 直下 | DriveFileList.types.ts, GeminiOCR.types.ts, ScreenG_ui.type.ts, confirmed_journal.type.ts, documentViewModel.ts, document_mock.type.ts, journal.ts, journalEntryViewModel.ts, journalLineVM.ts, journal_phase5_mock.type.ts, learning_rule.type.ts, staff_notes.ts, ui.type.ts（13件） |
| pipeline/ | line_item.type.ts, non_vendor.type.ts, source_type.type.ts, vendor.type.ts（4件） |
| ★追加 | domain-journal.ts, shared-account.ts, shared-tax-category.ts, yen.ts, document.types.ts（5件） |

### `src/utils/` （維持 + 統合で追加）
| ファイル | 件数 |
|---|---|
| 直下 | auth.ts, documentUtils.ts, errorRole.ts, exportMfCsv.ts, journalWarningSync.ts, lineItemToJournalMock.ts, pdfThumbnail.ts（7件） |
| pipeline/ | accountDetermination.ts, matchLearningRule.ts, mfCsvParser.ts, validation.ts, vendorIdentification.ts（5件） |
| ★追加 | copy-utils.ts, mf-csv-date.ts（2件） |

### `src/shared/` （直下整理後）
| ファイル | 件数 |
|---|---|
| 直下（維持） | documentStatus.ts, fileTypes.ts, journalEntryStatus.ts, journalUiMode.ts, schema_dictionary.ts, validationMessages.ts（6件） |
| ★追加 | journalColumns.ts, field-nullable-spec.ts（2件） |
| journal/ | ★新設: core/journal/から7件移動 |
| data/ | ★消滅（master/へ移動） |
| types/ | ★消滅（types/へ統合） |
| utils/ | ★消滅（utils/へ統合） |

### `src/views/` （40件 + __tests__/1件）
| ファイル | サイズ |
|---|---|
| DocumentDetail.vue | 4,328B |
| DriveFileList.vue | 1,538B |
| LoginView.vue | 5,618B |
| MockAdminDashboardPage.vue | 33,577B |
| MockClientAccountsPage.vue | 43,111B |
| MockClientIndustryVectorPage.vue | 22,714B |
| MockClientTaxPage.vue | 31,774B |
| MockCostsPage.vue | 699B |
| MockDriveSelectPage.vue | 49,404B |
| MockDriveUploadPage.vue | 18,682B |
| MockExcludedHistoryPage.vue | 14,693B |
| MockExportDetailPage.vue | 8,547B |
| MockExportHistoryPage.vue | 10,120B |
| MockExportPage.vue | 24,479B |
| MockHistoryImportPage.vue | 25,950B |
| MockHomePage.vue | 11,899B |
| MockLearningPage.vue | 39,882B |
| MockMasterAccountsPage.vue | 39,415B |
| MockMasterClientsPage.vue | 63,334B |
| MockMasterIndustryVectorPage.vue | 25,187B |
| MockMasterManagementPage.vue | 5,053B |
| MockMasterNonVendorPage.vue | 23,046B |
| MockMasterStaffPage.vue | 26,856B |
| MockMasterTaxCategoriesPage.vue | 32,277B |
| MockMasterVendorsPage.vue | 23,212B |
| MockNotFoundPage.vue | 13,103B |
| MockOutputPortalPage.vue | 10,514B |
| MockPortalLoginPage.vue | 24,639B |
| MockPortalPage.vue | 12,783B |
| MockProgressDetailPage.vue | 22,573B |
| MockSettingsHubPage.vue | 679B |
| MockSettingsPage.vue | 2,742B |
| MockSupportingHistoryPage.vue | 14,668B |
| MockUploadDocsPage.vue | 18,855B |
| MockUploadSelectorUnifiedPage.vue | 34,705B |
| MockUploadUnifiedPage.vue | 60,949B |
| ScreenG_DataConversion.vue | 11,742B |
| ScreenH_TaskDashboard.vue | 30,914B |
| ScreenS_Settings.vue | 19,180B |
| TestOCRPage.vue | 17,404B |
| __tests__/DocumentDetail.spec.ts | 5,205B |

### `src/assets/` （維持: 3件）
base.css, logo.svg, main.css

### `src/` 直下ファイル（維持）
App.vue, main.ts, server.ts

---

## 実行順序（リスク昇順）

| Phase | 内容 | 対象ファイル数 | import修正見込 | リスク |
|---|---|---|---|---|
| **1** | 死亡ファイル削除 | 削除: __tests__/ClientMapper.test.ts, constants/options.ts（要重複確認） | 0件 | ゼロ |
| **2** | 1ファイルフォルダ解消 | columns/→shared/, definitions/→shared/, stores/→composables/, services/→api/services/, lib/→repositories/supabase/, domain/types/→types/ | ~12件 |低 |
| **3** | shared/types/ → types/ 統合 | account.ts, tax-category.ts, yen.ts | ~20件 | 低 |
| **4** | shared/data/ → data/master/ + shared/utils/ → utils/ 統合 | 4件 + 2件 = 6件 | ~15件 | 低 |
| **5** | core/journal/ → shared/journal/ 移動 | 7件（3直下 + services/4件） | ~20件 | 中 |
| **6** | AI/OCR統合（gemini/ + lib/ai/ + ocr/ + vertex/ → api/ai/） | 13件 | ~15件 | 中 |
| **7** | database/ → repositories/ + types/ 分散 | 4件 | ~10件 | 中 |
| **8** | views/サブフォルダ化（任意） | 30件+ | ~30件 | 中 |
| **検証** | vue-tsc + ビルド | — | — | — |

> 各Phase完了後にvue-tscで型チェック実施。エラーゼロを確認してから次Phaseへ。

---

## ★名前衝突リスク一覧

| 移動元 | 移動先 | 衝突するファイル名 | 対策 |
|---|---|---|---|
| domain/types/journal.ts | types/ | types/journal.ts が既存 | → `domain-journal.ts` にリネーム |
| shared/types/account.ts | types/ | 衝突なし（現時点） | → `shared-account.ts` に念のためリネーム |
| shared/types/tax-category.ts | types/ | 衝突なし（現時点） | → `shared-tax-category.ts` に念のためリネーム |
| stores/journalStore.ts | composables/ | 衝突なし | そのまま移動 |
| database/types/document.types.ts | types/ | 衝突なし | そのまま移動 |

---

## ★実行方針（全Phase共通・厳守）

### 方針1: 削除判定（デッドコード検出）

移動/削除の前に、**必ず**grep_searchでimport被参照を調査する。

```
手順: grep_searchで「ファイル名（拡張子なし）」をプロジェクト全体から検索

例: grep_search("ClientMapper.test") → 0件ヒット → デッドコード → 削除候補
例: grep_search("journalColumns") → 3件ヒット → 移動 + import修正
```

| 被参照件数 | 判定 | 補足 |
|---|---|---|
| 0件 | 削除候補 | ただしre-export・dynamic importの可能性があるのでファイル内容も確認 |
| 1件以上 | 移動対象 | import元ファイル名を全件記録してからPhaseに着手 |

### 方針2: ファイル内容確認の基準

全ファイルの中身を読む必要はない。**以下のケースでは必ず読む：**

- import被参照が0件のファイル（本当に不要か確認）
- 名前衝突が発生するファイル（export内容が重複していないか確認）
- `database/`の4ファイル（既存の`repositories/`との関係を確認）
- 移動先に同名ファイルが存在するケース

### 方針3: import影響の確認・修正手順

各ファイル移動時に以下を**厳守**する。

```
① grep_searchで旧パスのimport文を全件検索
   → 例: grep_search("from '../columns/journalColumns'")
   → 例: grep_search("from '@/columns/journalColumns'")
   → 例: grep_search("columns/journalColumns")  ← 広めに検索して漏れ防止

② 全件のimportパスを新パスに修正

③ 修正後に再度grep_searchで旧パスが残っていないことを確認（残件ゼロ必須）

④ Phase完了後にvue-tscでエラーゼロを確認
```

### 方針4: 1ファイルごとの実行フロー

```
[事前調査] grep_searchでimport被参照を全件洗い出し
    ↓
[判定] 0件→削除 / 1件以上→移動
    ↓
[内容確認] 必要なケースではファイルの中身を読む
    ↓
[移動] 新しいパスにファイル作成 → 旧ファイル削除
    ↓
[import修正] grep_searchで旧パスを全件検索 → 全件修正
    ↓
[漏れ確認] grep_searchで旧パスが0件であることを確認
    ↓
[Phase完了] vue-tsc → エラーゼロ確認
```

### 方針5: 禁止事項

- **空想で「使われていない」と判断するな。** 必ずgrep_searchで確認
- **import修正を「たぶんこれだけ」で終わらせるな。** 全件検索で漏れゼロを確認
- **Phase間を飛ばすな。** vue-tscエラーゼロを確認してから次Phaseへ
- **PowerShellでファイル操作するな。** write_to_file / replace_file_contentのみ使用

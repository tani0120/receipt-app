# 31. フロントロジックAPI化 全体監査タスク

> 作成日: 2026-05-05
> 対象: 全composable 15ファイル + 全Vueページ 30ファイル + 全コンポーネント
> 方法: `filter()` / `sort()` / `reduce()` / `computed()` の全出現箇所スキャン、ロジック量を分類
> 準拠: `.agent/workflows/code_quality.md` L16: ★supabase移行できるようにすべてのロジックをapi化せよ

---

## 全タスク完了状況

| タスク | 対象 | 状態 |
|---|---|---|
| T-31-1 | 進捗管理API（progressListService.ts） | ✅ 完了 |
| T-31-2 | useProgress.ts 集計ロジックAPI化 | ✅ 完了 |
| T-31-3 | 管理者ダッシュボード集計API | ✅ 完了 |
| T-31-4 | ScreenH_TaskDashboard.vue API化 | ✅ 完了 |
| T-31-5 | useDataConversion.ts API化 | ✅ 完了 |
| T-31-6 | MockAdminDashboardPage.vue ステータスカウントAPI化 | ✅ 完了 |
| T-31-7 | MockExportPage.vue API化 | ✅ 完了 |
| T-31-8 | MockLearningPage.vue API化 | ✅ 完了 |
| T-31-9 | MockExportDetailPage.vue API化 | ✅ 完了 |

---

## T-31-6: MockAdminDashboardPage.vue ステータスカウントAPI化 ✅（2026-05-05）

- `GET /api/admin/dashboard/summary` にstaffStatusCounts/clientStatusCountsを追加
- ページ側のfilter 6件（active/inactive/suspension × staff/client）→ API値参照に置換
- UIソート（<30行テーブル）は応答速度優先で残留

## T-31-7: MockExportPage.vue API化 ✅（2026-05-05）

- `POST /api/export/list` 新設（exportListService.ts + exportRoutes.ts）
- 仕訳→ExportRow展開 + セグメントフィルタ + 科目フィルタ + ソート + ページネーション + 合計金額集計
- LDI-00008検証: 19行/8仕訳/¥395,000/ソートOK/ページネーション4ページ

## T-31-8: MockLearningPage.vue API化 ✅（2026-05-05）

- `POST /api/learning-rules/:clientId/list` 新設
- カテゴリ別カウント + ステータスカウント + 生成元カウント + フィルタ + 検索
- TST-00011検証: 15ルール（receipt:4/bank:6/credit:5, ai:7/human:8）

## T-31-9: MockExportDetailPage.vue API化 ✅（2026-05-05）

- `POST /api/export/detail` 新設（exportListService.ts内getExportDetail）
- historyId別仕訳展開 + ソート + ページネーション + 科目名解決
- LDI-00008検証: 40行/8ページ/historyFileName解決OK

---

## 「移行不要」と判定した全ファイル（2026-05-05 精査確定）

### composable — ローカルキャッシュ操作・UI状態派生（移行不要）

| ファイル | filter/sort/reduce件数 | 判定理由 |
|---|---|---|
| useDocuments.ts | filter 6件 | ローカルキャッシュref操作のみ |
| useDriveDocuments.ts | filter 2件, sort 1件, map 2件 | Drive APIレスポンスのUI表示変換 |
| useUpload.ts | filter多数, sort 2件 | ブラウザローカルのFile APIキュー管理 |
| useDocSelection.ts | filter 4件 | UI状態の派生値 |
| useNotificationCenter.ts | filter 1件 | 未読カウント。UI状態 |
| useUnsavedGuard.ts | filter 1件 | 変更ログのフォーマット |
| useStaff.ts | filter 2件 | activeStaff/adminStaffの少量データ表示切替 |

### ページ — ブラウザ固有UI制御（移行不要）

| ファイル | 判定理由 |
|---|---|
| MockHomePage.vue | `.filter(Boolean)` メニューnull除去 |
| MockUploadDocsPage.vue | アップロードキューUI制御 |
| MockUploadUnifiedPage.vue | 表示件数制限・重複グループ表示 |
| MockDriveSelectPage.vue | 証票選別UI（Canvas API） |
| MockDriveUploadPage.vue | Drive操作UI |
| MockHistoryImportPage.vue | CSVインポート行のUI操作 |
| MockNotFoundPage.vue | エラーコード→表示文面変換 |
| MockPortalPage.vue | UI表示用1件取得 |
| MockPortalLoginPage.vue | 同上 |
| MockOutputPortalPage.vue | ルートパラメータ派生 |
| MockSupportingHistoryPage.vue | isAllChecked computed |
| MockUploadSelectorUnifiedPage.vue | UIデータ派生 |
| ScreenG_DataConversion.vue | canConvertはUI状態。sortedLogsはT-31-5でAPI化済み |

### インライン編集画面 — 構造的に移行不可能

| ファイル | 判定理由 |
|---|---|
| MockMasterAccountsPage.vue | 編集中API再取得→未保存データ消失 |
| MockMasterTaxCategoriesPage.vue | 同上 |
| MockMasterIndustryVectorPage.vue | 同上 |
| MockClientAccountsPage.vue | 同上（顧問先版） |
| MockClientTaxPage.vue | 同上 |
| MockClientIndustryVectorPage.vue | 同上 |

### API化済み画面の残存（UI表示用computedのみ。移行不要）

| ファイル | 判定理由 |
|---|---|
| JournalListLevel3Mock.vue | フィルタ/ソート/ページネーションはjournalListServiceでAPI化済み |
| MockMasterVendorsPage.vue | API化済み。残存は表示用computed |
| MockMasterNonVendorPage.vue | API化済み |
| MockMasterStaffPage.vue | API化済み |
| MockMasterClientsPage.vue | API化済み |

---

## 残存課題（2026-05-05 R4 精査 → R5 全件修正）

### A. モックデータ残存（API未接続） → ✅ 全件修正済み

| ファイル | 修正内容 | 状態 |
|---|---|---|
| `useAdminDashboard.ts` | MOCK_DATA(250行)をゼロ/空配列のDEFAULT_DATAに置換。API取得で上書き。downloadCsvの疑似setTimeout削除 | ✅ |
| `api/routes/collection.ts` | MOCK_CLIENTS(2社ハードコード)をclientStore.getAll()による動的取得に置換 | ✅ |
| `ClientDetailMapper.ts` | healthScore:92→0, recentActivities:3件→空配列。API接続TODOコメント追記 | ✅ |
| `ScreenH_TaskDashboard.vue` | ウィジェット8個のハードコード数値をwidgets ref（API値）に紐付け | ✅ |
| `api/routes/admin.ts` | MOCK_ADMIN_DATA(KPI+3スタッフ)を削除→ストア実データ集計(/dashboard)に置換 | ✅ R5 |
| `api/routes/clients.ts` | 死コード削除（clientRoutes.tsに完全移行済み。server.tsでコメントアウト済み） | 🗑 R5 |
| `api/types/ClientRaw.ts` | clients.ts専用型。clients.ts削除に伴い不要 | 🗑 R5 |

### B. 疑似処理（setTimeout） → ✅ 全件修正済み

| ファイル | 修正内容 | 状態 |
|---|---|---|
| `useDataConversion.ts` | 4回のsetTimeout(1000)疑似処理を削除。POST /api/conversion/convert接続TODOを明記 | ✅ |
| `useDriveFileListMock.ts` | Phase B移行TODOをdocstringに追記（モック全体のためsetTimeoutは維持） | ✅ TODO |

### C. ハードコードID（Supabase Auth移行時に対処） → ✅ TODO明記済み

| ファイル | 修正内容 | 状態 |
|---|---|---|
| `useActivityTracker.ts` L40 | Phase B移行手順（3ステップ）をdocstringに明記 | ✅ TODO |
| `useCurrentUser.ts` | Phase B移行TODOが既に記載済みであることを確認 | ✅ 既存 |

### D. localStorage残存（対処済み + 残留分類）

| 状態 | 件数 | 内容 |
|---|---|---|
| ✅ R4修正済み | 3件 | MockMasterAccountsPage, MockMasterTaxCategoriesPage, MockClientAccountsPage |
| ⚠ Phase B対応 | 5ファイル | ゲスト認証系（PortalLogin, NotFound, router, errorRole）+ useCurrentUser |
| — 移行不要 | 2ファイル | useColumnResize（UI設定）, MockHomePage（メニュー順序） |
| ✅ マイグレーション済み | 1ファイル | useClients（LS→サーバー移行ロジック。移行完了後に削除予定） |

---

## 関連ドキュメント

| ドキュメント | 関連 |
|---|---|
| [28_api_migration_plan.md](28_api_migration_plan.md) | Phase 1-2の実績記録 |
| [30_audit_checklist.md](30_audit_checklist.md) | タスク2（仕訳一覧検証）、タスク3（各ページ確認） |
| [migration_tasks.md](../supabase/migration_tasks.md) | セクション12（Phase 3-4方針） |
| [load_context.md](../../.agent/workflows/load_context.md) | L16: ★supabase移行できるようにすべてのロジックをapi化せよ |

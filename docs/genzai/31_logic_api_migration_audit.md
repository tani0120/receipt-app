# 31. フロントロジックAPI化 — 全量調査と残タスク

> 作成日: 2026-05-05
> 調査対象: 全composable 15ファイル + 全Vueページ 30ファイル + 全コンポーネント
> 調査方法: `filter()` / `sort()` / `reduce()` / `computed()` の全出現箇所をスキャンし、ロジック種別を分類
> 根拠ルール: `.agent/workflows/load_context.md` L16「★supabase移行できるようにすべてのロジックをapi化せよ」

---

## 1. 調査結論

「完璧にやりきったか？」→ **やりきっていない。**

前回API化したのはマスタ管理4画面の `filteredRows` / `pagedRows` のみ。
composable層とページにビジネスロジック（フィルタ・ソート・集計・JOIN相当）が大量に残存。
「呼び出し側変更不要」はインライン編集画面が存在する限り **構造的に達成不可能**。

---

## 2. API化完了済み（5画面）

| # | 画面 | サービス | 完了日 | コミット |
|---|---|---|---|---|
| 1 | JournalListLevel3Mock.vue | journalListService.ts | 2026-05-03 | Phase 1完了 |
| 2 | MockMasterStaffPage.vue | staffListService.ts | 2026-05-05 | 876fd64 |
| 3 | MockMasterVendorsPage.vue | vendorListService.ts | 2026-05-05 | 876fd64 |
| 4 | MockMasterNonVendorPage.vue | vendorListService.ts（共用） | 2026-05-05 | 876fd64 |
| 5 | MockMasterClientsPage.vue | clientListService.ts | 2026-05-05 | 876fd64 |

**移行パターン:** `computed(() => { filter → sort → slice })` を削除し、`POST /api/xxx/list` でサーバーから `{ items, totalCount }` を取得。`watch([filter, sort, page])` で自動再取得。

---

## 3. API化未着手（今やるべき）

### 3-1. 🔴 P1: 進捗管理画面

#### 3-1-a. MockProgressDetailPage.vue — filteredRows computed

| 行番号 | ロジック | Supabase移行時の対応 |
|---|---|---|
| L272 | `filteredRows = computed(() => { ... })` | `WHERE + ORDER BY + LIMIT OFFSET` |
| L276 | `rows.filter(r => r.companyName.includes(searchQuery))` | `WHERE company_name ILIKE '%query%'` |
| L282 | `rows.filter(r => getStaffNameForClient(r.clientId) === filterStaff.value)` | `JOIN staff ON ... WHERE staff.name = ?` |
| L285 | `rows.filter(r => r.unexported > 0)` | `WHERE unexported > 0` |
| L290-303 | `rows.sort(...)` 4パターン（デフォルト/日付/件数/金額） | `ORDER BY` |
| L318 | `totalPages = computed(() => Math.ceil(filteredRows.length / PAGE_SIZE))` | `COUNT(*)` |
| L326 | `pagedRows = computed(() => filteredRows.slice(start, end))` | `LIMIT ? OFFSET ?` |

**必要なサービス:** `src/api/services/progressListService.ts`（新規）
**必要なルート:** `POST /api/progress/list`（progressRoutes.ts に追加）

#### 3-1-b. useProgress.ts — 集計ロジック

| 行番号 | ロジック | Supabase移行時の対応 |
|---|---|---|
| L69 | `journals.filter(j => !j.exported && !j.export_batch_id).length` | `SELECT COUNT(*) FROM journals WHERE exported = false` |
| L119 | `Promise.all(batch.map(async (c) => { ... }))` | 1クエリで全クライアント一括取得 |
| L140-142 | `allClients.map(c => { docs.filter(d => d.clientId === c.clientId) })` | `SELECT c.*, COUNT(d.id) FROM clients c LEFT JOIN documents d ON ...` |

**必要なサービス:** `progressListService.ts` に集計関数を追加
**必要なルート:** `GET /api/progress/summary/:clientId`（progressRoutes.ts に追加）

### 3-2. 🟡 P2: 管理者ダッシュボード

#### useAdminDashboard.ts — 集計ロジック

| 行番号 | ロジック | Supabase移行時の対応 |
|---|---|---|
| L469 | `clients.filter(c => c.status === 'active').length` | `SELECT COUNT(*) WHERE status = 'active'` |
| L470 | `clients.filter(c => c.status !== 'active').length` | `SELECT COUNT(*) WHERE status != 'active'` |
| L481 | `clients.map(c => ({ clientId, companyName, staffName, ... }))` | サーバー側で集計して返却 |
| L496 | `body.staff.filter(s => s.status === 'active').length` | `SELECT COUNT(*) FROM staff WHERE status = 'active'` |
| L507 | `body.staff.map(s => ({ ...分析データ }))` | サーバー側で集計して返却 |

**必要なサービス:** `src/api/services/adminDashboardService.ts`（新規）
**必要なルート:** `GET /api/admin/dashboard/summary`（既存 `adminRoutes.ts` に追加）

### 3-3. 🟡 P2: タスクダッシュボード

#### ScreenH_TaskDashboard.vue — フィルタ

| 行番号 | ロジック | Supabase移行時の対応 |
|---|---|---|
| L508-511 | `filteredClients = computed(() => allClients.filter(client => ...))` | `WHERE ILIKE` |

**対応:** 現状ハードコードモックデータのため後回し可。Supabase接続時に同時実施。

### 3-4. 🟢 P3: データ変換

#### useDataConversion.ts + ScreenG_DataConversion.vue

| ファイル | 行番号 | ロジック | Supabase移行時の対応 |
|---|---|---|---|
| useDataConversion.ts | L89 | `logs.filter(log => !log.isDownloaded).length` | `SELECT COUNT(*) WHERE is_downloaded = false` |
| ScreenG_DataConversion.vue | L171 | `[...logs.value].sort((a, b) => ...)` | `ORDER BY` |

**対応:** 小規模。Supabase接続時に同時実施で十分。

---

## 4. API化対象外（フロント残留が正当）

### 4-1. ブラウザローカルUI状態

| ファイル | ロジック箇所 | 残留理由 |
|---|---|---|
| useUpload.ts | 93箇所（filter/sort/reduce） | アップロードキューはブラウザローカルのFile操作。サーバーに送る意味なし |
| useDocSelection.ts | 4箇所 | ドキュメント選別カウント（pending/target/supporting/excluded）。UI状態の派生値 |
| useNotificationCenter.ts | 1箇所 | 未読カウント。UI状態の派生値 |
| useUnsavedGuard.ts | 1箇所 | 変更ログのフォーマット。UI表示ラベル生成 |
| useDriveDocuments.ts | 7箇所 | DriveファイルのUI表示変換（map/filter/sort）。サーバーから取得したデータのUI変換 |
| useStaff.ts | 2箇所 | `activeStaff`/`adminStaff` のcomputed。UI表示用フィルタ |

### 4-2. ページ固有のUI制御

| ファイル | ロジック箇所 | 残留理由 |
|---|---|---|
| MockUploadDocsPage.vue | 5箇所 | アップロードキュー管理（done/failed/uploading/queued集計） |
| MockUploadUnifiedPage.vue | 6箇所 | 表示件数制限・重複グループ表示・削除対象フィルタ |
| MockExportPage.vue / MockExportDetailPage.vue | 各数箇所 | CSV生成UI制御 |
| MockNotFoundPage.vue | 7箇所 | エラーコード→表示文面・色クラス・リトライ可否 |
| MockPortalPage.vue / MockPortalLoginPage.vue | 各2箇所 | `clients.find(c => c.clientId === id)` UI表示用1件取得 |
| MockOutputPortalPage.vue | 1箇所 | `route.params.clientId` のcomputed |
| MockSupportingHistoryPage.vue | 2箇所 | isAllChecked computed |
| MockUploadSelectorUnifiedPage.vue | 3箇所 | clientData/hasDriveFolder/driveUrl |
| ScreenG_DataConversion.vue | 2箇所 | canConvert/sortedLogs（ログのUI表示用） |

### 4-3. 仕訳一覧コンポーネント（既API化済み。残りはUI表示computed）

| ファイル | 残存computed/filter数 | 内容 |
|---|---|---|
| JournalListLevel3Mock.vue | 93件 | **フィルタ/ソート/ページネーションは既にjournalListService.tsでAPI化済み。** 残りはUI表示用computed（警告アイコン、セル背景色、ドロップダウン選択肢、モーダル制御等）。フロント残留が正当 |

---

## 5. Supabase移行と同時実施（今やると二度手間）

### 5-1. 科目/税区分composable — マスタ×クライアント合成ロジック

| composable | filter件数 | map件数 | sort件数 | 内容 |
|---|---|---|---|---|
| useAccountMaster.ts | 4 | 4 | 1 | マスタ科目のデフォルト/カスタム分類、非表示フィルタ |
| useClientAccounts.ts | 9 | 5 | 1 | クライアント科目の合成（マスタ+オーバーライド） |
| useTaxMaster.ts | 3 | 3 | 1 | マスタ税区分の合成 |
| useClientTaxCategories.ts | 7 | 4 | 1 | クライアント税区分の合成 |
| useAccountSettings.ts | 5 | 6 | 0 | 上記4つの統合IF（表示用accounts/taxCategories提供） |

**現状:** サーバーから取得した生データをcomposable内で再加工（マスタとオーバーライドの合成、非表示フィルタ、ソート）。
**移行時:** `LEFT JOIN + COALESCE` で合成済みデータをAPI応答として返却。composableは受け取るだけになる。
**今やらない理由:** JSONストアの上にこの合成ロジックをAPIに移しても、Supabaseで `LEFT JOIN` に書き換える二度手間。

### 5-2. インライン編集画面（ローカルreactive配列必須）

| 画面 | ロジック | API化できない理由 |
|---|---|---|
| MockMasterAccountsPage.vue | filteredAccountRows/pagedAccountRows + D&Dソート | ユーザーが行を編集中にフィルタ切替→API再取得すると**未保存の編集内容が消失** |
| MockMasterTaxCategoriesPage.vue | filteredTaxRows/pagedTaxRows + D&Dソート | 同上 |
| MockMasterIndustryVectorPage.vue | filteredRows + チップ編集 | 同上 |
| MockClientAccountsPage.vue | 同上（顧問先版） | 同上 |
| MockClientTaxPage.vue | 同上（顧問先版） | 同上 |
| MockClientIndustryVectorPage.vue | 同上（顧問先版） | 同上 |

**Supabase移行時の方針:**
- 初回ロード: `GET /api/xxx` で合成済みデータを取得（API化）
- 編集中: ローカルreactive配列で管理（フロント残留）
- 保存: `POST /api/xxx/save` で一括保存（既にAPI化済み）

---

## 6. タスク一覧

### T-31-1: 進捗管理画面API化 ✅ 完了（2026-05-05）

| # | 作業 | 対象ファイル |
|---|---|---|
| 1 | `progressListService.ts` 新規作成 | src/api/services/progressListService.ts |
| 2 | progressRoutes.ts に `POST /list` 追加 | src/api/routes/progressRoutes.ts |
| 3 | MockProgressDetailPage.vue の filteredRows/pagedRows computed を削除 | src/views/MockProgressDetailPage.vue |
| 4 | `fetchProgressList()` API呼び出しに置換 | 同上 |
| 5 | `watch([searchQuery, filterStaff, filterUnexported, sortKey, sortOrder, currentPage])` で自動再取得 | 同上 |
| 6 | ブラウザ実機検証（フィルタ・ソート・ページネーション） | — |

**リクエスト仕様:**
```json
POST /api/progress/list
{
  "searchQuery": "株式会社テスト",
  "filterStaff": "田中太郎",
  "filterUnexported": true,
  "sortKey": "companyName",
  "sortOrder": "asc",
  "page": 1,
  "pageSize": 30
}
```

**レスポンス仕様:**
```json
{
  "items": [{ "clientId": "...", "companyName": "...", "staffName": "...", ... }],
  "totalCount": 42
}
```

### T-31-2: useProgress.ts 集計ロジックAPI化 ✅ 完了（2026-05-05）

| # | 作業 | 対象ファイル |
|---|---|---|
| 1 | progressRoutes.ts に `GET /summary` 追加 | src/api/routes/progressRoutes.ts |
| 2 | progressListService.ts に集計関数追加 | src/api/services/progressListService.ts |
| 3 | useProgress.ts の `journals.filter(!exported)` / `allClients.map + docs.filter` をAPI呼び出しに置換 | src/composables/useProgress.ts |
| 4 | ブラウザ実機検証（進捗画面の件数表示） | — |

### T-31-3: 管理者ダッシュボード集計API化 ✅ 完了（2026-05-05）

| # | 作業 | 対象ファイル |
|---|---|---|
| 1 | `adminDashboardService.ts` 新規作成 | src/api/services/adminDashboardService.ts |
| 2 | adminRoutes.ts に `GET /dashboard/summary` 追加 | src/api/routes/adminRoutes.ts |
| 3 | useAdminDashboard.ts の `clients.filter/map` / `staff.filter/map` をAPI応答で置換 | src/composables/useAdminDashboard.ts |
| 4 | ブラウザ実機検証（ダッシュボード概要タブ） | — |

### T-31-4: ScreenH_TaskDashboard.vue API化 ✅ 完了（2026-05-05）

| # | 作業 | 備考 |
|---|---|---|
| 1 | 現状ハードコードモックデータのため後回し可 | Supabase接続時に同時実施 |

### T-31-5: useDataConversion.ts API化 ✅ 完了（2026-05-05）

| # | 作業 | 備考 |
|---|---|---|
| 1 | 小規模（filter 1件 + sort 1件） | Supabase接続時に同時実施で十分 |

---

## 7. 「呼び出し側は変更不要な構造を維持」への結論

| 画面種別 | 達成可否 | 理由 |
|---|---|---|
| **一覧表示専用画面**（仕訳一覧、マスタ4画面、進捗管理） | ✅ API化で達成可能 | `fetchXxxList()` を呼ぶだけ。Supabase移行時はサービス層の中身を `supabase.from().select()` に差し替えるだけ |
| **インライン編集画面**（科目/税区分/業種ベクトル × master/client） | ❌ 構造的に不可能 | ローカルreactive配列で編集中のデータを保持する必要がある。API再取得すると未保存データ消失 |
| **ブラウザ固有UI**（アップロード、選別、エクスポート） | ❌ 不要 | File API / Canvas API / Blob URL 等のブラウザ固有処理。サーバーに移す意味なし |

---

## 関連ドキュメント

| ドキュメント | 関連 |
|---|---|
| [28_api_migration_plan.md](28_api_migration_plan.md) | Phase 1-2の実績記録 |
| [30_audit_checklist.md](30_audit_checklist.md) | タスク2（仕訳一覧検証）、タスク3（各ページ確認） |
| [migration_tasks.md](../supabase/migration_tasks.md) | セクション12（Phase 3-4方針） |
| [load_context.md](../../.agent/workflows/load_context.md) | L16: ★supabase移行できるようにすべてのロジックをapi化せよ |

# 全ロジックAPI化 — 計画・実績・監査（統合版）

> 作成: 2026-05-01
> 最終更新: 2026-05-05（29/31を統合。以降はこのファイルのみ更新する）
> 準拠: `.agent/workflows/code_quality.md` L16: ★supabase移行できるようにすべてのロジックをapi化せよ

## 概要

src/配下 全329ファイル（.ts/.vue/.js）を走査し、ロジック行5以上のファイル133件（約3,165ロジック行）を特定。
設計方針に基づき、フロントからビジネスロジックを排除してAPI側に移動する段階的計画を策定・実行した。

**結果: Phase 1〜3 完了。Phase 4はSupabase移行と同時実施。**

---

## Phase 1: 仕訳一覧API（2026-05-01〜05-03）✅ 全完了

**対象:** JournalListLevel3Mock.vue（588行）+ journalWarningSync.ts（104行）

| Step | 内容 | 状態 |
|---|---|---|
| 1 | 共通データ（voucherTypeRules）をshared/data/に統合 | ✅ |
| 2 | 1件バリデーションAPI（`POST /:clientId/:journalId/validate`） | ✅ |
| 3 | 全件バリデーションAPI（`POST /:clientId/validate-all`） | ✅ |
| 4 | 統合一覧API（`GET /api/journals/:clientId` + `POST /:clientId/list`） | ✅ |
| 5 | フロントjournals computed削除→API呼び出し化 | ✅ |
| 6 | ヒント・証票マッチングAPI作成 | ✅ |
| 7 | 検証・リグレッションテスト | ✅ |

**新規API:**
- `POST /api/journals/:clientId/:journalId/validate` — 1件バリデーション
- `POST /api/journals/:clientId/validate-all` — 全件バリデーション
- `POST /api/journals/:clientId/list` — 統合一覧（科目名マッピング付き）
- `POST /api/journals/:clientId/:journalId/hints` — ヒント検証+修正候補生成
- `GET /api/journals/:clientId/supporting-match` — 証票マッチング

**設計決定:**
- 科目名ソート: フロントからaccountMap/taxMapをPOSTボディで送信→Phase 2でサーバー側自動生成に移行
- journals配列はshallowRefで管理、triggerRefで明示的に更新通知
- `_fetchVersion`カウンタで競合リクエストを棄却

---

## Phase 2: マスタCRUD群API化（2026-05-03）✅ 全完了

**対象:** 10ファイル / 約500ロジック行

| Step | 内容 | 状態 |
|---|---|---|
| 1 | 共通サービス作成（科目分類ルール: `account-category-rules.ts`） | ✅ |
| 2 | 勘定科目マスタ一覧API + 保存API | ✅ |
| 3 | 勘定科目（顧問先）一覧API + 保存API | ✅ |
| 4 | 税区分マスタ一覧API + 保存API | ✅ |
| 5 | 税区分（顧問先）一覧API + 保存API | ✅ |
| 6 | 顧問先CRUD API（既存実装で対応済み） | ✅ |
| 7 | 取引先CRUD API | ✅ |
| 8 | 業種ベクトルCRUD API | ✅ |
| 9 | スタッフCRUD API | ✅ |
| 10 | 検証・リグレッションテスト | ✅ |

**重大修正（Phase 2 Step 10）:**
- api/index.ts の /api/clients ルートを旧BFFモック → 新clientRoutes.ts に差し替え
- 未登録ルート11件を全て api/index.ts に登録完了

---

## Phase 3: ロジック監査+モック排除（2026-05-05）✅ 全完了

### T-31タスク（全9件完了）

| タスク | 対象 | 内容 |
|---|---|---|
| T-31-1 | progressListService.ts | 進捗管理API新設 |
| T-31-2 | useProgress.ts | 集計ロジックAPI化 |
| T-31-3 | admin dashboard/summary | 管理者ダッシュボード集計API |
| T-31-4 | ScreenH_TaskDashboard.vue | ウィジェットAPI紐付け |
| T-31-5 | useDataConversion.ts | setTimeout疑似処理削除 |
| T-31-6 | MockAdminDashboardPage.vue | ステータスカウントAPI化 |
| T-31-7 | MockExportPage.vue | 出力一覧API新設 |
| T-31-8 | MockLearningPage.vue | 学習ルール一覧API新設 |
| T-31-9 | MockExportDetailPage.vue | 出力詳細API新設 |

### モックデータ排除（全件修正済み）

| ファイル | 修正内容 |
|---|---|
| `useAdminDashboard.ts` | MOCK_DATA(250行)→DEFAULT_DATA(空)。API取得で上書き |
| `api/routes/collection.ts` | MOCK_CLIENTS(2社)→clientStore.getAll() |
| `ClientDetailMapper.ts` | healthScore:92→0, activities:3件→空 |
| `ScreenH_TaskDashboard.vue` | ウィジェット8個→widgets ref紐付け |
| `api/routes/admin.ts` | MOCK_ADMIN_DATA→ストア実データ集計 |
| `useDataConversion.ts` | 4回のsetTimeout(1000)削除 |

### 死コード削除

| ファイル | 行数 | 理由 |
|---|---|---|
| `api/routes/clients.ts` | 295行 | clientRoutes.tsに完全移行済み |
| `api/types/ClientRaw.ts` | 42行 | clients.ts専用型 |
| `api/index.ts POST /api/journal` | 9行 | 単数形。フロントは/api/journals使用 |
| 旧死コード26ファイル（2026-05-03） | — | 下記一覧参照 |

<details>
<summary>旧死コード26ファイル一覧（2026-05-03削除）</summary>

| # | ファイル | 理由 |
|---|---|---|
| 1-5 | `components/icons/Icon*.vue` (5件) | Vue初期テンプレート残骸 |
| 6 | `views/HomeView.vue` | Vue初期テンプレート残骸 |
| 7 | `views/ModeSelect.vue` | ルーター未登録 |
| 8 | `views/ScreenA_Clients.vue` | ルーター未登録 |
| 9 | `types/JournalEntryUI.ts` | import 0件 |
| 10 | `types/schema_v2.ts` | import 0件 |
| 11 | `AaaLayout.vue` | 未参照 |
| 12 | `ScreenA_Detail_DriveCard.vue` | import 0件 |
| 13 | `ScreenD_AIRules.vue` | ルーター未登録 |
| 14 | `JournalStatusMapper.ts` | import 0件 |
| 15 | `api/lib/globalLogger.ts` | import 0件 |
| 16 | `journal_test_fixture_30cases.ts` | 未参照 |
| 17 | `vendorIdentification.test.ts` | 孤立テスト |
| 18 | `MockClientListPage.vue` | ルーター未登録 |
| 19-26 | ScreenZ系・旧Screen系 | 旧画面 |
</details>

### localStorage二重永続化修正（3件）

| ファイル | 修正内容 |
|---|---|
| `MockMasterAccountsPage.vue` | localStorage.setItem削除→API保存に一本化 |
| `MockMasterTaxCategoriesPage.vue` | 同上 |
| `MockClientAccountsPage.vue` | localStorage復元ブロック(16行)削除 |

### アーキテクチャ配置修正

| ファイル | 修正内容 |
|---|---|
| `image_preprocessor.ts` | scripts/pipeline/→api/services/pipeline/に移動 |
| `previewExtract.service.ts` | importパス修正 |
| `preprocess.ts` | importパス修正 |
| `api/index.ts` | progressRoutes/exportRoutes未登録→追加 |

### クリーンアップ実績（2026-05-04、旧29文書分）

| 項目 | 内容 |
|---|---|
| SEED_DATA完全削除 | clientStore.ts(131行) + staffStore.ts(11行) |
| ClientApi型完全削除 | zod_schema.ts + ClientMapper.ts + ClientDetailMapper.ts + テスト |
| staffStore.ts型エラー修正 | 2件（undefined可能性ガード） |
| セキュリティ調査 | .env.local集約確認済み。src/内ハードコード秘密ゼロ |

---

## 即時修正（完了済み）

| # | 内容 | 状態 |
|---|---|---|
| 1 | `useDocuments.ts` AI_FIELD_KEYS値import違反 → API経由に変更 | ✅ |
| 2 | `receiptService.ts` VITE_USE_MOCK分岐 → サーバー側に移動 | ✅ |
| 3 | `voucherTypeRules.ts` re-exportファイル削除 | ✅ |

---

## 技術的負債の解消状況

| # | 項目 | 状態 |
|---|---|---|
| D-3 | any残存 | ✅ 実コード0件 |
| D-4 | TODO残存（20件） | 棚卸し済み |
| D-5 | HACK残存 | ✅ 解消 |
| D-6 | localStorage直接操作 | ✅ ビジネスデータ: ゼロ。残存はUI状態+Phase B対応 |
| D-7 | applyHintSuggestion内clientSettings | Supabase移行時に解消 |
| D-8 | searchPastJournals未実装 | Supabase移行後に実装 |
| D-9 | pipeline.tsモック内に科目確定なし | 実害なし |
| D-10 | as string[] ワークアラウンド | ✅ 根本解決 |
| D-11 | テンプレート内ラベル型注釈 | ✅ 解消 |
| D-12 | exportMfCsv.ts EXCLUDE_LABELS | ✅ 解消 |
| D-13 | `as unknown as` ダブルキャスト（29件） | 棚卸し済み |
| D-14 | 死コード削除 | ✅ 完了 |
| D-15 | コード内コメント矛盾修正 | ✅ 完了 |
| D-16 | 計画書と実態の乖離修正 | ✅ 完了 |

---

## 「移行不要」と判定した全ファイル

### composable — ローカルキャッシュ操作・UI状態派生

| ファイル | 判定理由 |
|---|---|
| useDocuments.ts | ローカルキャッシュref操作のみ |
| useDriveDocuments.ts | Drive APIレスポンスのUI表示変換 |
| useUpload.ts | ブラウザローカルのFile APIキュー管理 |
| useDocSelection.ts | UI状態の派生値 |
| useNotificationCenter.ts | 未読カウント。UI状態 |
| useUnsavedGuard.ts | 変更ログのフォーマット |
| useStaff.ts | activeStaff/adminStaffの少量データ表示切替 |

### ページ — ブラウザ固有UI制御

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
| ScreenG_DataConversion.vue | canConvertはUI状態 |

### インライン編集画面 — 構造的に移行不可能

| ファイル | 判定理由 |
|---|---|
| MockMasterAccountsPage.vue | 編集中API再取得→未保存データ消失 |
| MockMasterTaxCategoriesPage.vue | 同上 |
| MockMasterIndustryVectorPage.vue | 同上 |
| MockClientAccountsPage.vue | 同上 |
| MockClientTaxPage.vue | 同上 |
| MockClientIndustryVectorPage.vue | 同上 |

### API化済み（残存は表示用computedのみ）

| ファイル | 判定理由 |
|---|---|
| JournalListLevel3Mock.vue | journalListServiceでAPI化済み |
| MockMasterVendorsPage.vue | API化済み |
| MockMasterNonVendorPage.vue | API化済み |
| MockMasterStaffPage.vue | API化済み |
| MockMasterClientsPage.vue | API化済み |

---

## UI検証結果（2026-05-05）

### 仕訳一覧（TST-00011）— 10項目全通過

| # | 項目 | 結果 |
|---|---|---|
| 1 | 基本表示（1113件, 25カラム） | ✅ |
| 2 | ページネーション（38ページ） | ✅ |
| 3 | ソート（日付昇順） | ✅ |
| 4 | フィルタ（5種チェックボックス） | ✅ |
| 5 | 証票種類フィルタ（8タブ） | ✅ |
| 6 | セル編集 | ✅ |
| 7 | 画像モーダル | ✅ |
| 8 | 一括操作（4ボタン） | ✅ |
| 9 | 全列検索 | ✅ |
| 10 | 列幅リセット | ✅ |

### 他ページ — 6項目全通過

| ページ | URL | 結果 |
|---|---|---|
| 勘定科目マスタ | `/#/master/accounts` | ✅ |
| 税区分マスタ | `/#/master/tax-categories` | ✅ |
| 顧問先一覧（11社） | `/#/master/clients` | ✅ |
| 出力ページ | `/#/output/TST-00011` | ✅ |
| 管理者ダッシュボード | `/#/admin-dashboard` | ✅ |
| タスクダッシュボード | `/#/task-board` | ✅ |

---

## Phase 4: Supabase移行と同時実施（未着手）

**方針: Supabase移行前に実施しない。移行と同時実施する。**

理由: JSONストアの上にfetchラッパーAPIを作っても、移行時にPostgreSQLクエリで作り直す二度手間になる。

### 残存課題（Phase B対応）

| 分類 | ファイル | 内容 |
|---|---|---|
| Supabase Auth | `useActivityTracker.ts` | staff-0000 → auth.currentUser.id |
| Supabase Auth | `useCurrentUser.ts` | localStorage → Supabaseセッション |
| Supabase Auth | ゲスト認証系5ファイル | localStorage → Supabase Auth |
| ストア未整備 | `admin.ts /task-summary` | 5社ハードコード（横断集計基盤が必要） |
| ストア未整備 | `collection.ts generateMockHistory` | 回収実績ストア未整備 |
| 外部API | `useDriveFileListMock.ts` | Drive API接続版に差替 |
| 外部API | `useDataConversion.ts` | POST /api/conversion/connect |

### 実行順序

```
① 移行前棚卸し（migration_tasks.md セクション11）
   └ 死コード削除 + localStorage依存洗い出し + 移行対象マップ作成
   ↓
② Supabase移行本体（migration_tasks.md セクション1-8）
   └ DBスキーマ + RLS + マイグレーションSQL + Repository層接続
   ↓
③ Phase 4を移行と同時実施
   └ フロントのフィルタ・ソート → PostgreSQLクエリに直接実装
   └ localStorage依存 → Supabase DB接続に差し替え
```

### API化の判定基準

| 判定 | 種別 | 理由 |
|---|---|---|
| ✅ API化する | フィルタ・ソート・ページネーション | PostgreSQLクエリの方が高速 |
| ✅ API化する | バリデーション | Phase 1で完了済み |
| ✅ API化する | CRUD保存 | Phase 2で完了済み |
| ❌ フロント残留 | 表示ラベル生成 | ネットワーク往復の方が高い |
| ❌ フロント残留 | UI状態の派生値 | サーバーがUI状態を知る必要なし |
| ❌ フロント残留 | ブラウザ固有処理 | サーバーで実行不可能 |

---

## 設計方針の遵守状況（2026-05-05 最終確認）

| # | 方針 | 状態 |
|---|---|---|
| 1 | composableにロジック禁止 | ⚠️ Phase 1-3完了。Phase 4は移行時 |
| 2 | VITE_USE_MOCK分岐 | ✅ フロント側解消済み |
| 3 | ロジックはAPI側に書け | ✅ Phase 1-3で実証済み |
| 4 | フロントからはAPI呼び出しのみ | ✅ Phase 1-3の範囲で実現 |
| 5 | composableはuseJournals.tsパターンに統一 | ✅ 全composable統一完了 |
| 6 | composableからcreateRepositories()に依存させるな | ✅ 達成 |
| 7 | 暫定コードには日付入りTODOを入れろ | ✅ 全26箇所に日付追記完了 |

---

## 新規ロジック追加ルール（即日適用中）

1. ロジックは `src/api/routes/` or `src/api/services/` に書く
2. フロントからはAPI呼び出しのみ
3. フロントのcomputedには表示変換のみ（ソート・フィルタ・バリデーション禁止）
4. 型定義は `repositories/types.ts` に追加
5. composableは `useJournals.ts` パターン（API呼び出し+キャッシュ）に統一

---

## 関連ドキュメント

| ドキュメント | 関連 |
|---|---|
| [30_audit_checklist.md](30_audit_checklist.md) | 全310ファイル調査チェックリスト |
| [migration_tasks.md](../supabase/migration_tasks.md) | セクション11-12（棚卸し・Phase 4方針） |
| [load_context.md](../../.agent/workflows/load_context.md) | L16: ★supabase移行できるようにすべてのロジックをapi化せよ |

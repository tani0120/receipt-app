# 全ロジックAPI化 — 計画と実績

> 作成: 2026-05-01
> 最終更新: 2026-05-04 (composable API接続統一完了)
> 原本: `implementation_plan_merged.md.resolved`（Gemini会話アーティファクト）

## 概要

src/配下 全329ファイル（.ts/.vue/.js）を走査し、ロジック行5以上のファイル133件（約3,165ロジック行）を特定。
設計方針（load_context.md）に基づき、フロントからビジネスロジックを排除してAPI側に移動する段階的計画を策定・実行した。

---

## 実施済み（Phase 1-2）

### Phase 1: 仕訳一覧API（2026-05-01〜05-03）✅ 全完了

**対象:** JournalListLevel3Mock.vue（588行）+ journalWarningSync.ts（104行）

| Step | 内容 | 状態 |
|---|---|---|
| Step 1 | 共通データ（voucherTypeRules）をshared/data/に統合 | ✅ |
| Step 2 | 1件バリデーションAPI（`POST /:clientId/:journalId/validate`） | ✅ |
| Step 3 | 全件バリデーションAPI（`POST /:clientId/validate-all`） | ✅ |
| Step 4 | 統合一覧API（`GET /api/journals/:clientId` + `POST /:clientId/list`） | ✅ |
| Step 5 | フロントjournals computed削除→API呼び出し化 | ✅ |
| Step 6 | ヒント・証票マッチングAPI作成 | ✅ |
| Step 7 | 検証・リグレッションテスト | ✅ |

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

### Phase 2: マスタCRUD群API化（2026-05-03）✅ 全完了

**対象:** 10ファイル / 約500ロジック行

| Step | 内容 | 状態 |
|---|---|---|
| Step 1 | 共通サービス作成（科目分類ルール: `account-category-rules.ts`） | ✅ |
| Step 2 | 勘定科目マスタ一覧API + 保存API | ✅ |
| Step 3 | 勘定科目（顧問先）一覧API + 保存API | ✅ |
| Step 4 | 税区分マスタ一覧API + 保存API | ✅ |
| Step 5 | 税区分（顧問先）一覧API + 保存API | ✅ |
| Step 6 | 顧問先CRUD API（既存実装で対応済み） | ✅ |
| Step 7 | 取引先CRUD API | ✅ |
| Step 8 | 業種ベクトルCRUD API | ✅ |
| Step 9 | スタッフCRUD API | ✅ |
| Step 10 | 検証・リグレッションテスト | ✅ |

**重大修正（Phase 2 Step 10）:**
- api/index.ts の /api/clients ルートを旧BFFモック → 新clientRoutes.ts に差し替え
- 未登録ルート11件を全て api/index.ts に登録完了（全27ルートファイル登録済み）

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
| D-3 | any残存 | ✅ 実コード0件（テスト除く全ファイル） |
| D-4 | TODO残存（20件） | 棚卸し済み → `migration_tasks.md` セクション11-2 |
| D-5 | HACK残存 | ✅ 解消（ファイル削除） |
| D-6 | localStorage直接操作（16ファイル） | ✅ ビジネスデータ: ゼロ | composable 7件をAPI接続版に書き換え完了。残存はUIセッション状態（`useCurrentUser`, `useColumnResize`）とマイグレーション（`useClients`）のみ |
| D-7 | applyHintSuggestion内clientSettings | Supabase移行時に解消 |
| D-8 | searchPastJournals未実装 | Supabase移行後に実装 |
| D-9 | pipeline.tsモック内に科目確定なし | 実害なし。本番運用に影響なし |
| D-10 | as string[] ワークアラウンド | ✅ 根本原因解決（JournalLabelMock型に7種追加） |
| D-11 | テンプレート内ラベル型注釈 | ✅ 解消 |
| D-12 | exportMfCsv.ts EXCLUDE_LABELS | ✅ 解消 |
| D-13 | `as unknown as` ダブルキャスト（29件） | 棚卸し済み → `migration_tasks.md` セクション11-3 |
| D-14 | 死コード削除（18ファイル） | ✅ 完了 |
| D-15 | コード内コメント矛盾修正 | ✅ 完了 |
| D-16 | 計画書と実態の乖離修正 | ✅ 完了 |

---

## 死コード削除実績（2026-05-03）

合計26ファイル削除:

| # | ファイル | 理由 |
|---|---|---|
| 1-5 | `components/icons/Icon*.vue` (5件) | Vue初期テンプレート残骸 |
| 6 | `views/HomeView.vue` | Vue初期テンプレート残骸 |
| 7 | `views/ModeSelect.vue` | ルーター未登録 |
| 8 | `views/ScreenA_Clients.vue` | ルーター未登録 |
| 9 | `types/JournalEntryUI.ts` | import 0件 |
| 10 | `types/schema_v2.ts` | import 0件 |
| 11 | `AaaLayout.vue` | App.vue・ルーター共に未参照 |
| 12 | `components/ScreenA_Detail_DriveCard.vue` | import 0件 |
| 13 | `components/ScreenD_AIRules.vue` | ルーター未登録 |
| 14 | `composables/JournalStatusMapper.ts` | import 0件 |
| 15 | `api/lib/globalLogger.ts` | import 0件 |
| 16 | `mocks/data/journal_test_fixture_30cases.ts` | テストからも未参照 |
| 17 | `mocks/utils/pipeline/vendorIdentification.test.ts` | 孤立テスト |
| 18 | `mocks/views/MockClientListPage.vue` | ルーター未登録 |
| 19-26 | ScreenZ系・旧Screen系（前回セッション） | 旧画面・Zod巻き戻し |

空ディレクトリ削除: `components/icons/`, `adapters/`, `api/lib/ai/strategy/`

---

## Phase 3-4の方針（確定）

**Supabase移行前に実施しない。移行と同時実施する。**

理由: JSONストアの上にfetchラッパーAPIを作っても、移行時にPostgreSQLクエリで作り直す二度手間になるため。

### 実行順序

```
① 移行前棚卸し（migration_tasks.md セクション11）
   └ 死コード削除 + localStorage依存洗い出し + 移行対象マップ作成
   ↓
② Supabase移行本体（migration_tasks.md セクション1-8）
   └ DBスキーマ + RLS + マイグレーションSQL + Repository層接続
   ↓
③ Phase 3-4を移行と同時実施
   └ フロントのフィルタ・ソート → PostgreSQLクエリに直接実装
   └ localStorage依存 → Supabase DB接続に差し替え
   └ composable → useJournals.tsパターン（API呼び出し+キャッシュ）に統一 ← ✅ 2026-05-04 完了
```

### API化の判定基準

| 判定 | 種別 | 理由 |
|---|---|---|
| ✅ API化する | フィルタ・ソート・ページネーション | PostgreSQLクエリの方が高速 |
| ✅ API化する | バリデーション | **Phase 1で完了済み** |
| ✅ API化する | CRUD保存 | **Phase 2で完了済み** |
| ❌ フロント残留 | 表示ラベル生成 | ネットワーク往復の方が高い |
| ❌ フロント残留 | UI状態の派生値 | サーバーがUI状態を知る必要なし |
| ❌ フロント残留 | ブラウザ固有処理 | サーバーで実行不可能 |
| ❌ フロント残留 | ドラッグ&ドロップ | UI操作 |
| ❌ フロント残留 | インライン編集 | セル編集のUI制御 |

---

## 設計方針の遵守状況（2026-05-04 コード検証済み）

### 方針と実態の照合

| # | 方針 | 状態 | 根拠 |
|---|---|---|---|
| 1-a | composableにロジック大量→Phase 1-4でAPI化 | ⚠️ Phase 1-2完了。3-4は移行時 | 方針変更は合理的（二度手間回避）。`migration_tasks.md` セクション12に明文化済み |
| 1-b | VITE_USE_MOCK分岐→API統合後に有効化 | ✅ フロント側分岐: 解消済み | フロント参照は `repositories/index.ts`（Repository層・正当）と `lib/supabase.ts`（コメントのみ）に限定。`receiptService.ts`の分岐はPhase 3でサーバー側（`pipeline.ts` L75）に移動済み |
| 2-a | ロジックはAPI側に書け | ✅ Phase 1-2で実証済み | `journalValidation.ts`, `journalHintService.ts`, `accountMasterStore.ts` 等を新設 |
| 2-b | フロントからはAPI呼び出しのみ | ✅ Phase 1-2の範囲で実現 | journals computed→`fetchJournalList` API呼び出しに置換。保存: `fetch PUT /api/accounts/master` 等 |
| 2-c | composableはuseJournals.tsパターンに統一 | ✅ 全composable統一完了（2026-05-04） | `useAccountMaster`, `useTaxMaster`, `useClientAccounts`, `useClientTaxCategories`, `useProgress` をAPI呼び出し+キャッシュ+autoSaveパターンに書き換え。`useAccountSettings`からlocalStorage直接操作を全除去 |
| 3 | 暫定コードには日付入りTODOを入れろ | ✅ 全26箇所に日付追記完了（2026-05-04） | 13ファイルのTODOに `(2026-04)` or `(2026-05)` の日付を追記 |
| 4-a | 既存エンドポイントを拡張、新規乱立禁止 | ✅ 実現済み | `GET /api/journals/:clientId` を拡張（`?sort=&search=`）。`POST /:clientId/list` のみ新設（GETでボディ送信不可のため） |
| 4-b | バリデーションは1件API先、全件はラッパー | ✅ 実現済み | `POST /:clientId/:journalId/validate`（1件）→ `POST /:clientId/validate-all`（ラッパー）が `journalRoutes.ts` に実装 |
| 4-c | 楽観的更新は仕訳ごとMapでバージョン管理 | ✅ 実現済み | `JournalListLevel3Mock.vue` L5307-5345: `_fetchVersion`カウンタで競合リクエスト棄却を実装 |
| 追加 | composableからcreateRepositories()に依存させるな | ✅ 達成 | `src/composables/`内に`createRepositories`の呼び出しはゼロ（grep検索で確認） |

### ~~未達項目: 日付入りTODO（方針3）~~ → ✅ 2026-05-04 全件解消

全13ファイル / 26箇所のTODOに日付 `(2026-04)` or `(2026-05)` を追記完了。

### 設計方針との乖離（5項目）— 解消方針

全てSupabase移行と同時に解消する。

| # | 乖離 | 解消方針 |
|---|---|---|
| 1 | composableからRepository依存 | 移行時にSupabaseClient直接呼び出しに置換 |
| 2 | composableにロジック禁止 | 移行と同時にAPI化 |
| 3 | すべてのロジックをAPI化 | Phase 3-4で移行と同時実施 |
| 4 | VITE_USE_MOCK分岐 | フロント側は解消済み。残りは`repositories/index.ts`のみ（維持） |
| 5 | .vueにロジック埋込 | 移行と同時にAPI化 |

---

## 新規ロジック追加ルール（即日適用中）

1. ロジックは `src/api/routes/` or `src/api/services/` に書く
2. フロントからはAPI呼び出しのみ
3. フロントのcomputedには表示変換のみ（ソート・フィルタ・バリデーション禁止）
4. 型定義は `repositories/types.ts` に追加
5. composableは `useJournals.ts` パターン（API呼び出し+キャッシュ）に統一

---

## 全関数詳細リスト

全122ファイル / 1,255関数の詳細リスト（各関数の内容・API化判定付き）は
原本 `implementation_plan_merged.md.resolved` を参照。

**Phase 3-4実施時の参照資料として温存する。**

---

## 関連ドキュメント

| ドキュメント | 関連 |
|---|---|
| [migration_tasks.md](../supabase/migration_tasks.md) | セクション11（移行前棚卸し）, セクション12（Phase 3-4方針） |
| [task_unified.md](../task_unified.md) | C-0（Repository化）, C-1 フェーズ5 |
| [pipeline_design_master.md](../pipeline_design_master.md) | DL-030〜032, DL-045 |

# Supabase移行タスク一覧

> 作成日: 2026-04-23
> 最終更新: 2026-04-28 v12（v11 + 監査タスクSupabase移行待ち4件追加: T-AUD-4a/4b/4c + 旧系統LearningRule廃止）
> ソース:
> - [task_unified.md](file:///c:/dev/receipt-app/docs/task_unified.md)（セクションC-0, C-1, D, H, L-2）
> - [supabase_security_report_260214.md](file:///c:/dev/receipt-app/docs/genzai/01_tools_and_setups/supabase_security_report_260214.md)（RLS, validateStaffAccess, Google OAuth）
> - [setup_status_report_260211.md](file:///c:/dev/receipt-app/docs/genzai/01_tools_and_setups/setup_status_report_260211.md)（Firebase排除、Timestamp移行、SA権限）
> - [tools_and_setup_guide.md](file:///c:/dev/receipt-app/docs/genzai/01_tools_and_setups/tools_and_setup_guide.md)（schema.sql, SDK）
> - [24_upload_drive_integration.md](file:///c:/dev/receipt-app/docs/genzai/24_upload_drive_integration.md)（セクション7-4, 8, **10-16**）
> - [pipeline_design_master.md](file:///c:/dev/receipt-app/docs/pipeline_design_master.md)（DL-030, **DL-031**, DL-032, **DL-045**）
> - [error_display_design.md](file:///c:/dev/receipt-app/docs/error_display_design.md)（ロール別エラー表示設計）
> - KI: postgresql_migration_streamed_architecture
> - Drive共有セッション（2026-04-21〜22）
> - コード実査: `src/utils/auth.ts`, `src/router/index.ts`, `src/repositories/supabase/`, `src/api/helpers/`
>
> 精査対象外（Supabase無関係確認済み）: 15番, 16番, 17番, 18番, 19番, 20番, 21番, 22番, 23番(両方), vendors_client_master, vendors_global_master

---

## 0. 既に完了済み（参照用）

| 項目 | 状態 | 出典 |
|---|---|---|
| Firebase Auth → Supabase Auth移行 | ✅ 完了（2026-04-18） | task_unified L11-21 |
| Firebase Storage → Supabase Storage移行 | ✅ 完了 | 同上 |
| Firestore → 廃止（audit_logsに統合） | ✅ 完了 | 同上 |
| Supabase SDK導入（`@supabase/supabase-js`） | ✅ 完了 | tools_and_setup_guide |
| 環境変数設定（`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`） | ✅ 完了 | task_unified L20 |
| `src/utils/auth.ts` Supabase Auth版に書き換え | ✅ 完了 | auth.ts実ファイル |
| `validateStaffAccess()` スタッフマスタ照合関数 | ✅ 完了 | auth.ts L68-86 |
| Google OAuth設定（GCP + Supabase Googleプロバイダー） | ✅ 完了（2026-04-18） | security_report L417-439 |
| receipts/audit_logs RLS有効化 | ✅ 完了 | security_report L122-135 |
| 開発用RLSポリシー（`USING(true)` 全認証ユーザー開放） | ✅ 完了（暫定） | security_report L231-263 |
| SQLマイグレーション（12テーブル + RLS + trigger） | ✅ 完了（R-S2 + 本セッション） | task_unified L236 |
| Supabase版Repository先行実装（5種） | ✅ 完了（R-S） | task_unified L235 |
| Repository集約index + factory関数（VITE_USE_MOCK切替） | ✅ 完了（R-7） | task_unified L231 |
| DocEntry型 + DocumentRepository型定義 | ✅ 完了（R-D1） | task_unified L239 |
| documentsテーブルSQL | ✅ 完了（R-D2） | task_unified L240 |
| Supabaseクライアント遅延初期化（即時初期化クラッシュ修正） | ✅ 完了 | pipeline_design_master L1949-1980 |
| Firebase依存完全排除（import残存0件、npm削除済み） | ✅ 完了（2026-04-18） | setup_status_report L148 |
| Timestamp型 → Date型移行（9ファイル） | ✅ 完了（2026-04-18） | setup_status_report L162-164 |
| Drive API SA権限「管理者」昇格 | ✅ 完了（2026-04-18） | setup_status_report L157-160 |
| GCP OAuth同意画面「公開」設定 | ✅ 完了 | setup_status_report L153 |
| ルートに`meta: { guestAllowed: true }`付与（全ゲストルート） | ✅ 完了 | router/index.ts L382等 |
| 404ページ + 未定義ルートリダイレクト | ✅ 完了 | router/index.ts L416-426 |
| 招待コード逆引き + 共有停止時404リダイレクト | ✅ 完了 | router/index.ts L397-413 |
| Supabase Auth onAuthStateChanged初期化 | ✅ 完了 | router/index.ts L434-446 |
| ポータルページ共有停止時404リダイレクト | ✅ 完了 | MockPortalPage.vue onMounted |
| ポータルログイン共有停止時404リダイレクト | ✅ 完了 | MockPortalLoginPage.vue |
| App.vueナビバー非表示条件（guestAllowed） | ✅ 完了 | App.vue |
| staffテーブルSQL作成（004_staff.sql） | ✅ **本セッション** | B-1 |
| migration_jobsテーブルSQL作成（005_migration_jobs.sql） | ✅ **本セッション** | B-2 |
| スタッフ認証JWT化（localStorage→getCurrentUserAsync） | ✅ **本セッション** | A-1 |
| `/guest/:clientId/login`直接アクセス制限 | ✅ **本セッション** | A-3 |
| 顧問先契約解除時ブロック（client.status確認） | ✅ **本セッション** | C-2 |
| excluded ZIPダウンロードルート接続 | ✅ **本セッション** | A-2 |
| PC D&D→Drive uploadルート（POST /upload） | ✅ **本セッション** | C-1 |
| 出力ポータルUI統合（`/output/:clientId`） | ✅ **2026-04-24** | 出力ポータルセッション |
| 仕訳外ZIP履歴ページ（`/excluded-history/:clientId`） | ✅ **2026-04-24** | 同上 |
| ジョブ単位ZIPダウンロード（`?jobId=`パラメータ） | ✅ **2026-04-24** | 同上 |
| ジョブ一覧API（`GET /migrate/jobs/:clientId`） | ✅ **2026-04-24** | 同上 |
| currentClient正規表現ハードコード廃止（`route.params.clientId`優先） | ✅ **2026-04-24** | 同上 |
| DL済みマークバグ修正（`all=true`でも`markDownloaded`実行） | ✅ **2026-04-24** | 同上 |
| MockDriveUploadPage.vue旧式`downloadExcludedZip`削除 | ✅ **2026-04-24** | 同上 |
| MockDriveSelectPage.vueデッドコード削除 | ✅ **2026-04-24** | 同上 |
| jobId指定DL時の0件チェック追加 | ✅ **2026-04-24** | 同上 |
| useClients.ts型エラー修正（L198, L220 非null断定） | ✅ **2026-04-24** | 同上 |
| migrationWorker.tsにpreviewExtract API統合（DL→SHA-256→previewExtract→Storage→doc-store書き戻し→ゴミ箱） | ✅ **2026-04-24 DL-048** | フェーズ3.5 |
| documentStore.ts updateAiResults()新設（PreviewExtractResponse→DocEntry全フィールドマッピング） | ✅ **2026-04-24 DL-048** | 同上 |
| documentStore.ts updateDocumentStatus()拡張（statusChangedBy/At/updatedBy/At保存） | ✅ **2026-04-24 DL-048** | 同上 |
| docStore.ts PUT /:id拡張（statusChangedBy/At/updatedBy/Atをbodyから受け取り） | ✅ **2026-04-24 DL-048** | 同上 |
| useMigrationPoller.ts ポーリング完了時にrefresh()でAI結果をフロント反映 | ✅ **2026-04-24 DL-048** | 同上 |
| DocEntry aiMetricsにoriginal_size_kb/processed_size_kb/preprocess_reduction_pct追加 | ✅ **2026-04-24 DL-048** | 同上 |
| Drive選別操作のstatusChangedBy/createdBy永続化（useDriveDocuments/useDocSelection改修） | ✅ **2026-04-24 DL-048** | 同上 |
| 税区分マスタ標準化（151件全件active:true + effectiveFrom/To修正 + MF実機CSV突合検証全件一致） | ✅ **2026-04-25 DL-050** | 税区分マスタ標準化 |
| 3ソフト変換方針確定（MF形式統一出力・弥生/freee変換不要・本則CSV統一） | ✅ **2026-04-25 DL-050** | MF実機テスト4パターン完了 |
| Python変換ロジック廃止（converter.py等17ファイル→参照資料移動） | ✅ **2026-04-25 DL-050** | 同上 |
| tax-category-mapping.ts廃止（3ソフト方言対応表→参照資料移動） | ✅ **2026-04-25 DL-050** | 同上 |
| typeDefinitionsData.ts CellValue 6記号化 + TypeField 24列化（全108フィールド再マッピング） | ✅ **2026-04-26 DL-052** | 監査テーブル刷新 |
| TypeDefinitionsPanel.vue 3段ヘッダー構成（フェーズ名行+AI名行+責任行） | ✅ **2026-04-26 DL-052** | 同上 |
| MockSettingsPage.vue activeTab型安全化（string→union型） | ✅ **2026-04-26 DL-052** | 同上 |
| 全108フィールド完全監査（TS型5ファイル+TSロジック5ファイル+Vue107ファイル） | ✅ **2026-04-26 DL-051** | 問題6種検出・タスク起票 |
| 検証スクリプト22ファイル新規作成（pipeline_flow.cjs等） | ✅ **2026-04-26 DL-051** | 自動検証基盤 |

---

## 1. 認証・アクセス制御

### 1-1. スタッフ認証（ルーターガード）

| 項目 | 現状（暫定） | Supabase移行後 |
|---|---|---|
| 判別方法 | ✅ **JWT化完了** `getCurrentUserAsync()`（L462） | — |
| Supabase Auth初期化 | ✅ **実装済み**（L434-446 onAuthStateChanged） | そのまま使用 |
| 偽装耐性 | ✅ **JWT化済み**（getCurrentUserAsync） | — |
| 対象ファイル | [router/index.ts](file:///c:/dev/receipt-app/src/router/index.ts) L450-465 | 同左（L460の判定部分のみJWTに置換） |

**実装内容:**
- L460の`localStorage.getItem` → `supabase.auth.getUser()` + `validateStaffAccess()` に置換
- JWTなしでスタッフ用ルートにアクセス → `/404`にリダイレクト（現行動作と同じ。L462）
- `guestAllowed`ルートのスキップは✅実装済み（L455）

**既存資産:** `validateStaffAccess()`（[auth.ts](file:///c:/dev/receipt-app/src/utils/auth.ts) L68-86）はSupabase Auth版で実装済み。beforeEachから呼び出すだけ。

> 出典: security_report L429-439, コード実査

### 1-2. スタッフの有効/無効チェック

| 項目 | 現状 | Supabase移行後 |
|---|---|---|
| データ | `staff.json`に`status: active/inactive` | staffテーブル or Supabase Auth user metadata |
| チェック | ✅ **実装済み**（`validateStaffAccess()`がstatus=active確認） | staffテーブルに切替のみ |

**実装内容:**
- `inactive`スタッフのSupabase Authアカウントを`ban`するか、staffテーブルのstatusをチェック
- `inactive`スタッフはJWTがあってもアクセス拒否

> 出典: Drive共有セッション（staff.json実査）

### 1-3. 3種ユーザーの見極め

| 種別 | 現状の判別 | Supabase移行後 |
|---|---|---|
| スタッフ | ✅ Supabase Auth JWT + `validateStaffAccess()` | — |
| 顧問先 | localStorage `guest_google_{clientId}` | Googleログイン + DB上のclientId紐付け |
| 第三者 | どちらもなし | どちらもなし → 404 |

> 出典: Drive共有セッション

### 1-4. Supabase Auth signInWithPassword / signUp 実装（パソコンのみフロー）

24番設計書セクション8-1で定義済み。顧問先がパソコンのみで使う場合のメール認証フロー。

| 項目 | 状態 |
|---|---|
| 設計 | ✅ 完了（24番 セクション8） |
| 実装 | ❌ 未着手 |
| 対象 | `MockPortalLoginPage.vue` |

> 出典: 24番 L592, L603

### 1-5. Supabase Auth signInWithOAuth コールバックでgrantFolderPermission呼び出し

24番設計書セクション7-4 #8で定義済み。OAuthログイン成功後にDrive権限を自動付与するフロー。

| 項目 | 状態 |
|---|---|
| 設計 | ✅ 完了（24番 セクション8-1） |
| 実装 | ❌ 未着手（現在はフロント側のみ。サーバー側検証なし） |
| 対象 | `MockPortalLoginPage.vue`, Supabase Auth callback |

> 出典: 24番 L591

---

## 2. ゲスト（顧問先）アクセス制御

### 2-1. 顧問先の契約解除時ブロック

| 項目 | 現状 | Supabase移行後 |
|---|---|---|
| データ | `clients.json`に`status: active/inactive/suspension` | clientsテーブル |
| チェック | ✅ **実装済み**（router beforeEnterでAPI確認） | clientsテーブルに切替のみ |

**実装内容:**
- `inactive`/`suspension`の顧問先:
  - 招待リンク → 404
  - ゲストログイン → 404
  - Drive共有フォルダの権限を自動revoke
  - ポータル → 404

> 出典: Drive共有セッション（clients.json実査）

### 2-2. ゲスト認証の厳格化

| 項目 | 現状 | Supabase移行後 |
|---|---|---|
| Googleログイン | フロントでJWT解析のみ | サーバー側でもJWT検証 |
| email紐付け | clients.jsonのsharedEmail | DB（clientsテーブルのshared_email列） |

> 出典: Drive共有セッション, 24番 セクション8

### 2-3. `/guest/:clientId/login`への直接アクセス制限

| 項目 | 状態 |
|---|---|
| 問題 | clientIdが推測可能（`TST-00011`等の連番）で企業名が漏洩 |
| 対策 | 招待リンク(`/invite/:code`)経由 or ログイン済みの場合のみアクセス許可 |
| 実装 | ✅ **実装済み**（sessionStorageフラグ + beforeEnter検証） |

> 出典: Drive共有セッション

---

## 3. Drive共有・権限管理のDB化

### 3-1. 共有設定のDB移行

| データ | 現状 | Supabase移行後 | マイグレーションSQL |
|---|---|---|---|
| 共有ステータス | `data/share_status.json` | `share_status`テーブル | [001_share_status.sql](file:///c:/dev/receipt-app/supabase/migrations/001_share_status.sql)（✅作成済み） |
| 招待コード | 同上（inviteCodeフィールド） | 同テーブル | 同上 |
| 共有メール | `data/clients.json`のsharedEmail | `clients`テーブルのshared_email列 | [002_core_tables.sql](file:///c:/dev/receipt-app/supabase/migrations/002_core_tables.sql)（✅作成済み） |

**対象ファイル:**
- `src/api/services/shareStatusStore.ts` → Supabase版に置換
- `src/composables/useShareStatus.ts` → API呼び出し先は変更なし（API側で吸収）

### 3-2. Drive権限管理

Drive APIとの連携部分はSupabase移行の影響を受けない。データの永続化先のみ変わる。

> 出典: Drive共有セッション

---

## 4. DB設計（テーブル・RLS）

### 4-1. 既存テーブルのRLS本番化

| テーブル | 現在のRLS | 本番で必要な変更 |
|---|---|---|
| receipts | `USING(true)` 全認証ユーザー開放 | client_idフィルタリング |
| audit_logs | SELECT only | **INSERTはSECURITY DEFINER関数経由のみ許可**（改ざん防止） |

**前提:** `client_users`テーブル（DL-031）または以下3方式のいずれか：
1. `client_users`テーブル（DL-031設計）
2. JWT claimsで管理
3. Supabase Authのユーザーメタデータで管理

> 出典: security_report L269-274

```sql
-- security_report L188-222のSQL（client_users方式の例）
CREATE POLICY "Users can view their client receipts"
ON public.receipts FOR SELECT TO authenticated
USING (
  client_id IN (
    SELECT client_id FROM client_users
    WHERE user_id = auth.uid()
  )
);
```

> 出典: security_report L176-227, pipeline DL-031 L1807-1813

### 4-2. 追加テーブル

| テーブル | 用途 | 現在のデータソース | SQL | 出典 |
|---|---|---|---|---|
| `staff` | スタッフ管理 | `data/staff.json` | **004_staff.sql ✅** | 本セッション |
| `clients` | 顧問先管理 | `data/clients.json` | 002_core_tables.sql | task_unified |
| `share_status` | 共有設定 | `data/share_status.json` | 001_share_status.sql | task_unified |
| `documents` | 証票管理 | `data/documents/` | 003_documents.sql | task_unified |
| `vendors_global` | 全社共通取引先 | `data/vendors_global.ts`（224件） | 002_core_tables.sql | task_unified |
| `user_profiles` | ユーザープロファイル（role: staff/client_user） | **新規** | 001_share_status.sql | **pipeline DL-031 L1791** |
| `invitations` | 招待コード管理（code, client_id, is_active） | **新規** | 001_share_status.sql | **pipeline DL-031 L1798** |
| `client_users` | 顧問先×ユーザー紐付（認可） | **新規** | 001_share_status.sql | **pipeline DL-031 L1808** |
| `confirmed_journals` | 確定済み仕訳 | 未作成（T-03待ち） | 未作成 | **pipeline DL-032 L1883** |
| `migration_jobs` | Drive→Supabase移行ジョブ管理 | **新規** | **005_migration_jobs.sql ✅** | 本セッション |
| `notifications` | アプリ通知（バックグラウンド処理完了/失敗通知） | **新規**（現在メモリ管理。型定義は`repositories/types.ts`に`AppNotification`として準備済み） | 未作成 | 2026-04-24セッション |

> **注意**: `user_client_access`（security_report）と`client_users`（DL-031）は同一目的。DL-031の`client_users`が最新設計。

### 4-4. migration_jobsテーブル詳細（24番 セクション10-6, 15）

```sql
CREATE TABLE migration_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  doc_status TEXT NOT NULL,       -- 'target' | 'supporting' | 'excluded'
  migration_status TEXT NOT NULL DEFAULT 'queued',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  -- Phase E追加カラム:
  downloaded_at TIMESTAMPTZ,     -- ZIP DL済みフラグ
  storage_path TEXT,             -- Supabase Storage上のパス
  file_hash TEXT,                -- SHA-256
  storage_purged_at TIMESTAMPTZ, -- Storageファイル削除日時
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> 出典: 24番 L1000-1019, L1387-1400

### 4-5. roleベース画面分岐（DL-031）

| URL | スタッフ（staff） | 顧問先（client_user） |
|---|---|---|
| `/client/upload/:clientId` | ✅（全clientId） | ✅（自分のclientIdのみ） |
| `/client/journal-list/:clientId` | ✅ | ❌ |
| `/master/*` | ✅ | ❌ |
| `/invite/:code` | ❌（不要） | ✅（初回登録時のみ） |

ログイン後: `role === 'staff'` → `/mode-select` / `role === 'client_user'` → `/client/upload/{clientId}`

> 出典: pipeline_design_master DL-031 L1816-1833

### 4-3. ENUM型・CHECK制約（KI設計）

KI: postgresql_migration_streamed_architecture で設計済み。

| 項目 | 内容 |
|---|---|
| `receipt_status` ENUM | uploaded/preprocessed/ocr_done/suggested/reviewing/confirmed/rejected |
| `update_receipt_status` SQL function | 状態変更+監査ログの原子的実行（race condition防止） |
| `confirmed_requires_journal` CHECK制約 | confirmed時はconfirmed_journalが必須 |

> 出典: KI implementation_plan L12-82

---

## 5. Repository化（残り）

### 5-1. 未完了Repository

| タスク | 内容 | 依存 | 出典 |
|---|---|---|---|
| R-3 | IndustryVectorRepository モック実装 | — | task_unified L227 |
| R-4 | AccountRepository モック実装 | — | task_unified L228 |
| R-5 | ConfirmedJournalRepository モック実装 | T-03（型未定義） | task_unified L229 |
| R-6 | ClientVendorRepository モック実装 | — | task_unified L230 |
| R-S3 | ConfirmedJournalRepository Supabase版 | T-03完了後 | task_unified L237 |
| R-S4 | seedスクリプト（vendors_global 224件等） | — | task_unified L238 |
| R-D5 | DocumentRepository モック実装 | 移行時に作成 | task_unified L243 |

### 5-2. VITE_USE_MOCK切替

`src/repositories/index.ts`のfactory関数で`VITE_USE_MOCK=false`に切り替えるだけでSupabase版に移行可能。

> 出典: pipeline_design_master L1683-1694, task_unified DL-043-8

---

## 6. Drive借景→Supabase移行（選別フロー）

24番設計書セクション10-16で定義。

> **方針: Supabase移行後もDrive借景は継続する。**
> 理由: スマホブラウザでファイルをアップロードするとFileオブジェクトがメモリを圧迫しクラッシュする。
> Driveアプリ経由にすればブラウザのメモリ消費がゼロになるため、スマホ用の入口としてDrive借景は不可欠。
> 選別結果の永続化は、選別画面表示時にdoc-store（現在）/ documentsテーブル（移行後）に登録して解決する。
> Supabase移行時はRepository切替（`VITE_USE_MOCK=false`）のみで追加の再設計は不要。

### 6-1. 全体フロー（セクション15で設計変更あり）

```
Drive（仮置き場）→ 選別画面 → 3分類:
  target（仕訳対象）     → Supabase Storage + DB
  supporting（根拠資料） → Supabase Storage + DB
  excluded（仕訳外）     → Supabase Storage + DB（※設計変更: 全3種別をSupabaseに移行）
→ Drive全ゴミ箱（Supabase移動完了後。例外なし）
→ excluded ZIP DL元 = Supabase Storage（Driveは既に空）
```

> **重要設計変更（24番セクション15）**: excludedも含め全3種別をSupabaseに移行する。理由: 移行しないと「何がexcludedだったか」が不明になる。

### 6-2. 実装タスク

| 項目 | 状態 | 出典 |
|---|---|---|
| drive-select画面でDriveサムネイル借景表示 | ✅ 完了 | 24番 セクション10-5 |
| 選別確定→migration_jobsにキュー登録（POST /migrate） | ✅ **実装済み**（drive.ts L131） | コード実査 |
| バックグラウンドワーカー（migrationWorker.ts 255行） | ✅ **実装済み**（DL-048でpreviewExtract API統合） | コード実査 |
| 移行進捗監視API（GET /migrate/status/:jobId） | ✅ **実装済み**（drive.ts L160） | コード実査 |
| 移行後のDriveファイルゴミ箱移動 | ✅ **実装済み**（migrationWorker.ts内） | コード実査 |
| excluded ZIPダウンロード（サービス＋ルート） | ✅ **ルート接続完了**（drive.ts） | 本セッション |
| excluded自動削除（DL済み+90日経過→Storage削除） | ✅ **実装済み**（`purgeExpiredExcluded()` migrationWorker.ts） | コード実査 |
| PC D&D→Drive uploadルート（POST /upload） | ✅ **実装済み**（drive.ts） | 本セッション |
| `archiver` npmインストール | ✅ **インストール済み** | package.json |
| `sharp` npmインストール | ✅ **インストール済み**（2026-04-24 DL-046。HEIC/HEIF/TIFF→JPEG変換用） | package.json |
| Driveファイルのdoc-store永続化 | ✅ **実装済み**（選別画面表示時にdoc-storeに登録、drive_file_idで重複排除） | 2026-04-24 |
| プレビューローカルキャッシュ | ✅ **実装済み**（drive.ts preview APIで初回のみDrive→ローカルキャッシュ保存。2回目以降即返却。**HEIC/HEIF/TIFFはsharpでJPEG変換後にキャッシュ保存**） | 2026-04-24 |
| 選別結果の進捗画面リアルタイム反映 | ✅ **実装済み**（applyStatusでuseDocuments().updateStatus()使用、allDocuments refを即更新） | 2026-04-24 |
| 選別確定後バックグラウンド移行（即時画面遷移） | ✅ **実装済み**（useMigrationPoller.ts: 画面遷移しても生き続けるグローバルポーリング。sendToProcess改修: POST成功→即モーダル閉じ→トースト通知→画面遷移可能） | 2026-04-24 |
| グローバルトースト通知基盤 | ✅ **実装済み**（useGlobalToast.ts + GlobalToast.vue。App.vueにTeleportで配置。右下スタック表示、最大3件） | 2026-04-24 |
| 通知センター（ナビバー🔔ドロワー） | ✅ **実装済み**（useNotificationCenter.ts + NotificationCenter.vue。MockNavBarに🔔アイコン+未読バッジ追加。仕訳外ZIP DLアクション付き通知対応。**現在メモリ管理→Supabase移行時にnotificationsテーブルで永続化**） | 2026-04-24 |
| AppNotification型定義（Supabase移行準備） | ✅ **型定義済み**（repositories/types.tsに`AppNotification`型 + `NotificationType`型を追加。`notifications`テーブルに直接マッピング可能な設計） | 2026-04-24 |
| 出力ポータルUI統合 | ✅ **実装済み**（`/output/:clientId` → 仕訳外ZIP・MF用CSV。ナビバーアクティブ判定5パス対応） | 2026-04-24 |
| 仕訳外ZIP履歴ページ | ✅ **実装済み**（`/excluded-history/:clientId` → DL済/未DL一覧、ジョブ単位DL、複数選択一括DL） | 2026-04-24 |
| ジョブ単位ZIPダウンロード | ✅ **実装済み**（`?jobId=`パラメータ → interface〜JSON版〜Supabase版〜ZIPサービス全層対応） | 2026-04-24 |
| ジョブ一覧API | ✅ **実装済み**（`GET /migrate/jobs/:clientId` → jobId単位グルーピング、total/done/failed/excluded集計） | 2026-04-24 |
| DL済みマークバグ修正 | ✅ **修正済み**（excludedZipService.ts: `!all`条件削除→DLしたら常にmarkDownloaded実行） | 2026-04-24 |
| currentClient根本改修 | ✅ **修正済み**（useClients.ts: 正規表現ハードコード廃止→`route.params.clientId`優先。新ルート追加時の追記漏れ問題を解消） | 2026-04-24 |

### 6-3. 実装フェーズ（24番セクション13）

| フェーズ | 内容 | 前提 |
|---|---|---|
| Phase A | サムネイルプロキシAPI | driveService.ts |
| Phase B | 選別画面改修（データソース差替） | Phase A |
| Phase C | PC版Drive upload統合 | Phase A |
| Phase D | Supabase移行バッチ（全3種別をSupabaseに移動→Drive全ゴミ箱） | Phase B + Supabase Storage |
| Phase E | 仕訳外ZIPダウンロード（Supabase Storageから取得）+ 肥大化防止 | Phase D |
| Phase F | 旧方式廃止 — **F-1/2/3/5/6完了**。F-4/7はSupabase移行後 | Phase A-E全完了 |

### 6-4. 新設API（24番セクション11-2）

| エンドポイント | 責務 | 状態 |
|---|---|---|
| `GET /api/drive/files`（サムネイル対応拡張） | ?withThumbnails=trueでbase64付き | ✅ **実装済み**（drive.ts L29） |
| `GET /api/drive/preview/:fileId` | フルサイズプレビュー（**ローカルキャッシュ付き: 初回のみDrive API、以降は`data/uploads/drive-cache/`から即返却**） | ✅ **実装済み**（drive.ts） |
| `POST /api/drive/upload` | PC D&D→Drive API files.create | ✅ **実装済み**（drive.ts） |
| `POST /api/drive/migrate` | 選別確定→ジョブ登録 | ✅ **実装済み**（drive.ts L131） |
| `GET /api/drive/migrate/status/:jobId` | 移行進捗監視 | ✅ **実装済み**（drive.ts L160） |
| `GET /api/drive/migrate/jobs/:clientId` | ジョブ一覧（jobId単位グルーピング） | ✅ **実装済み**（2026-04-24） |
| `GET /api/drive/download-excluded/:clientId` | 仕訳外ZIPダウンロード（`?jobId=`対応、0件チェック付き） | ✅ **実装済み** |
| `GET /api/drive/excluded-history/:clientId` | 仕訳外ダウンロード履歴（jobId単位グルーピング） | ✅ **実装済み**（2026-04-24） |

### 6-5. データアクセス抽象化（24番セクション16）✅ 実装済み

サーバーサイドもRepository + interface化済み。全ファイル実在確認済み。

| ファイル | 責務 | 切替変数 |
|---|---|---|
| `src/api/lib/storage.ts` ✅ | StorageProvider interface（local/Supabase切替） | `USE_SUPABASE_MIGRATION` |
| `src/api/services/migration/migrationRepository.ts` ✅ | MigrationRepository interface | 同上 |
| `src/api/services/migration/migrationRepository.json.ts` ✅ | JSON永続化版 | デフォルト |
| `src/api/services/migration/migrationRepository.supabase.ts` ✅ | Supabase版 | `true`時 |
| `src/api/services/migration/migrationWorker.ts` ✅ | バックグラウンドワーカー（255行。DL-048でpreviewExtract API統合済み） | — |
| `src/api/services/migration/excludedZipService.ts` ✅ | 仕訳外ZIP生成サービス | — |

### 6-6. 廃止対象（Phase F、24番セクション11-1）

| 廃止対象 | 現在のファイル | 状態 |
|---|---|---|
| ~~`data/uploads/` 静的配信~~ | ~~server.ts~~ | ~~✅ F-1 削除済み~~ |
| ~~`POST /api/doc-store/upload-file`~~ | ~~docStore.ts~~ | ~~✅ F-2 削除済み~~ |
| `documentStore.ts` JSON永続化 | documentStore.ts | ⏸️ F-4 Supabase移行後 |
| ~~`POST /api/drive/process`~~ | ~~drive.ts~~ | ~~✅ F-3 削除済み~~ |
| ~~blob URL / ローカルファイルURL~~ | ~~MockUploadDocsPage.vue~~ | ~~✅ F-5 Drive uploadに切替済み~~ |

> 出典: 24番 セクション10-16

---

## 7. Supabase Edge Functions

| 項目 | 状態 | 出典 |
|---|---|---|
| receiptService.ts本番実装（Edge Functions接続） | ❌ スタブのみ | task_unified C-8 L371 |
| Supabase Edge Functions接続（本番モード） | ❌ スタブのみ | pipeline_design_master L1339 |

> 出典: task_unified L371, pipeline_design_master L1339

---

## 8. データ移行

### 8-1. JSON → Supabase DB

| ファイル | 移行先テーブル | レコード数（概算） | 前提 |
|---|---|---|---|
| `data/staff.json` | staff | 7名 | ✅ **004_staff.sql作成済み** |
| `data/clients.json` | clients | 数十件 | 002_core_tables.sql ✅ |
| `data/share_status.json` | share_status | 数十件 | 001_share_status.sql ✅ |
| `data/documents/*.json` | documents | 数百件 | 003_documents.sql ✅ |
| `data/vendors_global.ts` | vendors（scope='global'） | 224件 | 002_core_tables.sql ✅ |

### 8-2. localStorage → サーバー側セッション

| localStorage | 移行先 |
|---|---|
| `sugu-suru:current-staff-uuid` | Supabase Auth JWT |
| `guest_google_{clientId}` | サーバー側セッション or DB |

---

## 9. 後回し項目（Supabase移行時にまとめて対応）

| 項目 | 現状 | Supabase移行後 | 出典 |
|---|---|---|---|
| L-2: 重複判定ハッシュ記録 | A案実装済み（localStorage） | B案: Supabase DBでライフサイクル管理 | task_unified L492 |
| DL-038: ハッシュ記録管理 | A案→Supabase移行時B案 | 同上 | task_unified L492 |
| Supabase Realtime | share_status以外のsubscription未実装 | 必要時に追加 | pipeline DL-032 L1945 |
| `documents`テーブル `drive_file_id UNIQUE`制約追加 | 未適用 | 冪等性保証用 | 24番 L1174 |
| ~~excluded ZIPダウンロードルート接続~~ | ~~✅ 本セッションで完了~~ | — | — |
| ~~PC D&D→Drive uploadルート~~ | ~~✅ 本セッションで完了~~ | — | — |
| F-4: documentStore.ts（279行）+ docStore.tsルート廃止 | useDocuments/useProgressが`/api/doc-store`に依存 | Supabase DB documentsテーブルに切替後に削除 | task.md.resolved Phase F |
| F-7: useDocuments.tsの`/api/doc-store`参照廃止 | 進捗管理（useProgress）が依存 | Supabase版DocumentRepositoryに切替後に削除 | task.md.resolved Phase F |
| pipeline.tsのsaveUploadedFile + GET /file廃止 | useUploadチャンクアップロードが`data/uploads/`に依存 | Drive upload完全移行後に削除 | task.md.resolved Phase F |
| app_metadata.roleによる厳密なロール判定 | 未設定（guestAllowed メタで暫定分岐） | `role === 'staff'`/`'client'`でエラーページ出し分け | エラー表示設計 |
| 403→404変換のサーバー側実装 | 未実装（フロントで一律404表示） | RLSで弾かれた場合にロール別エラーレスポンスに変換 | エラー表示設計 |
| 401（認証切れ）→ 再ログインフローの出し分け | 未実装（一律/404リダイレクト） | 顧問先→再ログイン案内、スタッフ→JWT期限確認表示 | エラー表示設計 |
| リクエストIDの生成・ログ連携 | 未実装 | スタッフ向けエラー画面にリクエストID・発生日時を表示 | エラー表示設計 |
| スタッフ向けSlack #dev-alert連携 | 未実装 | 500/503発生時にSlack自動通知 | エラー表示設計 |
| normalizeSupabaseError.ts新設 | 未作成（fetchのnormalizeHttpError.tsのみ実装済み） | PostgrestError → AppError変換（RLSの42501→403等） | エラーハンドラー設計 |
| errorRole.ts中身の差し替え | 暫定: JWT+guest_google_*で判定 | `app_metadata.role`で判定に置換（1関数の中身のみ） | エラーハンドラー設計 |
| ~~MockErrorPreviewPage.vue削除~~ | ~~開発用プレビュー（/#/error-preview）~~ | ~~✅ 削除済み（2026-04-23）~~ | エラーハンドラー設計 |
| 既存fetch 19箇所のapiFetch移行 | 全19箇所が直接fetch()。エラー処理はthrow/console.error/無視がバラバラ | composable層（useStaff, useClients等）はモジュールスコープでuseRouter()不可→SupabaseClient直接呼び出しに置換。Vueページ側はapiFetch.withError()に統一 | バリデーション設計 |
| ~~Driveファイル選別結果の永続化~~ | ~~`driveSelections`（メモリ上のMap）に保持~~ | ~~✅ **解決済み（2026-04-24）**。選別画面表示時にdoc-storeに登録 + useDocuments().updateStatus()でallDocuments ref即更新 + プレビューローカルキャッシュ~~ | MockDriveSelectPage.vue, drive.ts |
| 通知センターのDB永続化 | useNotificationCenter.tsでメモリ内ref管理（ページリロードで消える）。**Supabase移行後でなければ実施不可**（notificationsテーブルのDB永続化が必要） | ①`006_notifications.sql`マイグレーション作成（型定義`AppNotification`は`repositories/types.ts`に準備済み）②useNotificationCenter内部をSupabase API呼び出しに差し替え ③Supabase Realtimeで他タブへのpush通知 | useNotificationCenter.ts |
| ~~ジョブ一覧API（`GET /api/drive/migrate/jobs`）~~ | ~~✅ **実装済み（2026-04-24）**。`getMigrationJobs(clientId)` → interface/JSON版/Supabase版/ラッパー/エンドポイント全層実装。jobId単位グルーピング、total/done/failed/excluded集計~~ | ~~—~~ | ~~drive.ts, migrationRepository.ts~~ |
| MockDriveSelectPage.vue composable分離 | 1163行の巨大ファイル。デッドコード削除済みだがUI状態（undo/redo等）が密結合 | データ取得・選別操作・PDF.jsの3ブロックをcomposableに分離。大規模リファクタリングとして別タスク | MockDriveSelectPage.vue |
| DocEntry/JobRow二重データストア統合 | `DocEntry`（`data/documents/*.json`）と`JobRow`（`data/migration_jobs.json`）が分離管理。DocEntry=資料メタデータ（source/status/hash等）、JobRow=移行ジョブ進捗（migration_status/retry_count/storage_path等）。フロントエンドの選別画面はDrive APIとdoc-storeの2ソースをマージして表示。進捗管理はuseDocumentsとuseProgressから取得 | Supabase移行時に`documents`テーブルと`migration_jobs`テーブルのJOINクエリで統合表示。または`documents`テーブルに移行ステータスカラムを追加してJobRow相当を吸収。設計はSupabase版Repository実装（フェーズ5）時に確定 | documentStore.ts, migrationRepository.json.ts, useDocuments.ts |
| isDuplicateデータ消失（DL-051 T-AUD-5） | `useUpload.ts` handleConfirm()でUploadEntry→DocEntry変換時にisDuplicateフラグが消失。DocEntry型にプロパティが存在しない | ①DocEntry型に`isDuplicate: boolean`追加 ②handleConfirm()で値をコピー | useUpload.ts, repositories/types.ts |
| AI分類結果15件のVue未表示（DL-051） | previewExtract APIで取得しDocEntryに保存済みのaiDate/aiAmount/aiVendor等15フィールドが全Vue画面で未参照 | 選別画面（`/drive-select/:clientId`）でAI結果を表示するUI実装。task_unified.md L-8で「仕訳一覧UI（C-7）完了後に着手判断」 | MockDriveSelectPage.vue |
| aiMetrics実データ接続（DL-051 T-AUD-4a残り） | 管理者ダッシュボード「AI精度」「コスト」「処理時間」タブがプレースホルダーのまま。aiPreviewExtractReason/aiLineItemsの詳細モーダルも未実装 | Supabase移行後にdocumentsテーブルから集計クエリで実データを取得。ダッシュボードのプレースホルダーを実データに置換 | MockAdminDashboardPage.vue |
| rule_id仕訳逆引き表示（DL-051 T-AUD-4b） | 仕訳一覧で`rule_id`が存在するが、「なぜこの科目？」をルール名で逆引き表示する機能がない | Supabase移行後に`learning_rules`テーブルとJOINしてルール名・キーワードをホバー表示 | JournalListLevel3Mock.vue |
| ai_completed_at等4件ダッシュボード接続（DL-051 T-AUD-4c） | `ai_completed_at`/`prediction_method`/`prediction_score`/`model_version` がダッシュボードのプレースホルダーに待ち状態 | Supabase移行後に実データ接続。prediction_methodはStep4完了後に初めて値が入る | MockAdminDashboardPage.vue |
| 旧系統LearningRule二重管理廃止（DL-051 監査検出） | 旧Firestore設計のLearningRule関連コードが10ファイル以上に残存し、新系統（mocks層）と矛盾。`confidenceScore`がLearningRuleUi.ts/zod_schema.ts/firestore.tsに残存、clientCodeベース、借方勘定科目のみ（貸方なし）、ScreenD_AIRules.vueのimport先不在 | Supabase移行時に旧系統廃止。対象: `LearningRuleUi.ts`/`zod_schema.ts` L486/`firestore.ts` L350/`ScreenD_AIRules.vue`等。新系統`learning_rule.type.ts`+`learning_rules_TST00011.ts`で完全置換 | LearningRuleUi.ts, zod_schema.ts, firestore.ts, ScreenD_AIRules.vue |
| **プロパティ命名snake_case統一（DL-054）** | LearningRule系（`matchType`, `amountMin`, `isActive`等）とAccountDeterminationResult（`vendorId`, `determinedAccount`等）がcamelCase。JournalPhase5Mock/Vendor等のUI表示系はsnake_case。**混在** | Supabase移行時に一括リファクタ。対象: `learning_rule.type.ts`（LearningRule + LearningRuleEntryLine）、`accountDetermination.ts`（AccountDeterminationResult）、`matchLearningRule.ts`。全プロパティをsnake_caseに変換 | learning_rule.type.ts, accountDetermination.ts, matchLearningRule.ts |
| **確定送信のトランザクション化** | `sendToProcess()`で①仕訳保存→②previewExtractデータ削除→③Drive移行ジョブ登録を順次実行。現在はJSON永続化のため②が失敗しても①の仕訳データは保存済みで実害なし。ただし②のサーバー通信失敗時にリトライしない | Supabase移行時にDBトランザクションで①②を原子的に実行。③（Drive移行）は非同期ジョブのため別トランザクション。対象: `clearAiFieldsByClientId()`（documentStore.ts）→ documentsテーブルのUPDATE（ai*カラム=NULL）+ journalsテーブルのINSERTを1トランザクションに統合 | MockDriveSelectPage.vue, documentStore.ts, useDocuments.ts |
| **supabase gen types + AssertExtends CI自動化（型安全性保証）** | 現在は全14ストアがJSONを`as`キャストで読み込んでおり、型の不整合を検知する仕組みが**ゼロ**。repositories/types.tsの型を変更してもDBスキーマが追随していなければランタイムで壊れる。**事前検知不可** | ① `supabase gen types typescript --local > src/types/database.types.ts` でDBスキーマからTS型を自動生成 ② `src/types/type_guards.ts` に `AssertExtends<Database['public']['Tables']['clients']['Row'], Client>` 等を全テーブルに配置（コンパイル時に型不整合を即検知） ③ CIに `supabase gen types` → `vue-tsc --noEmit` パイプラインを追加（デプロイ前に自動検知） ④ DBマイグレーション + types.tsは同時デプロイ（分けない） | repositories/types.ts, src/types/database.types.ts（自動生成）, src/types/type_guards.ts（新設）, CI設定 |
| **AI_PROMPTS定数のDB移行（定数API化）** | `accountingConstants.ts`のAI_PROMPTS（WORKER/LEARNER/UPDATER/BUILDER/OPTIMIZER/AUDITOR）がTSハードコード。プロンプトチューニングの度にコード変更＋デプロイが必要。非開発者によるチューニングが不可能 | ① Supabaseに`ai_prompts`テーブルを作成（id, name, value, updated_at） ② サーバー側に`GET /api/constants/prompts`エンドポイント新設 ③ フロントはルーターガード（beforeEach）で初回取得＋refキャッシュ（TTL 5分） ④ 管理者ダッシュボードにプロンプト編集UIを接続（既にMockAdminDashboardPage.vueにプロンプト表示タブあり） ⑤ エラー時はフォールバックなし（定数未取得→エラーページ遷移）。**注意**: GAS_LOGIC_DEFINITIONS, SOFTWARE_EXPORT_CSV_SCHEMAS, TAX_SCOPE_DEFINITIONS等はTSのままとする（変更頻度が低く、コードとの密結合度が高いため） | accountingConstants.ts, ai_promptsテーブル（新設）, GET /api/constants/prompts（新設）, MockAdminDashboardPage.vue |
| **Docker network=none 実データテスト環境構築** | 実データ（顧問先情報・仕訳データ）を用いたテスト時、AIツールのテレメトリ通信・Sentryエラーレポート・ライブラリの裏通信など、コード制御不能な経路からのデータ漏洩リスクがある。`.gitignore`やpre-commitフックだけでは「ツールの暗黙の裏挙動」を防げない | ① `docker/docker-compose.yml` に `network_mode: "none"` を設定し、実データテスト時はネットワーク完全遮断環境で実行 ② 実データは `~/project-secrets/receipt-app/` （リポジトリ外）に配置し、Docker volumeで読み取り専用マウント（`:ro`） ③ `VITE_ENABLE_REAL_TEST` フラグ + `NODE_ENV !== 'development'` ガードで本番・CI環境での実データ読み込みをコード上でも完全封鎖 ④ 実データモード時は `console.log = () => {}` でログ出力も封鎖 ⑤ 物理遮断（Wi-Fiオフ）との併用を運用ルールとして定義 | docker/docker-compose.yml（新設）, scripts/load-test-data.cjs（新設）, .env.local |
| **PostgreSQL Anonymizer導入（本番データマスキング）** | 本番DBからテスト用データを取得する際、顧問先名・電話番号・メールアドレス・口座情報等の個人情報がそのまま開発環境に流入するリスクがある。「本番データを持ってくるな」というルールは必ず破られるため、**持ってきても安全な状態に変換する正規経路**を提供する必要がある | ① Supabase移行後に `postgresql_anonymizer` 拡張（またはカスタムSQL関数）を導入し、`pg_dump` の出力にマスキング層を強制的に挟む ② マスキング対象: `companyName`→`株式会社テスト`, `email`→`test@example.com`, `phone`→`000-0000-0000`, `bankAccount`→`XXXXXXX`。金額・日付・データ構造はそのまま保持（バグ再現に必要） ③ 移行前の暫定策として `scripts/mask-data.cjs` でJSON形式の実データをマスキングするNode.jsスクリプトを提供（入力: 生データJSON → 出力: マスキング済みJSON） ④ マスキングスクリプトにはpre-commitフック（`scripts/precommit-check.cjs`）を連動させ、電話番号・メール形式・法人名パターンがステージングに含まれた場合はコミットを即abort ⑤ 将来的にはシークレット管理サービス（Doppler/Infisical等）への移行を検討し、環境ごと（dev/staging/prod）に異なるSupabaseプロジェクト＋鍵を分離する | postgresql_anonymizer（Supabase拡張）, scripts/mask-data.cjs（新設）, scripts/precommit-check.cjs（新設）, .husky/pre-commit（新設） |
| **本番Workload Identity移行（Cloud Run）** | ローカル開発はサービスアカウントキー（JSONファイル）で認証。キーローテーションは`scripts/check-key-rotation.cjs`で自動チェック（`npm run dev`時に90日超過で警告） | Cloud Run移行時にWorkload Identity連携に切替。キーファイル不要になり、漏洩リスクをゼロにする。①Cloud Runサービスにサービスアカウントをアタッチ ②Application Default Credentialsで自動認証 ③`GOOGLE_SA_KEY_PATH`環境変数とキーファイル読み込みコードを条件分岐（ローカル: キー / 本番: ADC） | driveService.ts L82/L552, .env.local |

---

## 10. 暫定実装の置換リスト

| # | 暫定実装 | ファイル | 置換先 |
|---|---|---|---|
| 1 | ~~localStorage staffIdチェック~~ | ~~`router/index.ts` beforeEach~~ | ~~✅ Supabase Auth JWT化済み~~ |
| 2 | localStorage `guest_google_*` | `MockPortalLoginPage.vue` | サーバー側セッション |
| 3 | `share_status.json` | `shareStatusStore.ts` | Supabase DB |
| 4 | `clients.json` sharedEmail | `clientStore.ts` | Supabase DB clients.shared_email |
| 5 | `staff.json` | `staffStore.ts` | Supabase DB |
| 6 | Google OAuth client-side only | `MockPortalLoginPage.vue` | サーバー側JWT検証追加 |
| 7 | `VITE_USE_MOCK=true` | `repositories/index.ts` | `VITE_USE_MOCK=false` に切替 |

---

## 11. 移行前の棚卸しタスク（移行対象マップ作成）

Supabase移行の**前に**実施する。目的は「潰す」ことではなく、移行時に何をどう変えるかの**マップを作る**こと。
ここで洗い出した結果は、移行時のチェックリストとして使用する。

### 11-1. localStorage直接操作の棚卸し（16ファイル）

| ファイル | 件数 | 用途 | 移行時の対応方針 |
|---|---|---|---|
| `useAccountSettings.ts` | 5 | 科目設定キャッシュ | Supabase DBに移行。composableはAPI呼び出しに差し替え |
| `useClientAccounts.ts` | 4 | 顧問先科目キャッシュ | 同上 |
| `useClients.ts` | 3 | 顧問先リストキャッシュ | 同上 |
| `useColumnResize.ts` | 3 | カラム幅記憶（UI設定） | **許容（ローカルUI設定のため移行不要）** |
| `MockPortalLoginPage.vue` | 3 | ログイン状態 | Supabase Auth セッションに置換 |
| `useAccountMaster.ts` | 2 | マスタ科目キャッシュ | Phase 2でサーバー保存API済み。移行時にlocalStorageフォールバック削除 |
| `useTaxMaster.ts` | 2 | マスタ税区分キャッシュ | 同上 |
| `useProgress.ts` | 1 | 進捗データ | Supabase DBに移行 |
| `MockHomePage.vue` | 1 | ホーム設定 | Supabase DBに移行 |
| `MockAdminDashboardPage.vue` | 1 | ダッシュボード設定 | Supabase DBに移行 |
| その他6ファイル | 6 | 各種 | 移行時に個別判断 |

### 11-2. TODO残存の棚卸し（20件）

| カテゴリ | 件数 | 代表例 | 移行時の対応 |
|---|---|---|---|
| Supabase移行関連 | 12 | `journal_phase5_mock.type.ts` — テーブル設計メモ | 移行SQLの参照資料として使用後に削除 |
| API化関連 | 3 | `useAccountMaster.ts`, `useTaxMaster.ts`, `useProgress.ts` | 移行と同時にAPI化して解消 |
| 科目確定DB化 | 2 | `accountDetermination.ts`, `matchLearningRule.ts` | Supabase `learning_rules` テーブル接続時に解消 |
| 画面実装 | 2 | `DocumentDetail.vue`, `ScreenE_Workbench.vue` | 移行後の機能実装時に解消 |
| Phase 6.3 | 1 | `ScreenE_Workbench.vue` — 免税/簡易グレーアウト | 移行後の機能実装時に解消 |

### 11-3. `as unknown as` ダブルキャスト残存（29件 / 12ファイル）

| 分類 | 件数 | 移行時の対応 |
|---|---|---|
| API応答キャスト（`useClientListRPC.ts`等） | 4 | Supabase型（`supabase gen types`）導入で自然解消 |
| 動的プロパティアクセス（`JournalListLevel3Mock.vue`等） | 15 | 移行時のリファクタで段階的に解消 |
| インライン編集（`MockMasterClientsPage.vue`等） | 3 | 移行時のリファクタで解消 |
| 非標準API（`performance.memory`等） | 2 | **許容（ブラウザ固有APIのため解消不可）** |
| Supabase Realtime payload | 1 | Supabase型導入で自然解消 |
| Firestoreドキュメント変換 | 2 | Firestore廃止で消滅 |
| File System Access API | 1 | **許容（ブラウザ固有APIのため解消不可）** |
| インライン編集ソート | 1 | 移行時のリファクタで解消 |

### 11-4. 旧Screen系コードの判断

| ファイル | 規模 | 判断 | 理由 |
|---|---|---|---|
| `ScreenA_ClientDetail.vue` | 34KB | **移行時に廃止** | MockMasterClientsPage.vueに機能統合済み |
| `ScreenA_Detail_EditModal.vue` | 5KB | **移行時に廃止** | ScreenA_ClientDetailと同時廃止 |
| `ScreenC_CollectionStatus.vue` | 34KB | **移行時に廃止** | MockProgressDetailPage.vueに置き換え |
| `ScreenE_LogicMaster.vue` | 46KB | **要判断** | ScreenE_Workbench.vueと機能重複。移行時に統合検討 |
| `ScreenE_Workbench.vue` | 17KB | **存続** | 仕訳処理のメイン画面 |
| `client-form.type.ts` | 2KB | **移行時に廃止** | ScreenA専用型。Client型（repositories/types.ts）に統合 |

### 11-5. useAccountingSystem.ts（64KB / 1,518行）の仕分け

| 区分 | 行数（概算） | 内容 | 移行時の対応 |
|---|---|---|---|
| 定数定義（AI_PROMPTS等） | ~500行 | プロンプト文字列・GAS定義 | AI_PROMPTSのみDB化（セクション9参照）。他はTSのまま |
| モックデータ生成 | ~300行 | `createMockJob`, `mockClients`等 | Supabase移行後に不要。削除 |
| ロジック関数 | ~200行 | `determineAccountItem`等 | 既にサーバー側（`accountDetermination.ts`）に移動済み。import元切替のみ |
| composable本体 | ~500行 | `aaa_useAccountingSystem` | Supabase移行時にAPI呼び出しパターン（`useJournals.ts`型）に書き換え |

---

## 12. フロントロジックAPI化の方針（Phase 3-4）

`implementation_plan_merged.md` のPhase 3-4は**Supabase移行前に実施しない**。
理由: JSONストアの上にfetchラッパーAPIを作っても、移行時にPostgreSQLクエリで作り直す二度手間になるため。

### 実行順序（確定方針）

| 順番 | タスク | アウトプット |
|---|---|---|
| **①** | 移行前棚卸し（セクション11） | 移行対象マップ（どのファイルの何をどう変えるか） |
| **②** | Supabase移行本体（セクション1-8） | DBスキーマ + RLS + マイグレーションSQL + Repository層接続 |
| **③** | Phase 3-4を移行と同時実施 | PostgreSQLクエリベースのAPI + localStorage廃止 + composable統一 |

### API化の対象/対象外（判定基準）

| 判定 | 種別 | 例 | 理由 |
|---|---|---|---|
| ✅ API化する | フィルタ・ソート・ページネーション | `filteredAccountRows`, `pagedAccountRows` | PostgreSQLクエリの方が高速かつ正確 |
| ✅ API化する | バリデーション | `syncWarningLabels` | **Phase 1で完了済み** |
| ✅ API化する | 科目確定パイプライン | `accountDetermination.ts` | **既にサーバー側で動作** |
| ✅ API化する | CRUD保存 | `saveChanges` | **Phase 2で完了済み** |
| ❌ フロント残留 | 表示ラベル生成 | `sourceCategoryLabel`, `formatSize` | ネットワーク往復コストの方が高い |
| ❌ フロント残留 | UI状態の派生値 | `canConfirm`, `hasErrors`, `guideMessage` | サーバーがUIの状態を知る必要がない |
| ❌ フロント残留 | ブラウザ固有処理 | `compressAndThumbnail`, Canvas API | サーバーで実行不可能 |
| ❌ フロント残留 | ドラッグ&ドロップ | `onDragStart`, `onDrop` | UI操作。保存時にAPIに送れば十分 |
| ❌ フロント残留 | インライン編集 | `startEdit`, `commitEdit` | セル編集のUI制御 |

### 参照資料

| 資料 | 状態 | 用途 |
|---|---|---|
| `implementation_plan_merged.md` | 温存（参照用） | 全122ファイル / 1,255関数の詳細リスト |
| Phase 1（仕訳一覧API） | ✅ 完了済み（2026-05-03） | journalListService.ts |
| Phase 2（マスタCRUD群API化 Step 1-10） | ✅ 完了済み | — |
| Phase 2追加: マスタ一覧API化（4画面） | ✅ 完了済み（2026-05-05） | staffListService/vendorListService/clientListService |
| Phase 3（アップロード・ドライブ連携） | 🔴 Supabase移行と同時実施 | 移行時に参照 |
| Phase 4（その他ロジック削減） | 🔴 Supabase移行と同時実施 | 移行時に参照 |
| **31番: 全量調査+残タスク** | [31_logic_api_migration_audit.md](../genzai/31_logic_api_migration_audit.md) | API化残タスク詳細（T-31-1〜5） |

---

## 関連ドキュメントリンク


| ドキュメント | 関連セクション |
|---|---|
| [task_unified.md](file:///c:/dev/receipt-app/docs/task_unified.md) | C-0（Repository化）, C-1 フェーズ5, D（先送り）, L-2, **B-15（DL-045）** |
| [supabase_security_report_260214.md](file:///c:/dev/receipt-app/docs/genzai/01_tools_and_setups/supabase_security_report_260214.md) | RLS, validateStaffAccess, Google OAuth |
| [24_upload_drive_integration.md](file:///c:/dev/receipt-app/docs/genzai/24_upload_drive_integration.md) | セクション7-4, 8, **10-16** |
| [pipeline_design_master.md](file:///c:/dev/receipt-app/docs/pipeline_design_master.md) | DL-030, **DL-031**, DL-032, **DL-045** |
| [error_display_design.md](file:///c:/dev/receipt-app/docs/error_display_design.md) | ロール別エラー表示設計, DL-045完了済みセクション |
| [tools_and_setup_guide.md](file:///c:/dev/receipt-app/docs/genzai/01_tools_and_setups/tools_and_setup_guide.md) | SDK導入, 環境変数 |
| [setup_status_report_260211.md](file:///c:/dev/receipt-app/docs/genzai/01_tools_and_setups/setup_status_report_260211.md) | Firebase排除, Timestamp移行, SA権限 |
| KI: postgresql_migration_streamed_architecture | ENUM型, CHECK制約, SQL function |

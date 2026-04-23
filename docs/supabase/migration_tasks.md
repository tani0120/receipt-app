# Supabase移行タスク一覧

> 作成日: 2026-04-23
> 最終更新: 2026-04-23 v5（v4 + バリデーション・エラーハンドリング移行タスク3件追記）
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
| バックグラウンドワーカー（migrationWorker.ts 217行） | ✅ **実装済み** | コード実査 |
| 移行進捗監視API（GET /migrate/status/:jobId） | ✅ **実装済み**（drive.ts L160） | コード実査 |
| 移行後のDriveファイルゴミ箱移動 | ✅ **実装済み**（migrationWorker.ts内） | コード実査 |
| excluded ZIPダウンロード（サービス＋ルート） | ✅ **ルート接続完了**（drive.ts） | 本セッション |
| excluded自動削除（DL済み+90日経過→Storage削除） | ✅ **実装済み**（`purgeExpiredExcluded()` migrationWorker.ts） | コード実査 |
| PC D&D→Drive uploadルート（POST /upload） | ✅ **実装済み**（drive.ts） | 本セッション |
| `archiver` npmインストール | ✅ **インストール済み** | package.json |

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
| `GET /api/drive/preview/:fileId` | フルサイズプレビュー | ✅ **実装済み**（drive.ts L9） |
| `POST /api/drive/upload` | PC D&D→Drive API files.create | ✅ **実装済み**（drive.ts） |
| `POST /api/drive/migrate` | 選別確定→ジョブ登録 | ✅ **実装済み**（drive.ts L131） |
| `GET /api/drive/migrate/status/:jobId` | 移行進捗監視 | ✅ **実装済み**（drive.ts L160） |
| `GET /api/drive/download-excluded/:clientId` | 仕訳外ZIPダウンロード | ✅ **ルート接続完了** |

### 6-5. データアクセス抽象化（24番セクション16）✅ 実装済み

サーバーサイドもRepository + interface化済み。全ファイル実在確認済み。

| ファイル | 責務 | 切替変数 |
|---|---|---|
| `src/api/lib/storage.ts` ✅ | StorageProvider interface（local/Supabase切替） | `USE_SUPABASE_MIGRATION` |
| `src/api/services/migration/migrationRepository.ts` ✅ | MigrationRepository interface | 同上 |
| `src/api/services/migration/migrationRepository.json.ts` ✅ | JSON永続化版 | デフォルト |
| `src/api/services/migration/migrationRepository.supabase.ts` ✅ | Supabase版 | `true`時 |
| `src/api/services/migration/migrationWorker.ts` ✅ | バックグラウンドワーカー（217行） | — |
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
| F-4: documentStore.ts（211行）+ docStore.tsルート廃止 | useDocuments/useProgressが`/api/doc-store`に依存 | Supabase DB documentsテーブルに切替後に削除 | task.md.resolved Phase F |
| F-7: useDocuments.tsの`/api/doc-store`参照廃止 | 進捗管理（useProgress）が依存 | Supabase版DocumentRepositoryに切替後に削除 | task.md.resolved Phase F |
| pipeline.tsのsaveUploadedFile + GET /file廃止 | useUploadチャンクアップロードが`data/uploads/`に依存 | Drive upload完全移行後に削除 | task.md.resolved Phase F |
| app_metadata.roleによる厳密なロール判定 | 未設定（guestAllowed メタで暫定分岐） | `role === 'staff'`/`'client'`でエラーページ出し分け | エラー表示設計 |
| 403→404変換のサーバー側実装 | 未実装（フロントで一律404表示） | RLSで弾かれた場合にロール別エラーレスポンスに変換 | エラー表示設計 |
| 401（認証切れ）→ 再ログインフローの出し分け | 未実装（一律/404リダイレクト） | 顧問先→再ログイン案内、スタッフ→JWT期限確認表示 | エラー表示設計 |
| リクエストIDの生成・ログ連携 | 未実装 | スタッフ向けエラー画面にリクエストID・発生日時を表示 | エラー表示設計 |
| スタッフ向けSlack #dev-alert連携 | 未実装 | 500/503発生時にSlack自動通知 | エラー表示設計 |
| normalizeSupabaseError.ts新設 | 未作成（fetchのnormalizeHttpError.tsのみ実装済み） | PostgrestError → AppError変換（RLSの42501→403等） | エラーハンドラー設計 |
| errorRole.ts中身の差し替え | 暫定: JWT+guest_google_*で判定 | `app_metadata.role`で判定に置換（1関数の中身のみ） | エラーハンドラー設計 |
| MockErrorPreviewPage.vue削除 | 開発用プレビュー（/#/error-preview） | 本番デプロイ前に削除 | エラーハンドラー設計 |
| Zodスキーマ日本語化 + apiMessages統合 | モック用スキーマは英語のまま（zodHookフォールバックで安全） | 本番スキーマ作成時に `z.string().min(1, 必須('名前'))` 形式で日本語埋め込み。6ファイル対象: ai-rules, collection, clients, admin, ocr, api/index | バリデーション設計 |
| 既存fetch 19箇所のapiFetch移行 | 全19箇所が直接fetch()。エラー処理はthrow/console.error/無視がバラバラ | composable層（useStaff, useClients等）はモジュールスコープでuseRouter()不可→SupabaseClient直接呼び出しに置換。Vueページ側はapiFetch.withError()に統一 | バリデーション設計 |
| Zodスキーマファイル分離（`src/api/schemas/`） | 全スキーマがルートファイル内にインライン定義 | `src/api/schemas/staff.schema.ts` 等に分離。apiMessages.tsの定数を参照し、フロント・サーバー間で仕様を一元管理 | バリデーション設計 |

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

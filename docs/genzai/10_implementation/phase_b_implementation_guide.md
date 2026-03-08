# Phase B 実装申し送りガイド

> 作成日: 2026-03-08
> 目的: モック（Phase A）→ 本番（Phase B: Supabase）移行時の包括的な実装指針
> 関連ドキュメント: 下記§11参照

---

## 1. 認証・パスワード設計（☆最重要）

### 1-1. 背景

Phase Aでモックデータに平文パスワード（`admin1234`等）をハードコードし、GitGuardianに検出されコミットがブロックされた（2026-03-08）。

### 1-2. 設計原則（厳守）

| # | ルール | 理由 |
|---|--------|------|
| 1 | ソースコードに平文パスワードを書かない | GitGuardian検出・漏洩リスク |
| 2 | `Staff`型にpasswordフィールドを持たない | フロントエンドにパスワードを返さない設計 |
| 3 | `StaffForm`にのみpasswordを持つ | 新規登録・パスワード変更の入力用途限定 |
| 4 | ハッシュ化はSupabase Authに委譲 | 自前実装しない |

### 1-3. 実装方針

```
フロントエンド          Supabase Auth           PostgreSQL
┌──────────┐      ┌──────────────┐      ┌──────────┐
│ form.password │ ─→│ supabase.auth  │ ─→│ auth.users  │
│ （平文・一時的） │   │ .admin         │   │ (bcrypt     │
│              │   │ .createUser()  │   │  ハッシュ保存) │
└──────────┘      └──────────────┘      └──────────┘
```

- **新規登録**: `supabase.auth.admin.createUser({ email, password, user_metadata })`
- **パスワード変更**: `supabase.auth.admin.updateUserById(id, { password })`
- **一覧取得**: staffテーブルからのみ取得。auth.usersにはアクセスしない

### 1-4. 禁止事項（絶対）

| # | 禁止事項 |
|---|---------|
| 1 | ソースコード内の平文パスワード |
| 2 | フロントエンドでのパスワードハッシュ化 |
| 3 | ログ出力にパスワードを含める |
| 4 | APIレスポンスにパスワード（ハッシュ含む）を返す |
| 5 | テストコード内の実在パスワード（`test-dummy-xxx`等の明示的ダミーを使用） |

---

## 2. Supabaseセキュリティ（RLS）

> 出典: [supabase_security_report_260214.md](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/supabase_security_report_260214.md)

### 2-1. 現状（2026-02-14時点）

| 項目 | 状態 |
|------|------|
| RLS有効化（receipts, audit_logs） | ✅済 |
| ポリシー内容 | ⚠️ `USING(true)` — 過度に寛大（開発用） |
| search_path修正 | ✅済 |

### 2-2. Phase B実装時の必須対応

```sql
-- 開発用ポリシーを削除し、client_idベースに置換
DROP POLICY IF EXISTS "Dev: All operations for authenticated users" ON public.receipts;

CREATE POLICY "Users can access their client data"
ON public.receipts FOR ALL TO authenticated
USING (client_id IN (SELECT client_id FROM user_client_access WHERE user_id = auth.uid()))
WITH CHECK (client_id IN (SELECT client_id FROM user_client_access WHERE user_id = auth.uid()));
```

### 2-3. チェックリスト

- [ ] `user_client_access`テーブル作成（ユーザーと顧問先の紐付け）
- [ ] 全テーブルにclient_idベースRLSポリシー設定
- [ ] audit_logsはSELECTのみ + SECURITY DEFINER関数経由INSERT
- [ ] Security Advisorで警告0件確認

---

## 3. 環境変数・シークレット管理

> 出典: [environment_security.md](file:///C:/dev/receipt-app/docs/genzai/08_infrastructure/environment_security.md)

### 3-1. 未解決インフラ課題

| ID | 課題 | 対応時期 |
|----|------|---------|
| IS-1 | Firebase CLI認証エラー | Phase B開始時 |
| IS-2 | ggshield pre-commit hook未インストール | ✅2026-03-08で動作確認済（GitGuardian検出あり） |
| IS-3 | receiptsテーブルRLSポリシー過剰許可 | Phase B（§2参照） |

### 3-2. `.env`管理ルール

```bash
# .env（.gitignoreに含める — 絶対にコミットしない）
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

- `.env`はローカルのみ。Vercel/Netlifyのダッシュボードで環境変数を設定
- `VITE_`プレフィックスの環境変数はフロント公開されるため、anon_keyのみ。service_role_keyは絶対にフロントに置かない

---

## 4. DB設計（journals）

> 出典: [実装ノート.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/実装ノート.md), [migration.sql](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/migration.sql)

### 4-1. モック→本番の主な差分

| フィールド | モック | 本番 |
|-----------|-------|------|
| `client_id` | なし | UUID NOT NULL |
| `status_updated_by/at` | なし | 作業者追跡 |
| `created_at/updated_at` | なし | タイムスタンプ自動 |
| `exported_at/by` | なし | CSV出力管理 |
| `deleted_at/by` | `deleted_at`のみ | `deleted_by`追加 |
| `export_exclude/reason` | labelsベース | 独立カラム |

### 4-2. staff テーブル（新規）

```sql
CREATE TABLE staff (
  uuid          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  UUID NOT NULL REFERENCES auth.users(id),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'general')),
  status        TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
-- パスワードカラムなし。auth.usersテーブルで管理
```

---

## 5. API設計

> 出典: [API設計書.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/API設計書.md)

### 5-1. エンドポイント一覧

| メソッド | パス | ガード句 |
|---------|------|---------|
| GET | `/api/journals` | client_id必須 |
| PUT | `/api/journals/{id}` | exported/deleted不可 |
| DELETE | `/api/journals/{id}` | exported不可（論理削除） |
| POST | `/api/journals/{id}/restore` | — |
| POST | `/api/journals/export` | トランザクション必須 |
| POST | `/api/journals/{id}/mark-read` | — |
| POST | `/api/journals/{id}/toggle-staff-note` | exported不可 |
| POST | `/api/journals/bulk/*` | exportedスキップ方式 |

### 5-2. 最重要ガード句

```typescript
if (journal.status === 'exported') {
  throw new BusinessRuleError('CSV出力済みの仕訳は編集できません', 'EXPORTED_JOURNAL_READONLY');
}
if (journal.deleted_at) {
  throw new BusinessRuleError('ゴミ箱内の仕訳は編集できません', 'DELETED_JOURNAL_READONLY');
}
```

---

## 6. Composable設計パターン（モック→API差替え）

> 出典: Phase Aで確立した3つのcomposable

### 6-1. 確立済みパターン

| composable | ファイル | 提供するもの |
|-----------|---------|------------|
| `useClients()` | `src/features/client-management/composables/useClients.ts` | clientList, activeClients, addClient, updateClient |
| `useStaff()` | `src/features/staff-management/composables/useStaff.ts` | staffList, activeStaff, adminStaff |
| `useProgress()` | `src/features/progress-management/composables/useProgress.ts` | progressRows, monthColumns, getSortValue |

### 6-2. Phase B移行方針

```typescript
// Phase A（現在）: モックデータをrefで保持
const staffList = ref<Staff[]>([
  { uuid: generateStaffUuid(), name: '田中 太郎', ... }
]);

// Phase B: Supabase APIに差替え（外部インターフェース不変）
const staffList = ref<Staff[]>([]);
onMounted(async () => {
  const { data } = await supabase.from('staff').select('*').order('name');
  staffList.value = data ?? [];
});
```

**ポイント**: composableの外部インターフェース（return値）は変えない。内部のデータ取得方法だけ差替え。

---

## 7. 型安全の維持

> 出典: [11_remaining_issues_20260307.md](file:///C:/dev/receipt-app/docs/genzai/11_remaining_issues_20260307.md)

### 7-1. 達成済み

- ESLint `no-explicit-any`: **0件**（150件→0件、2026-03-07完了）
- ESLint `no-unused-vars`: **0件**
- `vue-tsc --noEmit`: **0エラー**

### 7-2. 残存問題

| ID | ファイル | 問題 | 対応方針 |
|----|---------|------|---------| 
| J1 | `ScreenE_Workbench.vue` | テンプレートとJournalEntryUi型の全面不整合 | Screen E全面再設計時 |
| J7 | `VertexAIStrategy.ts` | private locationが未読み取り | 将来使用予定。現状維持 |

### 7-3. receipt→document リネーム

- **A2（ドメインモデル層）**: 27ファイル修正済み
- **A3（修正不要）**: AI分類の`RECEIPT`はドメイン用語として正当
- **DB層**: `receipts`テーブル名はDB互換維持（変更不要）

---

## 8. UI実装の申し送り

> 出典: セッションログ（2026-03-04, 2026-03-07, 2026-03-08）

### 8-1. マスタUI設計ルール

| ルール | 内容 |
|-------|------|
| デフォルト行 | 🔒鍵アイコン + 👁目マーク（非表示化のみ、削除不可） |
| カスタム行 | 🗑ゴミ箱 + 👁目マーク（物理削除可、confirmダイアログ必須） |
| 一括操作 | 表示化 / 非表示化 / 削除 / コピー / 追加 |
| isCustomフラグ | Account型・TaxCategory型に追加済み |

### 8-2. 仕訳一覧UI

| 機能 | 状態 | 補足 |
|------|------|------|
| 23列表示 | ✅完了 | — |
| null表示（未確定/空白） | ✅完了 | on_document分岐ホバー付き |
| ステータスフィルタ（未出力/出力済/対象外/ゴミ箱） | ✅完了 | チェックボックス式 |
| **証票種別フィルタ** | ✅完了（2026-03-08） | 全て/領収書/請求書/通帳/クレカ/交通費/医療費 |
| 一括操作（既読/対象外/コピー/ゴミ箱） | ✅完了 | exportedスキップ方式 |
| プルダウン化（D7-D8） | ⬜未着手 | マスタUI（K1-K4）完了後 |
| nullセル赤枠（D10） | ⬜未着手 | 同上 |

### 8-3. ナビバー

- 全ページ共通の上部バー（`MockNavBar.vue`）
- ロゴ + 管理メニュー5項目（進捗管理/顧問先管理/スタッフ管理/マスタ管理/想定費用/設定管理）

---

## 9. composable化タスク進捗

> 出典: [10_nullable_on_document_plan.md](file:///C:/dev/receipt-app/docs/genzai/10_nullable_on_document_plan.md)

| ページ | composable | 状態 |
|-------|-----------|------|
| 顧問先管理 | `useClients()` | ✅完了（K10-K14） |
| スタッフ管理 | `useStaff()` | ✅完了 |
| 進捗管理 | `useProgress()` | ✅完了（K21-K26） |
| 仕訳一覧 | `useJournals()` | ⬜未着手（Phase B優先度高） |
| 勘定科目マスタ | `useAccounts()` | ⬜未着手 |
| 税区分マスタ | `useTaxCategories()` | ⬜未着手 |

---

## 10. Phase Bセキュリティチェックリスト

Phase B実装開始時に以下を全て確認すること:

### 認証・パスワード
- [ ] `useStaff.ts`のモックデータが完全に除去されていること
- [ ] `Staff`型にpasswordフィールドがないこと（✅済）
- [ ] Supabase Auth連携が正しく実装されていること
- [ ] `.env`ファイルがgitignoreに含まれていること

### RLS
- [ ] 全テーブルにclient_idベースRLSポリシー設定
- [ ] 開発用`USING(true)`ポリシーを削除
- [ ] Security Advisor警告0件

### API
- [ ] 全エンドポイントにexportedガード句
- [ ] CSV出力はトランザクション処理（RPC）
- [ ] エラーレスポンスにpassthroughデータなし

### インフラ
- [ ] GitGuardian pre-commitフック有効
- [ ] Firebase CLI再認証
- [ ] 環境変数にservice_role_keyが含まれていないこと

---

## 11. 関連ドキュメント索引

| ファイル | 内容 |
|---------|------|
| [10_nullable_on_document_plan.md](file:///C:/dev/receipt-app/docs/genzai/10_nullable_on_document_plan.md) | 全作業項目・進捗管理（29/69完了） |
| [11_remaining_issues_20260307.md](file:///C:/dev/receipt-app/docs/genzai/11_remaining_issues_20260307.md) | 残存修正項目（全件完了） |
| [実装ノート.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/実装ノート.md) | Phase 5 Supabase実装手順 |
| [API設計書.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/API設計書.md) | 仕訳API全エンドポイント |
| [migration.sql](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/migration.sql) | DDL（journals/journal_entries/export_batches） |
| [environment_security.md](file:///C:/dev/receipt-app/docs/genzai/08_infrastructure/environment_security.md) | インフラ・セキュリティ未解決事項 |
| [supabase_security_report_260214.md](file:///C:/dev/receipt-app/docs/genzai/01_tools_and_setups/supabase_security_report_260214.md) | Supabase RLS診断・修正履歴 |
| [SESSION_20260304](file:///C:/dev/receipt-app/docs/sessions/SESSION_20260304_nullUI改善とナビバー整備.md) | nullUI + ナビバー実装セッション |
| [SESSION_20260307](file:///C:/dev/receipt-app/docs/sessions/SESSION_20260307_マスタUI改修.md) | マスタUI改修セッション |

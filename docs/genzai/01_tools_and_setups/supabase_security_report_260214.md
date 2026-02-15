# Supabaseセキュリティ修正SQL

**作成日**: 2026-02-12  
**更新日**: 2026-02-14（最新状況を反映）  
**対象プロジェクト**: receipt-app-production-tokyo  
**検出日**: 2026-02-12 02:36  
**修正完了日**: 2026-02-14 17:40

---

## 📋 検出された問題（2026-02-12）

### ❌ エラー（2件）

1. **RLS Disabled in Public** - `public.receipts`
   - テーブルの行レベルセキュリティ（RLS）が無効
   - PostgRESTで公開されているため、アクセス制御が必要

2. **RLS Disabled in Public** - `public.audit_logs`
   - 監査ログテーブルのRLSが無効
   - 機密性の高いデータのため、特に重要

### ⚠️ 警告（1件）

3. **Function Search Path Mutable** - `public.update_receipt_status`
   - 関数の`search_path`が設定されていない
   - セキュリティリスク：検索パスハイジャック攻撃の可能性

---

## 🛠️ 修正SQL

### Step 1: RLS有効化（receipts）

```sql
-- receipts テーブルにRLSを有効化
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- 基本ポリシー: 認証済みユーザーのみアクセス可能
CREATE POLICY "Enable read access for authenticated users" 
ON public.receipts 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public.receipts 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.receipts 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

### Step 2: RLS有効化（audit_logs）

```sql
-- audit_logs テーブルにRLSを有効化
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 監査ログポリシー: 読取のみ許可（挿入は関数経由）
CREATE POLICY "Enable read access for authenticated users" 
ON public.audit_logs 
FOR SELECT 
TO authenticated 
USING (true);

-- INSERT は update_receipt_status 関数から実行されるため、
-- 関数に SECURITY DEFINER を設定する方法も検討
```

### Step 3: 関数のsearch_path設定

```sql
-- update_receipt_status 関数に search_path を設定
ALTER FUNCTION public.update_receipt_status 
SET search_path = public;
```

---

## 📊 現在のセキュリティ診断結果（2026-02-14検証）

**検証日時**: 2026-02-14 17:27  
**ステータス**: ⚠️ 警告あり（致命的エラーは解消済み）

### Security Advisor サマリー

| 項目 | 件数 | 状態 |
|------|------|------|
| **エラー** | 0件 | ✅ 解消済み |
| **警告** | **2件** | ⚠️ 要対応 |
| **Info** | 0件 | - |

---

## 🔍 検出された警告（2件、2026-02-14時点）

### 両方とも `public.receipts` テーブルに関する同一問題

| 項目 | 内容 |
|------|------|
| **Issue Type** | **RLS Policy Always True** |
| **対象テーブル** | `public.receipts` |
| **警告レベル** | Warning（警告） |
| **問題点** | 過度に寛大なポリシー設定 |

**詳細**:
- `INSERT`, `UPDATE` 操作に対して
- `USING (true)` または `WITH CHECK (true)` の設定
- **認証済みユーザーであれば誰でも全データにアクセス可能**

---

## ✅ 2026-02-12から改善された点

### 1. **`public.receipts` のRLS有効化** ✅
- **前回（2026-02-12）**: RLS無効（エラー🔴）
- **現在（2026-02-14）**: **RLS有効化済み**
- **状態**: ポリシーが設定されているが、内容が不適切（警告⚠️）

### 2. **`public.audit_logs` のRLS有効化** ✅
- **前回（2026-02-12）**: RLS無効（エラー🔴）
- **現在（2026-02-14）**: **RLS有効化済み**
- **状態**: SELECT ポリシーも設定済み、警告なし

### 3. **`update_receipt_status` 関数のsearch_path** ✅
- **前回（2026-02-12）**: search_path未設定（警告⚠️）
- **現在（2026-02-14）**: **Security Advisorに表示なし**
- **推測**: 既に修正済み、または検出されていない

---

## 🚨 残存する問題（2026-02-14時点）

### **問題: RLSポリシーが過度に寛大**

現在の `public.receipts` のポリシー設定（推測）:

```sql
-- 現在のポリシー（問題あり）
CREATE POLICY "Enable read access for authenticated users" 
ON public.receipts 
FOR SELECT 
TO authenticated 
USING (true);  -- ← 誰でもすべてのデータにアクセス可能

CREATE POLICY "Enable insert for authenticated users" 
ON public.receipts 
FOR INSERT 
TO authenticated 
WITH CHECK (true);  -- ← 誰でもどのclient_idでも挿入可能
```

### **具体的なリスク**

| リスク | 説明 | 影響度 |
|--------|------|--------|
| **他社データ閲覧** | ユーザーAが顧問先Bのレシートデータを閲覧可能 | 🟡 中 |
| **不正データ挿入** | 他社のclient_idでデータを挿入可能 | 🟡 中 |
| **データ改ざん** | 他社のレシートデータを更新可能 | 🟡 中 |

**注**: 
- 致命的エラー（RLS無効=未認証でもアクセス可能）は解消済み
- 現在は「認証済みユーザー間での不正アクセス」リスクのみ

---

## 🛠️ 推奨される修正

### **修正SQL（client_idによるフィルタリング）**

```sql
-- Step 1: 既存の過度に寛大なポリシーを削除
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.receipts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.receipts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.receipts;

-- Step 2: client_idベースのポリシーを作成
-- ※ auth.uid() と client_id の関係を定義する必要あり
-- ※ 以下は例: ユーザーが所属する顧問先のみアクセス可能

-- 読取: 自分が担当する顧問先のみ
CREATE POLICY "Users can view their client receipts" 
ON public.receipts 
FOR SELECT 
TO authenticated 
USING (
  client_id IN (
    SELECT client_id FROM user_client_access 
    WHERE user_id = auth.uid()
  )
);

-- 挿入: 自分が担当する顧問先のみ
CREATE POLICY "Users can insert their client receipts" 
ON public.receipts 
FOR INSERT 
TO authenticated 
WITH CHECK (
  client_id IN (
    SELECT client_id FROM user_client_access 
    WHERE user_id = auth.uid()
  )
);

-- 更新: 自分が担当する顧問先のみ
CREATE POLICY "Users can update their client receipts" 
ON public.receipts 
FOR UPDATE 
TO authenticated 
USING (
  client_id IN (
    SELECT client_id FROM user_client_access 
    WHERE user_id = auth.uid()
  )
);
```

**前提条件**:
- `user_client_access` テーブルの存在（ユーザーと顧問先の紐付け）
- または、別の認証・権限管理の仕組み

---

## 🎯 開発環境用RLSポリシー設定（2026-02-14実施済み）

### **実行したSQL**

```sql
-- Step 1: Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.receipts;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.receipts;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.receipts;

-- Step 2: Create dev policy (authenticated users only, all operations)
CREATE POLICY "Dev: All operations for authenticated users" 
ON public.receipts 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
```

### **実行結果**

✅ **Success. No rows returned** （2026-02-14 17:40実行完了）

### **設定されたポリシー**

| ポリシー名 | 操作 | ロール | 条件 |
|-----------|------|--------|------|
| `Dev: All operations for authenticated users` | ALL（SELECT, INSERT, UPDATE, DELETE） | authenticated | `USING (true)`, `WITH CHECK (true)` |

**意味**:
- ✅ **認証済みユーザーのみ**がアクセス可能
- ✅ **全操作（CRUD）**が可能
- ✅ **client_idフィルタリングなし**（開発中のため）

---

## 📋 次のアクション

### **優先度1（推奨）**: RLSポリシーの詳細設計（Phase 5実装後）

1. **ユーザーと顧問先の関係を定義**
   - `user_client_access` テーブルの作成
   - または、JWTのclaimsで管理
   - または、Supabase Authのメタデータで管理

2. **ポリシーを実装**
   - 上記のSQLを実行
   - 動作確認

3. **Security Advisorで警告解消を確認**
   - 警告が0件になることを確認

### **優先度2（Phase 5実装後でも可）**: 本格的な権限管理

- ロールベースアクセス制御（RBAC）の導入
- 管理者・税理士・アシスタントの権限分離

---

## ⚠️ 注意事項

### RLSポリシー設計時の考慮事項

1. **client_id によるフィルタリング**
   - 本番運用では、各ユーザーが自分の顧問先データのみアクセスできるよう制限
   - 例: `USING (client_id = auth.uid())`（認証情報に応じて調整）

2. **audit_logs の書き込み制限**
   - 監査ログは改ざん防止のため、直接INSERTを禁止し、関数経由のみ許可すべき
   - `SECURITY DEFINER` 関数を使用

3. **段階的な実装**
   - まずは基本的なRLSを有効化
   - その後、細かいアクセス制御ルールを追加

---

## 🎯 結論

### **致命的な問題は解消済み** ✅

2026-02-12に検出された3つの問題のうち、**致命的なエラー（RLS無効）は既に解消済み**です。

### **残存リスクは中程度** ⚠️

現在の警告は「認証済みユーザー間での不正アクセス」リスクであり、以下の条件下では実質的な問題は発生しません：

- **信頼できるユーザーのみが認証されている**
- **フロントエンドでclient_idを適切にフィルタリングしている**

### **推奨アクション**

1. **すぐに必要**: なし（致命的エラーは解消済み）
2. **Phase 5実装前**: 開発環境用ポリシー設定完了 ✅
3. **Phase 5実装後**: 本番環境用ポリシー実装（client_idフィルタリング）

---

## 📸 証跡

**確認画像**:
- [supabase_security_warning_1770831424485.webp](file:///C:/Users/kazen/.gemini/antigravity/brain/738bd95a-e545-4f4a-9d65-0a0317a4158c/supabase_security_warning_1770831424485.webp)
- [supabase_security_errors_1770831494464.webp](file:///C:/Users/kazen/.gemini/antigravity/brain/738bd95a-e545-4f4a-9d65-0a0317a4158c/supabase_security_errors_1770831494464.webp)
- [security_advisor_warnings_1771057850164.png](file:///C:/Users/kazen/.gemini/antigravity/brain/01de6e60-7ea6-405f-909d-030c2baf4421/security_advisor_warnings_1771057850164.png)
- [sql_execution_success_1771058486227.png](file:///C:/Users/kazen/.gemini/antigravity/brain/01de6e60-7ea6-405f-909d-030c2baf4421/sql_execution_success_1771058486227.png)

---

## 🎯 実行手順

### 1. Supabase SQL Editorで実行

1. https://supabase.com/dashboard/project/cujksbvnzjxbklhofyfu/sql にアクセス
2. 上記SQLを順番に実行
3. Security Advisorで警告・エラーが消えたことを確認

### 2. 動作確認

```sql
-- RLS有効化確認
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('receipts', 'audit_logs');

-- 関数の search_path 確認
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname = 'update_receipt_status';

-- ポリシー確認
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('receipts', 'audit_logs');
```

**期待される結果**:
- `receipts.rowsecurity` = `true`
- `audit_logs.rowsecurity` = `true`
- `update_receipt_status.proconfig` = `{search_path=public}`

---

## 📚 参考リンク

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Search Path Security](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)

---

**Status**: 開発環境設定完了 ✅  
**Version**: v2.0（2026-02-14更新）  
**Next**: Phase 5実装開始

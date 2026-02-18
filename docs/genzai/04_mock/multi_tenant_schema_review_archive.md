# マルチテナント対応スキーマ設計レビュー

## 🎯 ユーザーの質問

1. **顧問先ID、担当者ID、作業者IDなどは既に設計されているか？**
2. **実装の際に追加すべきか？**
3. **実装の際に記載しておくべき事項とは？**
4. **TypeScriptを見ればわかるからMD作成は不要か？**

## 📊 現状分析結果

### ✅ 設計書には含まれている（journal_v2_20260214.md）

[journal_v2_20260214.md:L163-228](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v2_20260214.md#L163-228)

```sql
CREATE TABLE journals (
  -- 基本情報
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,              -- ✅ 顧問先ID（設計済み）
  receipt_id UUID REFERENCES receipts(id),
  
  -- status管理（協力型フロー）
  status journal_status NOT NULL DEFAULT 'pending',
  status_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status_updated_by UUID NOT NULL REFERENCES users(id),  -- ✅ 作業者ID（設計済み）
  
  -- 出力管理
  exported_by VARCHAR(100) NULL,         -- ✅ 出力者（設計済み）
  
  -- ゴミ箱
  deleted_by VARCHAR(100) NULL,          -- ✅ 削除者（設計済み）
  
  -- メモ機能
  memo_author VARCHAR(100) NULL,         -- ✅ メモ作成者（設計済み）
  memo_target VARCHAR(100) NULL          -- ✅ メモ対象者（設計済み）
);
```

### ❌ 現在のモック型定義には含まれていない

[journal_phase5_mock.type.ts:L70-106](file:///C:/dev/receipt-app/src/mocks/types/journal_phase5_mock.type.ts#L70-106)

現在のモック型定義で**欠落しているフィールド**:

| フィールド | 型 | 目的 | 設計書 | モック |
|----------|----|----|-------|-------|
| `client_id` | UUID | 顧問先ID（マルチテナント必須） | ✅ | ❌ |
| `status_updated_by` | UUID | ステータス変更者ID | ✅ | ❌ |
| `status_updated_at` | TIMESTAMP | ステータス変更日時 | ✅ | ❌ |
| `created_at` | TIMESTAMP | 作成日時 | ✅ | ❌ |
| `updated_at` | TIMESTAMP | 更新日時 | ✅ | ❌ |
| `read_at` | TIMESTAMP | 既読日時 | ✅ | ❌ |
| `exported_at` | TIMESTAMP | 出力日時 | ✅ | ❌ |
| `exported_by` | VARCHAR | 出力者 | ✅ | ❌ |
| `export_exclude` | BOOLEAN | 出力対象外フラグ | ✅ | ❌ |
| `export_exclude_reason` | VARCHAR | 出力対象外理由 | ✅ | ❌ |
| `deleted_at` | TIMESTAMP | 削除日時 | ✅ | ❌ |
| `deleted_by` | VARCHAR | 削除者 | ✅ | ❌ |

## 💡 推奨アクション

### 1. Supabase実装時に追加すべきフィールド

**Phase 5実装時（Supabase移行時）に必ず追加**:

```typescript
export interface Journal {
  // 基本情報
  id: string;                           // UUID
  client_id: string;                    // 顧問先ID（マルチテナント必須）
  display_order: number;
  transaction_date: string;
  description: string;
  receipt_id: string | null;

  // ステータス管理
  status: JournalStatusPhase5;
  status_updated_at: string;            // ISO 8601
  status_updated_by: string;            // ユーザーID
  
  // タイムスタンプ
  created_at: string;                   // ISO 8601
  updated_at: string;                   // ISO 8601
  
  // 未読/既読
  is_read: boolean;
  read_at: string | null;               // ISO 8601
  
  // N対N複合仕訳
  debit_entries: JournalEntryLine[];
  credit_entries: JournalEntryLine[];
  
  // ラベル
  labels: JournalLabelPhase5[];
  
  // ルール関連
  rule_id: string | null;
  rule_confidence: number | null;
  
  // インボイス関連
  invoice_status: 'qualified' | 'not_qualified' | null;
  invoice_number: string | null;
  
  // メモ関連
  memo: string | null;
  memo_author: string | null;
  memo_target: string | null;
  memo_created_at: string | null;       // ISO 8601
  
  // 出力管理
  exported_at: string | null;           // ISO 8601
  exported_by: string | null;
  export_exclude: boolean;
  export_exclude_reason: string | null;
  
  // ゴミ箱
  deleted_at: string | null;            // ISO 8601
  deleted_by: string | null;
}
```

### 2. モック段階での対応方針

**現在のモック段階では**:
- ✅ UIテストに不要なフィールドは省略してOK
- ✅ `client_id`、`status_updated_by`などは固定値で問題なし
- ❌ ただし、**Supabase実装時には必須**

### 3. ドキュメント戦略

#### ❌ NG: TypeScriptだけでは不十分

理由:
- TypeScriptは「型」を定義するだけ
- **ビジネスロジック**（例: exportedは編集不可）が不明
- **制約条件**（例: CHECK制約）が不明
- **インデックス戦略**が不明

#### ✅ 推奨: マークダウン設計書は必須

[journal_v2_20260214.md](file:///C:/dev/receipt-app/docs/genzai/02_database_schema/journal/journal_v2_20260214.md)のような設計書が必要:

1. **ビジネスロジックの記載**
   - exportedは編集不可
   - status遷移ルール
   - 背景色ロジック

2. **制約条件の記載**
   - CHECK制約4つ
   - UNIQUE制約
   - 外部キー制約

3. **インデックス戦略**
   - 7個のインデックス定義
   - 部分インデックスの使用判断

4. **設計判断の根拠**
   - なぜこの設計にしたか
   - 何を採用し、何を却下したか

## 📝 実装の際に記載すべき事項

### 必須ドキュメント

1. **migration.sql**（Supabase移行スクリプト）
   ```sql
   -- テーブル作成
   CREATE TABLE journals (...);
   
   -- ENUM型定義
   CREATE TYPE journal_status AS ENUM (...);
   
   -- CHECK制約
   ALTER TABLE journals ADD CONSTRAINT ...;
   
   -- インデックス
   CREATE INDEX ...;
   ```

2. **実装ノート.md**（移行時の注意事項）
   - モック→Supabaseの差分
   - データマイグレーション手順
   - テストデータの投入方法

3. **API設計書.md**（APIエンドポイント定義）
   - GET /journals（一覧取得）
   - PUT /journals/:id（更新）
   - POST /journals/export（CSV出力）
   - ガード句の実装箇所

## ✅ 結論

### 質問への回答

1. **顧問先ID等は設計されているか？** 
   - ✅ はい、journal_v2_20260214.mdに完全に設計済み

2. **実装の際に追加すべきか？**
   - ✅ Supabase実装時に必ず追加する
   - ⚠️ モック段階では省略してOK（UIテストに不要なため）

3. **実装の際に記載すべき事項は？**
   - migration.sql（DDL）
   - 実装ノート.md（移行手順）
   - API設計書.md（ガード句含む）

4. **TypeScriptだけで十分か？**
   - ❌ 不十分
   - ✅ マークダウン設計書は必須（ビジネスロジック、制約、インデックス戦略を記載）

### 次のステップ

**今すぐ**: モック開発を継続（現在の型定義で問題なし）

**Supabase実装前**:
1. journal_phase5.type.ts（本番用）を作成
2. migration.sqlを作成
3. 実装ノート.mdを作成
4. テストデータ投入スクリプトを作成

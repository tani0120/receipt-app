# Phase 4 完全スキーマ定義 v1.0

**作成日**: 2026-02-11  
**目的**: Phase 4で実装すべき完全なスキーマ定義（議論で網羅した全項目）  
**思想**: 業務効率SaaS、MF拡張レイヤー

---

## 🎯 設計思想

### 責任範囲の明確化

| システム | 責任範囲 | 境界線 |
|---------|---------|--------|
| **本システム** | 仕訳作成〜CSV出力まで | `exported` status |
| **マネーフォワード** | CSV取り込み後〜決算確定まで | インポート完了 |

**原則**:
- ✅ MFが会計の真実（Source of Truth）
- ✅ 本システムは業務効率・統制レイヤー
- ❌ 完全同期しない（差分検知のみ）

---

## 📊 1. status定義（5つ）

### ENUM型定義

```sql
CREATE TYPE journal_status AS ENUM (
  'draft',
  'submitted',
  'needs_info',
  'approved',
  'exported'
);
```

### 詳細定義

| status | 日本語 | 意味 | 編集可否 | 責任範囲 |
|--------|--------|------|----------|----------|
| `draft` | 下書き | 作業中 | ✅ 可能 | 本システム |
| `submitted` | 提出済み | 上席確認待ち | ✅ 可能 | 本システム |
| `needs_info` | 判断保留 | 情報不足 | ✅ 可能 | 本システム |
| `approved` | 承認済み | 上席確認完了 | ✅ 可能 | 本システム |
| `exported` | 出力済み | CSV出力完了 | ❌ 不可 | MFへ引き渡し完了 |

### 状態遷移図

```
draft ──submit──> submitted ──approve──> approved ──export──> exported
  ↑                   |                      |
  |                   |                      |
  └───────────── needs_info ←───────────────┘
```

### 遷移ルール

| 現在 | 可能な遷移 | トリガー |
|------|-----------|---------|
| `draft` | → `submitted` | スタッフが「提出」 |
| `submitted` | → `approved`<br>→ `needs_info`<br>→ `draft` | 上席が「承認」<br>上席が「保留」<br>スタッフが「取り下げ」 |
| `needs_info` | → `submitted` | スタッフが情報追加後「再提出」 |
| `approved` | → `exported`<br>→ `needs_info` | CSV出力（自動）<br>上席が「修正依頼」 |
| `exported` | （遷移不可） | 完了状態 |

---

## 🏷️ 2. label定義（9つ）

### TypeScript型定義

```typescript
type JournalLabel = 
  | 'MULTI_TAX'          // 軽減税率混在
  | 'LOW_OCR_CONF'       // OCR信頼度低
  | 'OUT_OF_PERIOD'      // 期間外
  | 'DUPLICATE_SUSPECT'  // 重複疑い
  | 'NEEDS_REVIEW'       // 手動レビュー推奨
  | 'HIGH_AMOUNT'        // 高額取引
  | 'TAX_RISKY'          // 税務リスク科目
  | 'VENDOR_UNKNOWN'     // 取引先不明
  | 'RULE_CONFLICT';     // ルール競合
```

### 詳細定義

| label | 日本語 | 用途 | 自動付与条件 |
|-------|--------|------|-------------|
| `MULTI_TAX` | 軽減税率混在 | 標準・軽減混在の警告 | 同一証票に複数税率 |
| `LOW_OCR_CONF` | OCR信頼度低 | OCR確度不足の警告 | confidence < 0.7 |
| `OUT_OF_PERIOD` | 期間外 | 会計期間外の警告 | 取引日が期間外 |
| `DUPLICATE_SUSPECT` | 重複疑い | 重複可能性の警告 | ハッシュ一致 |
| `NEEDS_REVIEW` | 手動レビュー推奨 | 人間確認推奨 | ルール適用失敗 |
| `HIGH_AMOUNT` | 高額取引 | 100万円超の警告 | amount > 1,000,000 |
| `TAX_RISKY` | 税務リスク科目 | 税務調査対象科目 | 交際費、寄付金等 |
| `VENDOR_UNKNOWN` | 取引先不明 | GAマッチング失敗 | vendor解決失敗 |
| `RULE_CONFLICT` | ルール競合 | 複数ルール矛盾 | ルール競合検知 |

### PostgreSQL実装

```sql
-- TEXT配列（GINインデックス可能）
ALTER TABLE journals
ADD COLUMN labels TEXT[] DEFAULT '{}';

-- GINインデックス（高速検索）
CREATE INDEX idx_journals_labels ON journals USING GIN(labels);
```

---

## 🔒 3. readonly定義

### 基本式

```typescript
readonly = (status === 'exported')
```

### 理由

- **`exported` = CSV出力完了 = MFへ引き渡し完了**
- 本システムの責任範囲外
- 修正はMF側で実施

### Phase 5での拡張（予定）

```typescript
function isJournalEditable(
  journal: Journal, 
  context?: { periodClosed?: boolean; user?: User }
): boolean {
  if (journal.status === 'exported') return false;
  if (context?.periodClosed) return false;  // 期間締め
  if (!context?.user?.hasPermission('edit')) return false;  // 権限
  return true;
}
```

---

## 📋 4. journals テーブル完全スキーマ

### CREATE TABLE文

```sql
CREATE TABLE journals (
  -- 基本情報
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  receipt_id UUID REFERENCES receipts(id),
  
  -- status管理（Phase 4で使う）
  status journal_status NOT NULL DEFAULT 'draft',
  status_updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status_updated_by UUID NOT NULL REFERENCES users(id),
  
  -- 各statusへの遷移日時（Phase 4で使う）
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  exported_at TIMESTAMP,
  
  -- 承認者（Phase 4で使う）
  approved_by UUID REFERENCES users(id),
  
  -- label（Phase 4で使う）
  labels TEXT[] DEFAULT '{}',
  
  -- 楽観ロック（Phase 4で使う）
  version INTEGER NOT NULL DEFAULT 1,
  
  -- 論理削除（Phase 4で使う）
  deleted_at TIMESTAMP,
  deleted_by UUID,
  
  -- MF連携（遠い将来用、Phase 4ではNULL）
  mf_external_id TEXT,
  mf_sync_status VARCHAR(20),
  mf_last_synced_at TIMESTAMP,
  mf_modified_flag BOOLEAN DEFAULT false,
  mf_last_hash TEXT,
  
  -- 仕訳データ（省略）
  amount NUMERIC NOT NULL,
  debit_account VARCHAR(50),
  credit_account VARCHAR(50),
  description TEXT
);
```

### カラム一覧と用途

| カラム | 型 | Phase 4 | 用途 |
|--------|----|---------| -----|
| `id` | UUID | ✅ | 主キー |
| `client_id` | UUID | ✅ | 顧問先ID |
| `receipt_id` | UUID | ✅ | 証票ID |
| `status` | ENUM | ✅ | 現在の状態 |
| `status_updated_at` | TIMESTAMP | ✅ | 最終status更新日時 |
| `status_updated_by` | UUID | ✅ | 最終更新者 |
| `created_at` | TIMESTAMP | ✅ | 作成日時（不変） |
| `updated_at` | TIMESTAMP | ✅ | 最終更新日時 |
| `submitted_at` | TIMESTAMP | ✅ | submitted遷移日時 |
| `approved_at` | TIMESTAMP | ✅ | approved遷移日時 |
| `exported_at` | TIMESTAMP | ✅ | exported遷移日時 |
| `approved_by` | UUID | ✅ | 承認者ID |
| `labels` | TEXT[] | ✅ | 9つのlabel |
| `version` | INTEGER | ✅ | 楽観ロック（同時編集防止） |
| `deleted_at` | TIMESTAMP | ✅ | 論理削除日時 |
| `deleted_by` | UUID | ✅ | 削除者ID |
| `mf_external_id` | TEXT | ❌ | MF連携ID（将来用） |
| `mf_sync_status` | VARCHAR | ❌ | 同期状態（将来用） |
| `mf_last_synced_at` | TIMESTAMP | ❌ | 最終同期日時（将来用） |
| `mf_modified_flag` | BOOLEAN | ❌ | MF側修正フラグ（将来用） |
| `mf_last_hash` | TEXT | ❌ | 差分検知用ハッシュ（将来用） |

**合計**: 22カラム（仕訳データ除く）

---

## 📦 5. export管理テーブル

### export_batches テーブル

```sql
CREATE TABLE export_batches (
  id UUID PRIMARY KEY,
  client_id UUID NOT NULL,
  exported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  exported_by UUID NOT NULL REFERENCES users(id),
  journal_count INTEGER NOT NULL,
  filename TEXT NOT NULL
);
```

**用途**: CSV出力の履歴管理（いつ、誰が、何件）

### journal_exports テーブル

```sql
CREATE TABLE journal_exports (
  id UUID PRIMARY KEY,
  journal_id UUID NOT NULL REFERENCES journals(id),
  export_batch_id UUID NOT NULL REFERENCES export_batches(id),
  exported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(journal_id, export_batch_id)
);
```

**用途**: 仕訳とバッチの紐付け（N対N）

---

## 🔄 6. CSV出力フロー

### 処理手順

```typescript
async function exportToCSV(clientId: string, userId: string) {
  // 1. approved のみ取得
  const journals = await db.journals.findMany({
    where: { 
      clientId,
      status: 'approved'  // exported は含まない
    }
  });
  
  // 2. CSV生成
  const csv = generateMFCSV(journals);
  
  // 3. ファイル名（日時を含む）
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `${clientId}_${timestamp}_journals.csv`;
  
  // 4. ダウンロード
  downloadFile(csv, filename);
  
  // 5. 即座に exported に遷移
  await db.journals.updateMany(
    { id: { in: journals.map(j => j.id) } },
    { 
      status: 'exported',
      exported_at: new Date()
    }
  );
  
  // 6. バッチ記録
  await db.exportBatches.create({
    data: {
      clientId,
      exportedBy: userId,
      journalCount: journals.length,
      filename
    }
  });
  
  return { filename, count: journals.length };
}
```

### ファイル名規則

```
{client_id}_{yyyyMMdd_HHmmss}_journals.csv
例: clientA_20261211_143022_journals.csv
```

---

## 🛡️ 7. API層でのガード句（必須）

### 編集防止

```typescript
export async function updateJournal(
  journalId: string, 
  updates: Partial<Journal>,
  context: { userId: string }
): Promise<Journal> {
  const journal = await getJournal(journalId);
  
  // exported は編集不可
  if (journal.status === 'exported') {
    throw new BusinessRuleError(
      'CSV出力済みの仕訳は編集できません。' +
      'MF側で修正するか、管理者に問い合わせてください。',
      'EXPORTED_JOURNAL_READONLY'
    );
  }
  
  // 楽観ロック
  if (journal.version !== updates.version) {
    throw new ConflictError('他のユーザーが更新しました');
  }
  
  return await db.journals.update(journalId, {
    ...updates,
    version: journal.version + 1
  });
}
```

---

## 🎨 8. UI表示仕様

### status表示

| status | ラベル | 色 | アイコン |
|--------|--------|----|---------| 
| `draft` | 下書き | グレー | edit |
| `submitted` | 提出済み | ブルー | send |
| `needs_info` | 判断保留 | イエロー | warning |
| `approved` | 承認済み | グリーン | check |
| `exported` | 出力済み | パープル | download |

### Composable実装

```typescript
// composables/useJournalStatus.ts
export function useJournalStatus(status: JournalStatus) {
  const label = computed(() => {
    const labels: Record<JournalStatus, string> = {
      draft: '下書き',
      submitted: '提出済み',
      needs_info: '判断保留',
      approved: '承認済み',
      exported: '出力済み'
    };
    return labels[status];
  });
  
  const color = computed(() => {
    const colors: Record<JournalStatus, string> = {
      draft: 'gray',
      submitted: 'blue',
      needs_info: 'yellow',
      approved: 'green',
      exported: 'purple'
    };
    return colors[status];
  });
  
  const isEditable = computed(() => status !== 'exported');
  
  return { label, color, isEditable };
}
```

---

## ⏰ 9. Phase 4 vs Phase 5 vs 遠い将来の切り分け

### Phase 4（今すぐ実装）

| 項目 | 実装 |
|------|------|
| status 5つの型定義 | ✅ |
| label 9つの型定義 | ✅ |
| タイムスタンプカラム | ✅ |
| export管理テーブル | ✅ |
| readonly API層ガード | ✅ |
| 楽観ロック | ✅ |
| 論理削除 | ✅ |
| MF連携カラム定義のみ | ✅（使わない） |

### Phase 5（将来実装）

| 項目 | 内容 |
|------|------|
| readonly関数化 | 期間締め、権限チェック追加 |
| PostgreSQL Trigger | exported編集禁止の最終防御 |
| 管理者による巻き戻し | exported → approved |
| MF差分検知 | API連携、ハッシュ比較 |

### 遠い将来（MF API連携後）

| 項目 | 内容 |
|------|------|
| `mf_external_id` | MFのjournal ID保存 |
| `mf_sync_status` | 同期状態管理 |
| `mf_modified_flag` | MF側修正警告 |
| `mf_last_hash` | 差分検知 |

---

## 🚨 10. 重要な設計判断

### ✅ 確定事項

1. **exported は編集不可**（Phase 4から厳格）
2. **MFが会計の真実**（本システムは業務レイヤー）
3. **完全同期しない**（差分検知のみ）
4. **CSV出力 = バッチ管理**（1仕訳ずつではない）
5. **ファイル名に日時含む**（重複防止）

### ❌ やらないこと

1. ❌ MF側の修正を自動同期
2. ❌ exported の自動巻き戻し
3. ❌ 仕訳番号の厳密管理
4. ❌ CSV差分管理
5. ❌ リアルタイム双方向同期

---

## 📝 11. CHECK制約（参考）

```sql
-- Phase 5で追加候補
ALTER TABLE journals
ADD CONSTRAINT journals_status_timestamps_check
CHECK (
  (status = 'submitted' AND submitted_at IS NOT NULL) OR
  (status = 'approved' AND approved_at IS NOT NULL AND approved_by IS NOT NULL) OR
  (status = 'exported' AND exported_at IS NOT NULL) OR
  (status IN ('draft', 'needs_info'))
);
```

---

## ✅ 12. 完成条件

Phase 4実装完了の定義：

- [ ] status 5つの型定義実装
- [ ] label 9つの型定義実装
- [ ] journals テーブルに全カラム追加
- [ ] export_batches / journal_exports テーブル作成
- [ ] API層にexportedガード句実装
- [ ] CSV出力時の自動遷移実装
- [ ] UI層にstatus表示実装
- [ ] 楽観ロックの実装

---

**Status**: 設計確定 ✅  
**Next**: Phase 4実装開始

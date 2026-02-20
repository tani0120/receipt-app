# Phase 5 API設計書

## 📋 目的

仕訳管理APIのエンドポイント定義、ガード句、エラーハンドリングを記載

## 🔌 エンドポイント一覧

### 1. 仕訳一覧取得

```typescript
GET /api/journals?client_id={clientId}&status={status}&is_read={boolean}
```

#### リクエスト

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| client_id | UUID | ✅ | 顧問先ID |
| status | string | ❌ | フィルタ（exported） |
| is_read | boolean | ❌ | 未読/既読フィルタ |
| labels | string[] | ❌ | ラベルフィルタ（NEED_DOCUMENT, NEED_CONFIRM等） |
| deleted | boolean | ❌ | ゴミ箱表示（デフォルト: false） |

#### レスポンス

```json
{
  "journals": [
    {
      "id": "uuid",
      "client_id": "uuid",
      "display_order": 1,
      "transaction_date": "2025-01-20",
      "description": "タクシー代",
      "status": null,
      "is_read": false,
      "labels": ["TRANSPORT", "RECEIPT", "NEED_DOCUMENT"],
      "debit_entries": [
        {
          "account": "旅費交通費",
          "sub_account": null,
          "amount": 2500,
          "tax_category": "課税仕入込10%"
        }
      ],
      "credit_entries": [
        {
          "account": "現金",
          "sub_account": null,
          "amount": 2500,
          "tax_category": null
        }
      ],
      "created_at": "2025-01-20T10:00:00Z",
      "updated_at": "2025-01-20T10:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 50
}
```

#### 実装

```typescript
export async function getJournals(params: GetJournalsParams): Promise<JournalsResponse> {
  const { client_id, status, is_read, deleted = false } = params;
  
  let query = supabase
    .from('journals')
    .select(`
      *,
      debit_entries:journal_entries!journal_id(
        id, entry_type, line_number, account, sub_account, amount, tax_category
      ),
      credit_entries:journal_entries!journal_id(
        id, entry_type, line_number, account, sub_account, amount, tax_category
      )
    `, { count: 'exact' })
    .eq('client_id', client_id)
    .order('display_order', { ascending: true });

  // ゴミ箱フィルタ
  if (deleted) {
    query = query.not('deleted_at', 'is', null);
  } else {
    query = query.is('deleted_at', null);
  }

  // ステータスフィルタ
  if (status) {
    query = query.eq('status', status);
  }

  // 未読/既読フィルタ
  if (typeof is_read === 'boolean') {
    query = query.eq('is_read', is_read);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    journals: data as Journal[],
    total: count || 0,
    page: 1,
    per_page: 50
  };
}
```

---

### 2. 仕訳更新

```typescript
PUT /api/journals/{id}
```

#### リクエスト

```json
{
  "labels": ["NEED_CONSULT", "NEED_DOCUMENT"],
  "memo": "この仕訳の勘定科目と資料について教えてください",
  "memo_author": "山田太郎",
  "memo_target": "経理担当者"
}
```

#### レスポンス

```json
{
  "journal": { /* 更新後の仕訳 */ },
  "success": true
}
```

#### ガード句（最重要）

```typescript
export async function updateJournal(
  journalId: string,
  updates: Partial<Journal>,
  context: { userId: string }
): Promise<Journal> {
  // 1. 現在の仕訳を取得
  const { data: current, error: fetchError } = await supabase
    .from('journals')
    .select('status, deleted_at')
    .eq('id', journalId)
    .single();

  if (fetchError) throw fetchError;

  // ガード句1: exportedは編集不可
  if (current.status === 'exported') {
    throw new BusinessRuleError(
      'CSV出力済みの仕訳は編集できません。' +
      'マネーフォワード側で修正するか、管理者に問い合わせてください。',
      'EXPORTED_JOURNAL_READONLY'
    );
  }

  // ガード句2: ゴミ箱内は編集不可
  if (current.deleted_at) {
    throw new BusinessRuleError(
      'ゴミ箱内の仕訳は編集できません。まず復元してください。',
      'DELETED_JOURNAL_READONLY'
    );
  }

  // ガード句3: is_read自動更新（編集時に既読）
  const isContentEdit = (
    updates.description ||
    updates.debit_entries ||
    updates.credit_entries
  );
  if (isContentEdit && !current.is_read) {
    updates.is_read = true;
    updates.read_at = new Date().toISOString();
  }

  // 3. 更新実行
  const { data, error } = await supabase
    .from('journals')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', journalId)
    .select()
    .single();

  if (error) throw error;
  return data as Journal;
}
```

---

### 3. 仕訳削除（ゴミ箱へ移動）

```typescript
DELETE /api/journals/{id}
```

#### リクエスト

なし

#### レスポンス

```json
{
  "success": true,
  "message": "仕訳をゴミ箱に移動しました"
}
```

#### ガード句

```typescript
export async function deleteJournal(
  journalId: string,
  context: { userId: string }
): Promise<void> {
  // ガード句: exportedは削除不可
  const { data: current } = await supabase
    .from('journals')
    .select('status')
    .eq('id', journalId)
    .single();

  if (current?.status === 'exported') {
    throw new BusinessRuleError(
      'CSV出力済みの仕訳は削除できません。',
      'EXPORTED_JOURNAL_READONLY'
    );
  }

  // 論理削除（ゴミ箱へ）
  const { error } = await supabase
    .from('journals')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: context.userId
    })
    .eq('id', journalId);

  if (error) throw error;
}
```

---

### 4. 仕訳復元（ゴミ箱から）

```typescript
POST /api/journals/{id}/restore
```

#### リクエスト

なし

#### レスポンス

```json
{
  "journal": { /* 復元後の仕訳 */ },
  "success": true
}
```

#### 実装

```typescript
export async function restoreJournal(journalId: string): Promise<Journal> {
  const { data, error } = await supabase
    .from('journals')
    .update({
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', journalId)
    .select()
    .single();

  if (error) throw error;
  return data as Journal;
}
```

---

### 5. CSV出力

```typescript
POST /api/journals/export
```

#### リクエスト

```json
{
  "client_id": "uuid"
}
```

#### レスポンス

```json
{
  "filename": "clientA_20261215_193000_journals.csv",
  "count": 45,
  "batch_id": "uuid",
  "download_url": "https://..."
}
```

#### 実装（トランザクション必須）

```typescript
export async function exportJournals(
  clientId: string,
  context: { userId: string }
): Promise<ExportResult> {
  // 1. 出力対象の仕訳を取得
  const { data: journals, error: fetchError } = await supabase
    .from('journals')
    .select('*')
    .eq('client_id', clientId)
    .is('status', null)  // 未出力のみ
    .not('labels', 'cs', '{EXPORT_EXCLUDE}')  // 出力対象外を除外 ⚠️ Phase Cで .eq('export_exclude', false) に変更予定（2026-02-20判断: カラム管理に統一）
    .is('deleted_at', null);

  if (fetchError) throw fetchError;
  if (!journals || journals.length === 0) {
    throw new Error('出力対象の仕訳がありません');
  }

  // 2. CSV生成
  const csv = generateMFCSV(journals);

  // 3. ファイル名生成
  const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
  const filename = `${clientId}_${timestamp}_journals.csv`;

  // 4. トランザクション処理（RPC呼び出し）
  const { data, error } = await supabase.rpc('export_journals_transaction', {
    p_client_id: clientId,
    p_user_id: context.userId,
    p_journal_ids: journals.map(j => j.id),
    p_filename: filename
  });

  if (error) throw error;

  // 5. CSVダウンロード
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  return {
    filename,
    count: journals.length,
    batch_id: data.batch_id,
    download_url: url
  };
}
```

対応するSQL Function:

```sql
CREATE OR REPLACE FUNCTION export_journals_transaction(
  p_client_id UUID,
  p_user_id UUID,
  p_journal_ids UUID[],
  p_filename TEXT
) RETURNS TABLE(batch_id UUID) AS $$
DECLARE
  v_batch_id UUID;
BEGIN
  -- 1. バッチ作成
  INSERT INTO export_batches (client_id, exported_by, journal_count, filename)
  VALUES (p_client_id, p_user_id, array_length(p_journal_ids, 1), p_filename)
  RETURNING id INTO v_batch_id;

  -- 2. 仕訳をexportedに更新
  UPDATE journals
  SET status = 'exported',
      exported_at = NOW(),
      exported_by = p_user_id
  WHERE id = ANY(p_journal_ids);

  -- 3. 紐付けレコード作成
  INSERT INTO journal_exports (journal_id, export_batch_id)
  SELECT unnest(p_journal_ids), v_batch_id;

  RETURN QUERY SELECT v_batch_id;
END;
$$ LANGUAGE plpgsql;
```

---

### 6. 手動既読

```typescript
POST /api/journals/{id}/mark-read
```

#### リクエスト

なし

#### レスポンス

```json
{
  "journal": { /* 更新後の仕訳 */ },
  "success": true
}
```

#### 実装

```typescript
export async function markAsRead(journalId: string): Promise<Journal> {
  const { data, error } = await supabase
    .from('journals')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', journalId)
    .select()
    .single();

  if (error) throw error;
  return data as Journal;
}
```

---

### 7. 一括操作

#### 一括既読

```typescript
POST /api/journals/bulk/mark-read
```

```json
{
  "journal_ids": ["uuid1", "uuid2", "uuid3"]
}
```

#### 一括出力対象外

```typescript
POST /api/journals/bulk/exclude-from-export
```

```json
{
  "journal_ids": ["uuid1", "uuid2"],
  "reason": "重複データのため"
}
```

#### ガード句

```typescript
export async function bulkExcludeFromExport(
  journalIds: string[],
  reason: string
): Promise<void> {
  // ガード句: exportedは変更不可
  const { data: statuses } = await supabase
    .from('journals')
    .select('id, status')
    .in('id', journalIds);

  const exportedIds = statuses?.filter(j => j.status === 'exported').map(j => j.id);
  if (exportedIds && exportedIds.length > 0) {
    throw new BusinessRuleError(
      `${exportedIds.length}件の出力済み仕訳が含まれています。出力済みの仕訳は変更できません。`,
      'EXPORTED_JOURNALS_IN_SELECTION'
    );
  }

  const { error } = await supabase
    .from('journals')
    .update({
      export_exclude: true,
      export_exclude_reason: reason
    })
    .in('id', journalIds);

  if (error) throw error;
}
```

---

## 🛡️ エラーハンドリング

### エラークラス

```typescript
export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

### エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|---------------|
| `EXPORTED_JOURNAL_READONLY` | 出力済み仕訳は編集不可 | 403 |
| `DELETED_JOURNAL_READONLY` | ゴミ箱内仕訳は編集不可 | 403 |
| `JOURNAL_NOT_FOUND` | 仕訳が見つからない | 404 |
| `INVALID_LABEL_TYPE` | 不正なラベルタイプ | 400 |
| `EXPORTED_JOURNALS_IN_SELECTION` | 選択に出力済み仕訳が含まれる | 400 |

### グローバルエラーハンドラ

```typescript
export function handleAPIError(error: unknown): APIErrorResponse {
  if (error instanceof BusinessRuleError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      },
      status: 403
    };
  }

  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        field: error.field
      },
      status: 400
    };
  }

  // その他のエラー
  return {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '予期しないエラーが発生しました'
    },
    status: 500
  };
}
```

---

## 🧪 テストケース

### 1. exportedガード句のテスト

```typescript
describe('updateJournal', () => {
  it('should throw error when updating exported journal', async () => {
    const exportedJournalId = 'uuid-exported';
    
    await expect(
      updateJournal(exportedJournalId, { description: '修正テスト' }, { userId: 'user1' })
    ).rejects.toThrow('CSV出力済みの仕訳は編集できません');
  });
});
```

### 2. トランザクション整合性のテスト

```typescript
describe('exportJournals', () => {
  it('should update all journals atomically', async () => {
    const clientId = 'client1';
    
    // 出力前: 未出力状態（status = null）
    const before = await getJournals({ client_id: clientId, status: null });
    expect(before.journals.length).toBeGreaterThan(0);
    
    // 出力実行
    await exportJournals(clientId, { userId: 'user1' });
    
    // 出力後: exported状態
    const after = await getJournals({ client_id: clientId, status: 'exported' });
    expect(after.journals.length).toBe(before.journals.length);
  });
});
```

---

## 📋 ファイル配置

```
src/
├── api/
│   ├── journals.ts          # 本ファイルの実装
│   └── errors.ts            # エラークラス定義
├── types/
│   ├── journal.ts           # 型定義
│   └── api.ts               # APIレスポンス型
└── lib/
    └── supabase.ts          # Supabaseクライアント
```

---

## ✅ 実装チェックリスト

- [ ] 全エンドポイント実装
- [ ] exportedガード句実装（最重要）
- [ ] deleted_atガード句実装
- [ ] エラーハンドリング実装
- [ ] トランザクション処理（CSV出力）
- [ ] 一括操作のガード句実装
- [ ] テストケース作成
- [ ] エラーコード一覧整備

---

### 8. 要対応フラグ切り替え

### エンドポイント

```typescript
POST /api/journals/{id}/toggle-need
```

### リクエスト

| パラメータ | 型 | 必須 | 説明 |
|-----------|----|----|------|
| id | UUID | ✅ | 仕訳ID（パスパラメータ）|
| label | string | ✅ | NEED_DOCUMENT, NEED_CONFIRM, NEED_CONSULT |

**リクエストボディ**:
```json
{
  "label": "NEED_DOCUMENT"
}
```

### レスポンス

```json
{
  "id": "uuid",
  "labels": ["TRANSPORT", "RECEIPT", "NEED_DOCUMENT"],
  "is_read": false,
  "updated_at": "2025-01-20T10:30:00Z"
}
```

### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | 無効なラベル種類 |
| 403 | 出力済み仕訳は編集不可 |
| 404 | 仕訳が見つからない |

### ガード句

```typescript
// 出力済みは編集不可
if (journal.status === 'exported') {
  throw new BusinessRuleError(
    'CSV出力済みの仕訳は編集できません',
    'EXPORTED_JOURNAL_READONLY'
  );
}

// 有効なラベルかチェック
const validLabels = ['NEED_DOCUMENT', 'NEED_CONFIRM', 'NEED_CONSULT'];
if (!validLabels.includes(label)) {
  throw new ValidationError(
    '無効なラベル種類です',
    'INVALID_LABEL'
  );
}
```

### 実装例

```typescript
export async function toggleNeedLabel(
  journalId: string,
  label: 'NEED_DOCUMENT' | 'NEED_CONFIRM' | 'NEED_CONSULT',
  userId: string
): Promise<Journal> {
  // ガード句: 出力済みチェック
  const { data: current } = await supabase
    .from('journals')
    .select('status, labels, is_read')
    .eq('id', journalId)
    .single();
  
  if (!current) {
    throw new NotFoundError('仕訳が見つかりません');
  }
  
  if (current.status === 'exported') {
    throw new BusinessRuleError(
      'CSV出力済みの仕訳は編集できません',
      'EXPORTED_JOURNAL_READONLY'
    );
  }
  
  // ラベルのトグル処理
  const labels = current.labels || [];
  const index = labels.indexOf(label);
  
  let newLabels: string[];
  let newIsRead: boolean;
  
  if (index > -1) {
    // 削除
    newLabels = labels.filter(l => l !== label);
    newIsRead = current.is_read;  // is_readは変更しない
  } else {
    // 追加
    newLabels = [...labels, label];
    newIsRead = false;  // 要対応フラグ追加時は未読に
  }
  
  // 更新
  const { data, error } = await supabase
    .from('journals')
    .update({
      labels: newLabels,
      is_read: newIsRead,
      updated_at: new Date().toISOString(),
      updated_by: userId
    })
    .eq('id', journalId)
    .select()
    .single();
  
  if (error) throw error;
  return data as Journal;
}
```

### テスト項目

- [ ] フラグ追加時にis_readがfalseになることを確認
- [ ] フラグ削除時にis_readが変更されないことを確認
- [ ] 出力済み仕訳は403エラーになることを確認
- [ ] 無効なラベルは400エラーになることを確認

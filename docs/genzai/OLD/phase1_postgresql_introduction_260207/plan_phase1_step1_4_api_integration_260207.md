# Step 1.4: API統合 実装計画

**作成日**: 2026-02-07T18:20:00+09:00  
**タスク**: Firestore + Supabase 両方書き込みAPI実装  
**方針**: ユーザー推奨「線を1本通す」アプローチ

---

## 📋 目標

**「線を1本通す」= MVP API 1本だけ作る**

- POST `/api/receipts/:id/status` エンドポイント作成
- Firestore（イベントログ）+ Supabase（正規帳簿）両方書き込み
- Postmanで手動テスト1ケース（uploaded → confirmed）

---

## 🔍 現状分析

### 既存API構造
- **フレームワーク**: Hono
- **既存ルート**: 11個（`conversion`, `clients`, `journal-status`, `journal-entry`, `ai-rules`, `admin`, `worker`, `ai-models`, `ocr`等）
- **パターン**: `src/api/routes/*.ts` → [src/server.ts](file:///C:/dev/receipt-app/src/server.ts) でルート登録
- **Firestore使用**: 既存ルートではFirestore直接使用なし（今回が初統合）

### 作成済みコンポーネント（Phase 1）
- ✅ [src/database/supabase/client.ts](file:///C:/dev/receipt-app/src/database/supabase/client.ts)
- ✅ [src/database/repositories/receiptRepository.ts](file:///C:/dev/receipt-app/src/database/repositories/receiptRepository.ts)
  - [updateStatus()](file:///C:/dev/receipt-app/src/database/repositories/receiptRepository.ts#18-35): SQL function `update_receipt_status()` 使用
  - [confirmReceipt()](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/database/repositories/receiptRepository.ts#36-55): confirmed時のjournal必須チェック
- ✅ [src/database/repositories/auditLogRepository.ts](file:///C:/dev/receipt-app/src/database/repositories/auditLogRepository.ts)

---

## ⚠️ 絶対遵守ルール（ユーザー指摘）

### ❌ やってはいけないこと
```typescript
// ❌ ダメ（直接UPDATE）
await supabase
  .from('receipts')
  .update({ status: 'confirmed' })
```

### ✅ 正解
```typescript
// ✅ 必ず update_receipt_status() を通す
await supabase.rpc('update_receipt_status', {
  p_id: receiptId,
  p_new_status: 'confirmed',
  p_actor: 'user@example.com'
})
```

**理由**:
- audit_logs と receipts の一貫性が壊れる
- 「なぜこの状態になったか」が説明不能になる

---

## 🛠️ 実装内容

### 新規作成ファイル

#### `src/api/routes/receipts.ts`

```typescript
import { Hono } from 'hono'
import { z } from 'zod'
import { supabase } from '../../database/supabase/client'
import { receiptRepository } from '../../database/repositories/receiptRepository'
import admin from 'firebase-admin'

const app = new Hono()

// Zod Schema for request validation
const UpdateStatusSchema = z.object({
  newStatus: z.enum(['uploaded', 'preprocessed', 'ocr_done', 'suggested', 'reviewing', 'confirmed', 'rejected']),
  actor: z.string().email().optional().default('system@receipt-app.com'),
  journal: z.any().optional() // confirmed時は必須（Repository層でチェック）
})

// POST /api/receipts/:id/status
// 状態変更API（Firestore + Supabase両方書き込み）
app.post('/:id/status', async (c) => {
  try {
    const receiptId = c.req.param('id')
    const body = await c.req.json()
    
    // バリデーション
    const validated = UpdateStatusSchema.parse(body)
    
    // 1. Firestore: イベントログ記録
    const db = admin.firestore()
    await db.collection('receipt_events').add({
      receiptId,
      eventType: 'status_change',
      newStatus: validated.newStatus,
      actor: validated.actor,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
    
    // 2. Supabase: 正規帳簿更新（SQL function使用）
    if (validated.newStatus === 'confirmed') {
      // confirmed時はjournal必須
      if (!validated.journal) {
        return c.json({ error: 'journal is required for confirmed status' }, 400)
      }
      
      await receiptRepository.confirmReceipt(receiptId, validated.journal, validated.actor)
    } else {
      // 通常の状態変更
      await receiptRepository.updateStatus(receiptId, validated.newStatus, validated.actor)
    }
    
    // 3. 成功レスポンス
    return c.json({
      success: true,
      receiptId,
      newStatus: validated.newStatus,
      message: 'Status updated in both Firestore and Supabase'
    })
    
  } catch (e: any) {
    console.error('[API Error] receipts/:id/status:', e)
    return c.json({ error: e.message }, 500)
  }
})

export default app
```

### 修正ファイル

#### [src/server.ts](file:///C:/dev/receipt-app/src/server.ts)

```diff
+ import receiptsRoute from './api/routes/receipts'

  // Phase 6.3: OCR Route (Vertex AI)
  app.route('/api/ocr', ocrRoute)
  
+ // Phase 1 Step 1.4: Receipts Route (PostgreSQL統合)
+ app.route('/api/receipts', receiptsRoute)
```

---

## 🧪 検証計画

### 前提条件チェック
1. ✅ Supabaseプロジェクト稼働中（東京リージョン）
2. ✅ [.env.local](file:///C:/dev/receipt-app/.env.local)に認証情報設定済み
3. ✅ schema.sql実行済み（receipts、audit_logsテーブル存在）
4. ✅ Firebase Admin SDK初期化済み（[src/server.ts](file:///C:/dev/receipt-app/src/server.ts)）

### テスト手順

#### 準備
1. サーバー起動
   ```bash
   npm run dev
   # または
   node dist/server.js
   ```

2. テストデータ準備（Supabase Table Editor）
   - `receipts`テーブルに1レコード手動挿入
   - id: `test-receipt-001`（UUID）
   - client_id: `test-client-001`（UUID）
   - drive_file_id: `test-file-12345`
   - status: `uploaded`（初期状態）

#### Postmanテスト

**テストケース1: uploaded → confirmed**

```http
POST http://localhost:8080/api/receipts/test-receipt-001/status
Content-Type: application/json

{
  "newStatus": "confirmed",
  "actor": "test@example.com",
  "journal": {
    "date": "2024-01-15",
    "entries": [
      {
        "account": "現金",
        "debit": 1000,
        "credit": 0
      }
    ]
  }
}
```

**期待結果**:
- ✅ レスポンス200、`{ "success": true, ... }`
- ✅ Supabase `receipts`: status = 'confirmed', confirmed_journal存在
- ✅ Supabase `audit_logs`: 1件追加（action='status_change'）
- ✅ Firestore `receipt_events`: 1件追加

**テストケース2: uploaded → reviewing（journalなし）**

```http
POST http://localhost:8080/api/receipts/test-receipt-001/status
Content-Type: application/json

{
  "newStatus": "reviewing",
  "actor": "test@example.com"
}
```

**期待結果**:
- ✅ レスポンス200
- ✅ Supabase `receipts`: status = 'reviewing'
- ✅ Supabase `audit_logs`: 1件追加

**テストケース3: confirmed（journalなし）→ エラー**

```http
POST http://localhost:8080/api/receipts/test-receipt-001/status
Content-Type: application/json

{
  "newStatus": "confirmed",
  "actor": "test@example.com"
}
```

**期待結果**:
- ✅ レスポンス400、`{ "error": "journal is required for confirmed status" }`

#### 手動確認（Supabase Studio）

1. **Table Editor**
   - `receipts`: statusが更新されているか
   - `receipts`: confirmed_journalが保存されているか（confirmed時）

2. **Database → Functions**
   - `update_receipt_status`が実行されたか（ログ確認）

3. **audit_logsテーブル**
   - レコード数が増えているか
   - before_json / after_jsonが正しいか

#### 手動確認（Firebase Console）

1. **Firestore → receipt_events コレクション**
   - イベントログが記録されているか
   - timestampが正しいか

---

## 🚨 重要注意事項

### 1. SQL function必須使用
- ❌ 直接UPDATE禁止
- ✅ `update_receipt_status()` RPC経由のみ

### 2. confirmed時のjournal必須
- API層でバリデーション
- Repository層でもダブルチェック
- CHECK制約がDB側で最終防御

### 3. Firestore統合
- Firebase Admin SDK使用
- `service-account-key.json`が必要（ローカル開発時）
- Cloud Runでは Application Default Credentials

### 4. エラーハンドリング
- Zod validation error
- Supabase RPC error
- Firestore write error
- すべてキャッチして500返す

---

## 📊 成功基準

### 必須条件
- ✅ Postman 3ケースすべて期待通り動作
- ✅ Supabase audit_logsに記録されている
- ✅ Firestore receipt_eventsに記録されている
- ✅ confirmed時のjournal必須がバリデーションで防御される

### あれば望ましい
- ⭕ サーバーログがクリーンで理解しやすい
- ⭕ エラーメッセージがわかりやすい

---

## 🔄 次のステップ（Step 1.4完了後）

Step 1.4完了により、Phase 1（PostgreSQL導入）が**100%完了**します。

**Phase 2**へ移行:
- UI参照先をSupabaseに切り替え
- Firestoreは「読み取り専用イベントログ」として残す

---

## ❓ 不明点・質問事項

### 現時点での質問
1. **Firestoreコレクション名**: `receipt_events` で良いか？
   - 既存のコレクション構造があれば教えてください

2. **テストデータUUID**: 手動で挿入するUUIDは固定値で良いか？
   - または、gen_random_uuid()で自動生成？

3. **service-account-key.json**: ローカル開発用のファイルは配置済みか？
   - なければダウンロードが必要

4. **Firebase Adminの初期化**: [src/server.ts](file:///C:/dev/receipt-app/src/server.ts)で既に初期化済みを確認
   - ✅ 問題なし

5. **npm run dev コマンド**: package.jsonに定義されているか？
   - 確認が必要

---

## 📝 実装時の注意点（チェックリスト）

- [ ] `src/api/routes/receipts.ts` 作成
- [ ] [src/server.ts](file:///C:/dev/receipt-app/src/server.ts) にルート追加
- [ ] Postmanでテスト準備（3ケース）
- [ ] Supabaseに手動でテストデータ挿入
- [ ] サーバー起動確認
- [ ] テスト実行と結果確認
- [ ] Firestore/Supabase両方でデータ確認

---

## 🎯 まとめ

**ユーザー推奨の「線を1本通す」方式を採用**

- API 1本だけ作る（POST /receipts/:id/status）
- Firestore + Supabase 両方書き込み
- update_receipt_status() SQL function必須使用
- Postman手動テスト3ケースで検証

**UI は一切触らない**

→ Phase 2で対応

**これでPhase 1が100%完了します！**

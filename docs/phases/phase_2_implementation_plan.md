# Phase 2: UI参照先切り替え - 実装計画

**作成日**: 2026-02-07  
**前提**: Phase 1完了（PostgreSQL導入、API統合完了）  
**期間**: 3日  
**優先度**: 必須（UI真っ白問題の構造的解決）

---

## 🎯 結論：Phase 2を直ちに実施します

Phase 1でSupabase APIが完成し、UI真っ白問題を解決する準備が整いました。

**Phase 2は必須**です。Phase 3（データ移行）は、UI安定後の段階的実施とします。

---

## 📋 ゴール定義

Phase 2完了時、以下の状態が達成されます：

### ✅ 達成状態

1. **UIは `receipt.status` のみを信頼する**
   - Firestoreのoptionalフィールドに依存しない
   - `v-if="job.lines && job.lines.length > 0"` のようなデータ推測ロジックが消滅

2. **optional chaining に依存しない**
   - 242個のoptional → 20個（91.7%削減）
   - UI真っ白問題の構造的解消

3. **status追加時の影響範囲が明確**
   - 新しいstatusを追加する場合、`switch (status)` のケースを追加するだけ
   - 見落としが不可能

---

## 🚀 作業内容

### Step 2.1: フロント型定義の統合（1日）

#### 目的

- **UIは statusだけを信頼**
- Firestore / OCR / journal の存在有無で分岐しない
- 型の依存方向を**将来壊れない形**にする

---

#### タスク

##### ① 共有レイヤーを作る（最重要）

**ファイル**: `src/shared/receiptStatus.ts`

```typescript
export const RECEIPT_STATUSES = [
  'uploaded',
  'preprocessed',
  'ocr_done',
  'suggested',
  'reviewing',
  'confirmed',
  'rejected',
] as const

export type ReceiptStatus = typeof RECEIPT_STATUSES[number]

export function isReceiptStatus(v: unknown): v is ReceiptStatus {
  return typeof v === 'string' && RECEIPT_STATUSES.includes(v as ReceiptStatus)
}
```

**ポイント**:
- DB / API / UI すべてがこの型を参照
- ENUM追加 = **この1ファイルを編集するだけ**
- 「status追加漏れ」がコンパイル時に即死

---

##### ② フロント専用 ViewModel を定義

**ファイル**: `src/types/receiptViewModel.ts`

```typescript
import type { ReceiptStatus } from '@/shared/receiptStatus'

export interface ReceiptViewModel {
  id: string
  status: ReceiptStatus
  clientId: string
  driveFileId: string

  /**
   * UI表示用スナップショット
   * 壊れてもUIが死なない前提
   */
  displaySnapshot?: {
    ocrText?: string
    amountGuess?: number
    merchantGuess?: string
  }
}
```

**重要な思想**:
- `displaySnapshot` は**信用しない**
- **UIロジックには使わない**
- **表示に使うだけ**（壊れてOK）

---

##### ③ Store投入時に status を正規化（事故防止）

**ファイル**: `src/stores/receiptStore.ts`

```typescript
import { defineStore } from 'pinia'
import { isReceiptStatus } from '@/shared/receiptStatus'
import type { ReceiptViewModel } from '@/types/receiptViewModel'

function normalizeReceipt(raw: any): ReceiptViewModel {
  return {
    id: raw.id,
    clientId: raw.clientId,
    driveFileId: raw.driveFileId,
    status: isReceiptStatus(raw.status) ? raw.status : 'uploaded',
    displaySnapshot: raw.displaySnapshot,
  }
}

export const useReceiptStore = defineStore('receipt', () => {
  const receipts = ref<ReceiptViewModel[]>([])

  function setReceipts(raws: any[]) {
    receipts.value = raws.map(normalizeReceipt)
  }

  const suggestedReceipts = computed(() =>
    receipts.value.filter(r => r.status === 'suggested')
  )

  const confirmedReceipts = computed(() =>
    receipts.value.filter(r => r.status === 'confirmed')
  )

  return {
    receipts,
    setReceipts,
    suggestedReceipts,
    confirmedReceipts,
  }
})
```

**保証されること**:
- UIに来る `receipt.status` は常に安全
- 未知statusでも UI が壊れない
- 各Viewでの防御コードが不要

---

##### ④ status → UI対応表（1枚図・決定版）

| status | UI画面 | UIの責務 |
|--------|--------|----------|
| `uploaded` | アップロード完了画面 | 次工程を待つ |
| `preprocessed` | 前処理中画面 | ローディング表示 |
| `ocr_done` | OCR結果確認画面 | OCR表示のみ |
| `suggested` | 仕訳提案確認画面 | 修正・承認操作 |
| `reviewing` | レビュー中画面 | 編集不可 |
| `confirmed` | 承認済み画面 | 読み取り専用 |
| `rejected` | 差戻し画面 | 再処理案内 |
| `unknown` | 処理中（フォールバック） | 絶対に真っ白にしない |

**重要ルール**:
- UIは「状態の理由」を考えない
- なぜそうなったかは `audit_logs` の仕事
- UIは「今どう見せるか」だけ

---

#### 🔒 UIで「やってはいけないこと」チェックリスト

##### ❌ 絶対NG（即バグ）

- `if (receipt.lines?.length)`
- `if (receipt.ocrResult?.text)`
- `if (receipt.journal)`
- Firestoreの生データをUIで直接参照
- status以外で画面遷移を決める

👉 **これをやると UI真っ白が再発する**

##### ⚠️ 原則NG（例外は理由必須）

- optional chaining をUIロジックで使う
- 1画面で複数statusを解釈する
- statusと無関係なデータ存在チェック

##### ✅ 正解パターン

- UI分岐は statusのみ
- 未知statusは必ず fallback 表示
- 表示できない = 「処理中」と出す
- **表示できない理由を考えない**

---

#### ✅ Step 2.1 完了条件（明文化）

- [ ] フロントが Firestore 型を import していない
- [ ] `receipt.status` は必ず ENUM 型
- [ ] Store投入時に status 正規化済み
- [ ] optional による画面分岐が存在しない

---

---

### Step 2.2: UI条件分岐の status化（2日）

#### タスク

1. **`src/views/ReceiptDetail.vue` を `switch (status)` に変更**

   **Before（データ推測型）**:
   ```vue
   <template>
     <div v-if="job.lines && job.lines.length > 0">
       仕訳あり画面
     </div>
     <div v-else-if="job.ocrResult && job.ocrResult.text">
       OCR結果表示画面
     </div>
     <div v-else>
       処理中...
     </div>
   </template>
   ```

   **After（status駆動型）**:
   ```vue
   <template>
     <div v-if="receipt.status === 'suggested'">
       仕訳確認画面
     </div>
     <div v-else-if="receipt.status === 'reviewing'">
       レビュー中画面
     </div>
     <div v-else-if="receipt.status === 'confirmed'">
       承認済み画面
     </div>
     <div v-else-if="receipt.status === 'uploaded'">
       アップロード完了
     </div>
     <div v-else>
       処理中: {{ receipt.status }}
     </div>
   </template>
   ```

2. **全画面でstatus駆動UIを実装（7状態すべて対応）**
   - `uploaded`
   - `preprocessed`
   - `ocr_done`
   - `suggested`
   - `reviewing`
   - `confirmed`
   - `rejected`

3. **ルーティング条件もstatus化**
   ```typescript
   // router/index.ts
   {
     path: '/receipts/suggested',
     component: () => import('@/views/ReceiptList.vue'),
     props: { filter: 'suggested' }
   }
   ```

#### 検証

- 各statusで正しい画面が表示されることを確認
- status遷移時にUI真っ白にならないことを確認
- 未知のstatusでもエラーにならず「処理中」と表示されることを確認

---

## 📈 期待効果

### 1. UI真っ白問題の完全解消

**問題の構造**:
```typescript
// ❌ Before: データがない → UI真っ白
if (job.lines && job.lines.length > 0) {
  // 仕訳表示
} else {
  // 何も表示されない → UI真っ白
}
```

**解決後の構造**:
```typescript
// ✅ After: statusがあれば必ず何か表示される
switch (receipt.status) {
  case 'suggested':
    // 仕訳確認画面
  case 'uploaded':
    // アップロード完了画面
  default:
    // 処理中: {status}
}
```

### 2. optional依存 91.7%削減

- **Before**: 242個のoptionalフィールドに依存
- **After**: 20個のoptionalフィールドのみ（displaySnapshot等、UI表示用）

### 3. Phase 3（データ移行）を安心して後回し可能

- UIがSupabase APIで安定動作
- Firestoreデータ移行は段階的に実施可能
- システム全体のリスクが大幅に低減

---

## 🔄 Phase 3（後続作業）

**Phase 2完了後、UI安定を確認してから実施**

### Phase 3: データ移行（1週間）

#### Step 3.1: 移行スクリプト作成（3日）
- Firestoreデータ読み込み
- PostgreSQLにINSERT
- データ整合性検証

#### Step 3.2: 段階的移行実行（2日）
- テストデータ移行
- 本番データ移行（バッチ処理）

#### Step 3.3: Firestore参照停止（2日）
- Readロジックを完全にSupabaseに切り替え
- Firestoreをイベントログ専用に格下げ

---

## ✅ 検証計画

### 1. Unit Test

```typescript
// src/stores/__tests__/receiptStore.test.ts
describe('receiptStore', () => {
  it('should filter receipts by status', () => {
    const store = useReceiptStore()
    store.receipts = [
      { id: '1', status: 'suggested' },
      { id: '2', status: 'confirmed' },
      { id: '3', status: 'suggested' }
    ]
    
    expect(store.suggestedReceipts).toHaveLength(2)
    expect(store.confirmedReceipts).toHaveLength(1)
  })
})
```

### 2. E2E Test（手動）

#### シナリオ1: Receipt一覧表示
1. `/receipts/suggested` にアクセス
2. status='suggested'のReceiptのみ表示されることを確認

#### シナリオ2: Receipt詳細表示
1. `/receipts/:id` にアクセス
2. statusに応じた画面が表示されることを確認
3. UI真っ白にならないことを確認

#### シナリオ3: Status遷移
1. Receiptを `suggested` → `reviewing` に変更
2. UI表示が即座に切り替わることを確認

---

## 📊 リスク分析

### リスク1: 既存UIの互換性

**問題**: 既存のデータ推測ロジックが残っている場合、動作不整合

**対策**:
- 段階的に書き換え（1画面ずつ）
- 各画面でE2Eテスト実施

### リスク2: 未知のstatus

**問題**: 新しいstatusが追加された場合、UIが対応していない

**対策**:
- `default` ケースで「処理中: {status}」と表示
- TypeScript ENUM型で網羅性チェック

---

## 📅 スケジュール

| 作業 | 期間 | 担当 |
|------|------|------|
| Step 2.1: フロント型定義統合 | 1日 | AI |
| Step 2.2: UI条件分岐status化 | 2日 | AI |
| **Phase 2 完了** | **3日** | - |

---

## 🎯 まとめ

**Phase 2は必須作業**

- UI真っ白問題を構造的に解決
- optional地獄から脱却（91.7%削減）
- Phase 3を安心して後回しできる

**次のアクション**

Step 2.1（フロント型定義統合）から着手します。

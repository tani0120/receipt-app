# Phase 4: Journal UI再設計 実装計画

## 概要

**目的**: ScreenE_Workbench.vueをstatus駆動UIに再設計し、Phase 2で確立したパターンを適用する

**背景**: 
- Phase 2でReceipt domain status駆動UIが完成
- Console警告12件（`useAccountingSystem.ts` clientId validation）が存在
- ScreenE_Workbench.vueが`entry`変数を使用（Receiptとは別ドメイン）

**成果物**:
- ✅ status駆動Journal UI
- ✅ Console警告0件（Journal domain）
- ✅ Firestore依存の整理
- ✅ テスト16+件（Phase 2パターン適用）

---

## 前提条件確認が必要な項目（不明点）

### 1. Journal Entry Status定義
**不明点**: 
- `entry.status`の全状態が不明
  - Phase 2では[ReceiptStatus](file:///C:/Users/kazen/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/ai_gogleanti/src/database/types/receipt.types.ts#6-14)を[receiptStatus.ts](file:///C:/dev/receipt-app/src/shared/receiptStatus.ts)で定義済み
  - Journal domainの状態定義はどこにある？

**確認方法**:
1. [aaa_useJournalEditor()](file:///C:/dev/receipt-app/src/composables/useJournalEditor.ts#7-135)のソースコード確認
2. FirestoreコレクションスキーマからStatusを抽出
3. または`entry.status`の実使用箇所を全検索

**想定される状態** (要確認):
```typescript
type JournalEntryStatus = 
  | 'draft'          // 下書き
  | 'suggested'      // AI提案済み
  | 'reviewing'      // レビュー中
  | 'remanded'       // 差戻し
  | 'confirmed'      // 確定
  | 'excluded'       // 除外
```

---

### 2. useAccountingSystem警告の原因

**Console警告内容** (Task 4で確認済み):
```
[Ironclad] Client Data dropped at Gatekeeper (Preload-1001)
{
  "_errors": [],
  "clientId": {
    "_errors": [
      "Invalid input: expected string, received undefined"
    ]
  }
}
```

**不明点**:
- どのタイミングで`clientId`が`undefined`になるのか？
- Preload-1001, AAA, BBB... は何を意味するのか？
- `useAccountingSystem.ts:790`の該当コードは？

**確認方法**:
1. `useAccountingSystem.ts`の790行目付近を確認
2. Preloadロジックを確認
3. clientId初期化フローを追跡

---

### 3. Firestore依存度

**不明点**:
- Journal UIはFirestoreに完全依存しているか？
- Supabaseへの移行は必要か？（Phase 1-3ではReceipt domainのみ）

**確認方法**:
1. ScreenE_Workbench.vueのデータソースを確認
2. [aaa_useJournalEditor()](file:///C:/dev/receipt-app/src/composables/useJournalEditor.ts#7-135)の実装を確認
3. Firestoreクエリを全検索

**想定される方針**:
- 短期: Firestore依存のまま（UI地雷だけ除去）
- 長期: Supabaseへ移行（Phase 6以降）

---

## 実装計画（3ステップ）

### Step 4.1: 調査・準備フェーズ ✅

**目的**: 不明点を解消し、実装に必要な情報を収集

**タスク**:
1. [ ] Journal Entry Status定義を確認
   - [aaa_useJournalEditor()](file:///C:/dev/receipt-app/src/composables/useJournalEditor.ts#7-135)ソースコード確認
   - Firestoreスキーマ確認
   - `entry.status`全使用箇所検索

2. [ ] useAccountingSystem警告の原因調査
   - `useAccountingSystem.ts:790`確認
   - Preloadロジック確認
   - clientId初期化フロー追跡

3. [ ] Firestore依存度確認
   - ScreenE_Workbench.vueデータソース確認
   - [aaa_useJournalEditor()](file:///C:/dev/receipt-app/src/composables/useJournalEditor.ts#7-135)実装確認
   - Firestoreクエリ全検索

4. [ ] Phase 2パターン適用可否判定
   - `status → uiMode → template`パターンが適用可能か
   - ViewModelが必要か
   - 正規化関数が必要か

**完了条件**:
- ✅ Journal Entry Status定義確定
- ✅ Console警告の原因特定
- ✅ Firestore依存度マップ作成
- ✅ 実装方針確定

**推定工数**: 小（2-4時間）

---

### Step 4.2: 型定義・ViewModel実装

**目的**: Phase 2パターンをJournal domainに適用

**タスク**:
1. [ ] `journalEntryStatus.ts`作成（共有型定義）
   ```typescript
   export type JournalEntryStatus = 
     | 'draft'
     | 'suggested'
     | 'reviewing'
     | 'remanded'
     | 'confirmed'
     | 'excluded'

   export type JournalUiMode =
     | 'loading'
     | 'editable'
     | 'readonly'
     | 'remanded'
     | 'fallback'
   ```

2. [ ] `JournalEntryViewModel`作成
   ```typescript
   export interface JournalEntryViewModel {
     id: string
     clientCode: string
     status: JournalEntryStatus
     evidenceUrl?: string
     totalDebit: number
     totalCredit: number
     lines: JournalLineVM[]
     // ... その他必須フィールド
   }
   
   // 🔒 Phase 4における鉄のルール: UI表示とUI状態判断に必要な最小単位
   export interface JournalLineVM {
     id: string                // key / diff用
     accountCode: string       // UI必須
     accountName?: string      // 可読性（optional）
     debit: number             // UI状態判断
     credit: number            // UI状態判断
   }
   
   // ❌ Phase 4では含めない（Phase 5送り）:
   // - subAccount（補助科目） → UI分岐複雑化、業務仕様UI
   // - taxType（消費税区分） → 計算・検証ロジック、会計ロジック
   // - taxRate → 同上
   // - memo → 編集UX拡張
   ```

3. [ ] `normalizeJournalEntry()`実装（Store層）
   - 不正status → 'draft'にフォールバック
   - `totalDebit` / `totalCredit` を0で初期化
   - optional地獄を除去

4. [ ] `normalizeJournalLine()`実装（鉄のルール）
   ```typescript
   function normalizeJournalLine(raw: any): JournalLineVM {
     return {
       id: raw.id ?? crypto.randomUUID(),
       accountCode: raw.accountCode ?? 'unknown',
       accountName: raw.accountName,  // あればそのまま
       debit: Number(raw.debit ?? 0),
       credit: Number(raw.credit ?? 0),
     }
   }
   ```
   
   **鉄のルール**:
   - ❌ 税判定しない
   - ❌ 補助科目触らない
   - ✅ UIが壊れないことだけ保証

**完了条件**:
- ✅ `journalEntryStatus.ts`作成
- ✅ `JournalEntryViewModel`定義
- ✅ `JournalLineVM`定義（最小構成）
- ✅ `normalizeJournalEntry()`実装
- ✅ `normalizeJournalLine()`実装
- ✅ 型安全性確保

**推定工数**: 小（3-5時間）


---

### Step 4.3: UI条件分岐（status駆動化）

**目的**: ScreenE_Workbench.vueをstatus駆動UIに変換

**タスク**:
1. [ ] `uiMode` computed プロパティ実装
   ```typescript
   const uiMode = computed<JournalUiMode>(() => {
     if (!entry.value) return 'loading'
     
     switch (entry.value.status) {
       case 'draft':
       case 'suggested':
         return 'editable'
       case 'reviewing':
       case 'confirmed':
         return 'readonly'
       case 'remanded':
         return 'remanded'
       default:
         return 'fallback'
     }
   })
   ```

2. [ ] UIコンポーネント分割（必要に応じて）
   - EditableJournalView.vue
   - ReadonlyJournalView.vue
   - RemandedJournalView.vue
   - または既存のScreenE_Workbench.vueを直接改修

3. [ ] 暗黙ロジック除去
   - ❌ `v-if="entry"` → ✅ `v-if="uiMode === 'editable'"`
   - ❌ `entry.status === 'remanded'` → ✅ `uiMode === 'remanded'"`
   - ❌ `entry.totalDebit?.toLocaleString()` → ✅ `entry.totalDebit.toLocaleString()`
   - ❌ `v-if="entry.evidenceUrl"` → 子コンポーネントに隔離

**完了条件**:
- ✅ `uiMode` computed実装
- ✅ status直接参照を除去
- ✅ optional chaining除去
- ✅ データ推測ロジック除去

**推定工数**: 中（5-8時間）

---

## 安定化フェーズ（Phase 4-🅲）

### Task 1: JournalEntryStatus → JournalUiMode 網羅性テスト

**テストファイル**: `src/views/__tests__/ScreenE_Workbench.spec.ts`

**検証内容**:
- 全JournalEntryStatusのuiModeマッピング
- unknownステータスのfallback動作

**推定テスト数**: 7-10件

---

### Task 2: Fallback動作の境界値テスト

**検証内容**:
- `entry = null` → `uiMode = 'loading'`
- `entry.status = undefined` → `uiMode = 'fallback'`
- `entry.status = 'INVALID_STATUS'` → `uiMode = 'fallback'`

**推定テスト数**: 4件

---

### Task 3: ViewModel正規化の境界テスト

**テストファイル**: `src/stores/__tests__/journalStore.spec.ts`

**検証内容**:
- 不正status → 'draft'変換
- `totalDebit = undefined` → 0初期化
- 必須フィールド検証

**推定テスト数**: 5-8件

---

### Task 4: ブラウザ実機テスト

**URL**: http://localhost:5173/journal/workbench（要確認）

**確認内容**:
- 全UIモード表示確認
- Console警告12件解消確認
- UI品質確認

---

## リスクと対策

### リスク1: Journal Entry Status定義が不明

**影響度**: 高  
**対策**: 
1. Step 4.1で最優先で調査
2. 不明な場合は`entry.status`の実使用箇所から推測
3. 最悪、Firestore実データから抽出

---

### リスク2: Firestore依存が深い

**影響度**: 中  
**対策**:
1. UI層のみリファクタリング（データ層は触らない）
2. Firestore移行は Phase 6以降に延期
3. normalizeJournalEntry()でFirestore依存を局所化

---

### リスク3: useAccountingSystem警告が複雑

**影響度**: 中  
**対策**:
1. Step 4.1で原因特定
2. clientId初期化を修正（最小限の変更）
3. 解決不可能な場合はスコープ外として扱う

---

## 完了条件

### 必須条件
- ✅ ScreenE_Workbench.vueがstatus駆動UIに変換
- ✅ Console警告12件解消（または原因特定とTODO化）
- ✅ 自動テスト16+件合格
- ✅ ブラウザ実機確認完了

### オプション条件
- Firestore依存整理（Phase 6に延期可）
- UIコンポーネント分割（必要に応じて）

---

## 推定工数

**合計**: 中（1.5-2.5日）

- Step 4.1: 小（2-4時間）
- Step 4.2: 小（3-5時間）
- Step 4.3: 中（5-8時間）
- Phase 4-🅲: 小（2-3時間）

---

## 次のステップ

**承認後の最初のアクション**:
1. task.mdにPhase 4チェックリスト追加
2. Step 4.1開始：Journal Entry Status定義の調査
3. [aaa_useJournalEditor()](file:///C:/dev/receipt-app/src/composables/useJournalEditor.ts#7-135)ソースコード確認

**質問への回答**:
- **進め方**: 3ステップ + 安定化フェーズ
- **不明点**: Journal Entry Status定義、useAccountingSystem警告原因、Firestore依存度
- **計画**: このドキュメント参照

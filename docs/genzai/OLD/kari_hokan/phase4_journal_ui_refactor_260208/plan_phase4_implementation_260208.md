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

**配置方針**: 選択肢A（journalStore.ts新規作成）を採用
- Phase 2と同じパターン（receiptStore.ts → normalizeReceipt）
- 将来のstate管理も同じファイルに追加可能
- `stores/` = unknown → UI-safe な変換の防波堤
- `adapters/` = domain ↔ UI の型安全な変換（役割が異なる）

**タスク**:

#### 4.2.1: `journalEntryStatus.ts`作成

**ファイル**: `src/shared/journalEntryStatus.ts`

```typescript
/**
 * Journal Entry Status定義
 * 
 * 5つの状態:
 * - Draft: OCR直後（編集中）
 * - Submitted: 提出済み
 * - Approved: 承認済み
 * - READY_FOR_WORK: 1次作業待ち
 * - REMANDED: 差戻し状態
 * 
 * 参照元: JournalEntrySchema.ts L271-276
 */

export const JOURNAL_ENTRY_STATUSES = [
  'Draft',
  'Submitted', 
  'Approved',
  'READY_FOR_WORK',
  'REMANDED'
] as const

export type JournalEntryStatus = typeof JOURNAL_ENTRY_STATUSES[number]

export function isJournalEntryStatus(value: unknown): value is JournalEntryStatus {
  return typeof value === 'string' && JOURNAL_ENTRY_STATUSES.includes(value as JournalEntryStatus)
}
```

---

#### 4.2.2: `journalLineVM.ts`作成

**ファイル**: `src/types/journalLineVM.ts`

```typescript
/**
 * JournalLineVM (Journal Line View Model)
 * 
 * UI表示用の最小構成:
 * - id: 識別子
 * - accountCode: 勘定科目コード（必須）
 * - accountName: 勘定科目名（オプショナル、UI表示用）
 * - debit: 借方金額
 * - credit: 貸方金額
 * 
 * Phase 5送り:
 * - subAccount（補助科目）
 * - taxType, taxRate（税区分・税率）
 * - memo（メモ）
 */

export interface JournalLineVM {
  id: string
  accountCode: string
  accountName?: string
  debit: number
  credit: number
}
```

---

#### 4.2.3: `journalEntryViewModel.ts`作成

**ファイル**: `src/types/journalEntryViewModel.ts`

```typescript
import type { JournalEntryStatus } from '@/shared/journalEntryStatus'
import type { JournalLineVM } from './JournalLineVM'

/**
 * JournalEntryViewModel
 * 
 * UI表示用のJournal Entry構造:
 * - id: 識別子
 * - status: 5つの状態（Draft, Submitted, Approved, READY_FOR_WORK, REMANDED）
 * - clientId: 顧問先ID
 * - lines: 仕訳明細行（JournalLineVMの配列）
 */

export interface JournalEntryViewModel {
  id: string
  status: JournalEntryStatus
  clientId: string
  lines: JournalLineVM[]
}
```

---

#### 4.2.4: `journalStore.ts`作成

**ファイル**: `src/stores/journalStore.ts`

```typescript
/**
 * journalStore
 * 
 * 責務:
 * - unknown / 外部入力を UI-safe な ViewModel に正規化する
 * - domain ↔ UI の型安全な変換は adapters 層の責務
 * 
 * Pattern:
 * - Phase 2 の receiptStore.ts と同じパターン
 * - Phase 5 で state管理を追加する場合もこのファイルに追加
 */

import type { JournalEntryViewModel } from '@/types/JournalEntryViewModel'
import type { JournalLineVM } from '@/types/JournalLineVM'
import { isJournalEntryStatus } from '@/shared/journalEntryStatus'

/**
 * unknown を JournalEntryViewModel に正規化
 * 
 * 防御的な実装:
 * - 型が不正な場合はデフォルト値を使用
 * - UIが壊れないことを最優先
 */
export function normalizeJournalEntry(raw: unknown): JournalEntryViewModel {
  const rawObj = raw as Record<string, unknown>
  
  return {
    id: String(rawObj.id ?? ''),
    status: isJournalEntryStatus(rawObj.status) ? rawObj.status : 'Draft',
    clientId: String(rawObj.clientId ?? ''),
    lines: Array.isArray(rawObj.lines) 
      ? rawObj.lines.map(normalizeJournalLine) 
      : []
  }
}

/**
 * unknown を JournalLineVM に正規化
 * 
 * 鉄のルール:
 * ❌ 税判定しない
 * ❌ 補助科目触らない
 * ✅ UIが壊れないことだけ保証
 */
export function normalizeJournalLine(raw: unknown): JournalLineVM {
  const rawObj = raw as Record<string, unknown>
  
  return {
    id: String(rawObj.id ?? ''),
    accountCode: String(rawObj.accountCode ?? ''),
    accountName: rawObj.accountName ? String(rawObj.accountName) : undefined,
    debit: typeof rawObj.debit === 'number' ? rawObj.debit : 0,
    credit: typeof rawObj.credit === 'number' ? rawObj.credit : 0
  }
}

// NOTE: Phase 5以降で useJournalStore() を追加予定
```

---

**完了条件**:
- ✅ `src/shared/journalEntryStatus.ts` 作成
- ✅ `src/types/journalLineVM.ts` 作成
- ✅ `src/types/journalEntryViewModel.ts` 作成
- ✅ `src/stores/journalStore.ts` 作成
- ✅ 型安全性確保
- ✅ Phase 2パターン完全踏襲

**推定工数**: 小（2-3時間）


---

### Step 4.3: UI条件分岐（status駆動化）

**目的**: ScreenE_Workbench.vueを完全なstatus駆動UIに変換

**方針**: モック段階だが、uiModeへの完全集約を達成し設計汚染を防ぐ

#### Status → UiMode マッピング（確定版）

```typescript
const uiMode = computed<JournalUiMode>(() => {
  if (!entry.value) return 'loading'
  
  switch (entry.value.status) {
    case 'READY_FOR_WORK':
      return 'editable'
    case 'REMANDED':
      return 'remanded'
    case 'Submitted':
    case 'Approved':
      return 'readonly'
    default:
      return 'fallback'  // Draft等、schema未定義の状態
  }
})
```

**注**: `Draft` status はJournalEntrySchemaに未定義のため `fallback` 扱い（Phase 5で決定）

#### 実装タスク

**実装する（承認済み）**:

1. ✅ **Status Badge の uiMode 化**（L17-20）
   - ❌ `entry.status === 'remanded' ? ... : ...`
   - ✅ `:class="{ 'bg-green-100': uiMode === 'editable', ... }"`
   - 4色の色分け: editable=緑、remanded=赤、readonly=青、fallback=グレー

2. ✅ **totalCredit 表示の computed 化**（L175）
   - ❌ `entry.totalCredit?.toLocaleString() || 0`
   - ✅ `totalCredit.toLocaleString()`

3. ✅ **入力フィールド disabled 制御**
   - ヘッダー情報（3項目）: 取引日、取引先名、T番号
   - 仕訳明細行（7項目/行）: 借方科目、借方税区分、借方金額、貸方科目、貸方税区分、貸方金額、摘要
   - すべてに `:disabled="uiMode === 'readonly'"` を追加

4. ✅ **行追加ボタン disabled 制御**（L144-146）
   - 理由: readonly で行追加できると「追加後編集不可」という矛盾

5. ✅ **削除ボタン（×）disabled 制御**（L136-138）
   - 理由: 削除は編集の一種、readonly で可能だと破綻

**実装しない（確定）**:

- ❌ **一時保存/提出ボタンの制御変更**
  - 理由: useJournalEditor の責務、UI側で二重制御すると混乱
  - Phase 5のバックエンド実装時に判断

#### 完了条件

- ✅ `uiMode` computed 実装
- ✅ status 直接参照ゼロ（`entry.status ===` なし）
- ✅ optional chaining 除去（totalDebit/totalCredit）
- ✅ すべての入力・ボタンが uiMode ベースで制御
- ✅ readonly の意味が画面全体で一貫

#### 設計的意義

この実装により以下を達成:
- **status 直接参照ゼロ** - UI条件はすべて uiMode ベース
- **編集可否の完全集約** - 散らばった条件分岐を1箇所に
- **readonly の一貫性** - 「触れないが見える」が画面全体で統一

→ 「UI条件分岐を status 駆動にする」を思想・実装・UX すべてで達成

**推定工数**: 中（2-3時間）

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

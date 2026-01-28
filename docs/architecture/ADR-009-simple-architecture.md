# ADR-009: シンプルアーキテクチャへの回帰

**Status**: Accepted  
**Date**: 2026-01-22  
**Owner**: 司令官  
**Supersedes**: ADR-004, ADR-005, ADR-006, ADR-008  
**関連**: SESSION_20260122.md, investigateExistingCode.ts

---

## Context（背景）

### 過剰設計の発覚

2026-01-22の議論により、以下が明確になった：

**問題の認識**:
```
提案されたアーキテクチャ: Penta-Shield（5層防御） + Layer A/B/C
実際に必要なもの: シンプルな3層構成

例え:
「自転車を買いたい」と相談したら「戦車の設計図」を渡された状態
```

### ADR-004/005/006/008の問題点

#### 1. **Penta-Shield（ADR-004/005/006）は過剰**

| 層 | 提案内容 | 評価 |
|----|---------|------|
| L1 | Zod Guard（構造防御） | ✅ 適切 |
| L2 | Semantic Guard（業務防御） | ✅ 適切 |
| L3 | State Guard（状態遷移防御） | ⚠️ やや過剰 |
| L4 | Visual Guard（自動Visual Regression） | ❌ 完全に不要 |
| L5 | Sandbox Guard（Prompt Injection対策） | ❌ 完全に不要 |

**理由**:
- 小規模な仕訳システムに5層防御は重すぎる
- L4（Visual Regression Test）: セットアップコスト > 得られる価値
- L5（Sandbox Guard）: そもそもAIに命令させない設計で済む

#### 2. **Layer A/B/C（ADR-008）も過剰**

**提案内容**:
- Layer A: Technical Layer Verification（console.log検証）
- Layer B: Mapping Table（L4代替）
- Layer C: Service Unit Test + Type Enforcement（L5代替）

**問題**:
- Layer A/B/Cという概念自体が複雑
- 普通のテストで十分
- L4/L5への「移行計画」が前提（でもL4/L5自体が不要）

#### 3. **過剰な仕組み**

**Evidence ID**:
```typescript
// 提案された実装
export class BusinessRuleError extends Error {
  constructor(
    message: string,
    public evidenceId: string = generateEvidenceId()  // ← 不要
  ) { ... }
}
```
- 大規模システム向け
- 仕訳システムでは単なるエラーメッセージで十分

**AllowedCallers型制約**:
```typescript
// 提案された実装
type AllowedCallers = "ScreenE_JournalEntry" | "ScreenB_JobList";
JournalService.create(data, "ScreenE_JournalEntry");  // ← 過剰
```
- 呼び出し元をここまで制限する必要がない
- 柔軟性を失う
- 保守が大変（画面追加のたびに型定義修正）

---

## 既存コードの実態調査

### 調査の目的

**過剰設計と判明したが、既に実装されているコードをどうするか？**

選択肢を決定するため、既存コード（Receipt, Client, Job, Staff）の動作確認を実施。

### テスト内容（6項目）

**テストファイル**: `src/test/investigateExistingCode.ts`

| Test | 内容 | 目的 |
|------|------|------|
| **Test 1** | 関数の存在確認 | `submitReceipt`等がimportできるか |
| **Test 2** | Draft作成 | L1（Zodバリデーション）が動くか |
| **Test 3** | submitReceipt（正常系） | L1→L2→L3パイプラインが動くか |
| **Test 4** | L2バリデーション（貸借不一致） | 業務ルールが検出できるか |
| **Test 5** | L3状態遷移（正常系） | Draft→Submitted→Approvedが動くか |
| **Test 6** | L3禁止遷移 | Approved→Draftを拒否できるか |

### 3つの選択肢

テスト結果に応じて、以下の3つから選択：

#### **選択肢A: 全削除して書き直し**

**条件**: パターンC（全く動かない） ❌❌❌❌❌❌

**内容**:
- 既存コード（Receipt, Client, Job, Staff）を削除
- シンプル版（3層構成）でゼロから実装

**所要時間**: 3-5日  
**リスク**: 高（新規実装のバグ混入）  
**メリット**: コードがシンプルになる

---

#### **選択肢B: そのまま使う（推奨）**

**条件**: パターンA（完全動作） ✅✅✅✅✅✅

**内容**:
- 既存コード（Receipt, Client, Job, Staff）はそのまま維持
- 新機能（仕訳入力等）のみシンプル版で実装

**所要時間**: 0日（既存コードは触らない）  
**リスク**: 低（動いているコードはそのまま）  
**メリット**: 即座に新機能開発に着手できる

---

#### **選択肢C: 部分的に修正**

**条件**: パターンB（部分動作） ✅✅❌❌✅❌

**内容**:
- 動く部分は残す
- 壊れている部分だけ修正
- Evidence ID等の無駄を削除

**所要時間**: 1-2日  
**リスク**: 中（修正箇所にバグ混入の可能性）  
**メリット**: 過剰な部分を削除できる

---

### テスト実施結果（2026-01-22）

**実施方法**:
1. 開発サーバー起動（`npm run dev`）
2. ブラウザでhttp://localhost:5173/にアクセス
3. コンソールでテスト結果を確認

**結果**:

| Test | 結果 | 詳細 |
|------|------|------|
| **Test 1** | ✅ | 関数の存在確認 - `submitReceipt`, `createDraftReceipt`, `updateReceiptStatus`が正常にインポート |
| **Test 2** | ✅ | Draft作成成功 - ID: 6e679206-bdc0-4b29-a403-0b3181583f68 |
| **Test 3** | ✅ | submitReceipt正常動作 - L1→L2→L3パイプライン通過、status: Submitted、total: 2000 |
| **Test 4** | ✅ | L2バリデーション動作 - 貸借不一致を正しく検出「貸借合計が一致しません」 |
| **Test 5** | ✅ | L3状態遷移動作 - Submitted → Approved が正常に完了 |
| **Test 6** | ✅ | L3禁止遷移ガード動作 - Approved → Draft を正しく拒否 |

**判定**: **パターンA（完全動作）** ✅✅✅✅✅✅

---

## Decision（決定事項）

### **選択肢B: そのまま使う + シンプルな3層構成を採用**

#### テスト結果に基づく選択理由

**パターンA（完全動作）を確認**:
- すべてのテストが成功
- L1（Zod）、L2（業務ルール）、L3（状態遷移）すべて正常
- 既存実装（総計8000行以上）は完全に動作している

**選択肢Bを選択した経緯**:
1. ✅ **動いているコードを書き直すリスク > 過剰設計を許容するコスト**
2. ✅ **新機能開発に時間を使う方が価値が高い**
3. ✅ **Evidence ID等は無駄だが、害はない**
4. ✅ **「動いているコードは触らない」原則**

---

### 1. **採用する構成**

```
L3（データ層）:
  - Zodスキーマ定義
  - 型定義
  - リポジトリ（データアクセス）

L2（ロジック層）:
  - バリデーション（Zodを使う）
  - 業務ルール（借方=貸方）
  - 状態遷移（Draft→Submitted→Approved）

L1（UI層）:
  - Vueコンポーネント
  - L2を呼ぶだけ
```

### 2. **既存実装の扱い**

**既存コード（Receipt, Client, Job, Staff）**:
- ✅ **そのまま維持**（動いているコードは触らない）
- ✅ L1-L3実装済み（総計8000行以上）
- ✅ 過剰な部分（Evidence ID等）はあるが、害はない
- ✅ テスト結果でパターンA（完全動作）を確認済み

**ファイル構成**:
```
src/features/receipt/
├── ReceiptSchema.ts (1632 bytes)
├── ReceiptSemanticGuard.ts (2349 bytes)
├── receiptStateMachine.ts (1954 bytes)
├── index.ts (2191 bytes)
├── types.ts (609 bytes)
└── __tests__/

同様の構成:
- src/features/client/
- src/features/job/
- src/features/staff/
```

### 3. **新機能の実装方針**

**新機能（仕訳入力、CSV出力等）**:
- ✅ **シンプル版で実装**
- ✅ Evidence ID不要
- ✅ AllowedCallers型制約不要
- ✅ L4/L5不要
- ✅ Layer A/B/C概念不要

**実装例**:
```typescript
// L3: スキーマ定義
export const JournalEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  lines: z.array(JournalLineSchema).min(1),
  description: z.string(),
  status: z.enum(['draft', 'submitted', 'approved']),
});

// L2: ビジネスロジック
export class JournalService {
  static validate(entry: unknown): JournalEntry {
    // 1. 型チェック（Zod）
    const result = JournalEntrySchema.safeParse(entry);
    if (!result.success) {
      throw new Error(result.error.errors[0].message);  // ← シンプル
    }
    
    // 2. 借方=貸方チェック
    if (!this.isBalanced(result.data.lines)) {
      throw new Error('借方と貸方の合計が一致しません');  // ← シンプル
    }
    
    return result.data;
  }
}
```

### 4. **廃止する概念**

| 概念 | Status |
|------|--------|
| L4（Visual Guard） | ❌ 永久に不採用 |
| L5（Sandbox Guard） | ❌ 永久に不採用 |
| Layer A/B/C | ❌ 永久に不採用 |
| Evidence ID | ❌ 新規採用禁止（既存は維持） |
| AllowedCallers型制約 | ❌ 新規採用禁止（既存は維持） |
| Visual Regression Test（自動） | ❌ 不要（手動で十分） |

---

## Consequences（影響）

### 正の影響

| 観点 | 効果 |
|------|------|
| **開発速度** | 複雑な層構造がなくなり、即座に開発開始可能 |
| **理解しやすさ** | 新メンバーが3層構成を即座に理解できる |
| **保守性** | シンプルなコードは保守が容易 |
| **柔軟性** | 過剰な型制約がなく、改修が容易 |
| **既存資産の活用** | 動いている8000行以上のコードを無駄にしない |

### 負の影響

| 観点 | 影響 | 対策 |
|------|------|------|
| **防御力の低下** | L4/L5がないため、一部の防御が弱い | 手動テストで補完 |
| **既存コードの複雑性** | Receipt等は複雑なまま残る | 動いているなら問題なし |
| **コードスタイルの不統一** | 既存（複雑）と新規（シンプル）で差 | 段階的に統一（優先度低） |

---

## ADR-004/005/006/008との関係

### Status更新

| ADR | 旧Status | 新Status | 理由 |
|-----|---------|---------|------|
| ADR-004 | Frozen | Superseded by ADR-009 | 過剰設計 |
| ADR-005 | Accepted | Superseded by ADR-009 | 過剰設計 |
| ADR-006 | Accepted | Superseded by ADR-009 | 過剰設計 |
| ADR-008 | Accepted | Superseded by ADR-009 | 過剰設計 |

### 歴史的記録としての価値

**ADR-004/005/006は参考資料として残す**:
- ✅ L1-L3の設計思想は有用
- ✅ Draft/Receipt分離の考え方は採用
- ⚠️ L4/L5、Evidence ID等は不採用

---

## 今後の方針

### 推奨する進め方

**今週**:
1. ✅ 既存コード（Receipt, Client, Job, Staff）はそのまま使う
2. ✅ 新機能（仕訳入力）はシンプル版で実装
3. ✅ ADR-009を全員が読む

**来週以降**:
1. シンプル版の実装を継続
2. 問題が出たら、その時に修正
3. 新メンバーが困ったら、その部分だけリファクタリング

### 採用する技術

| 技術 | 採用理由 |
|------|---------|
| Zod | 型安全、シンプル、実績あり |
| TypeScript | 型チェック、IDE補完 |
| Vue 3 | 既存実装との統一 |
| Firestore | 既存実装との統一 |

### 採用しない技術

| 技術 | 不採用理由 |
|------|----------|
| Storybook + Visual Regression | セットアップコスト > 価値 |
| 複雑な状態管理（XState等） | 過剰 |
| Evidence ID自動生成 | 不要（既存は維持） |

---

## 参考：ADR-004/005/006の良い部分

**残すべき考え方**:
1. ✅ **Draft/Receipt分離** - OCR入力の不完全データを受け入れる
2. ✅ **Zodバリデーション** - 型安全の基礎
3. ✅ **業務ルールの分離** - 借方=貸方チェック等
4. ✅ **シンプルな状態遷移** - Draft→Submitted→Approved

**削除すべき部分**:
1. ❌ **5層防御** - 3層で十分
2. ❌ **Evidence ID** - 過剰（既存は維持）
3. ❌ **AllowedCallers** - 過剰（既存は維持）
4. ❌ **L4/L5** - 不要

---

## テスト記録

### 実施テスト

**ファイル**: `src/test/investigateExistingCode.ts`  
**実施日**: 2026-01-22  
**実施者**: AI（ブラウザ自動操作）

### テスト詳細

```typescript
// Test 1: 関数の存在確認
console.log('submitReceipt:', typeof submitReceipt);  // ✅ 'function'

// Test 2: Draft作成
const draft = createDraftReceipt({ ... });  // ✅ 成功

// Test 3: submitReceipt（正常系）
const receipt = submitReceipt(draft);  // ✅ L1→L2→L3通過

// Test 4: L2バリデーション（貸借不一致）
submitReceipt(unbalancedDraft);  // ✅ エラー検出

// Test 5: L3状態遷移（正常系）
updateReceiptStatus(receipt, 'Approved');  // ✅ 成功

// Test 6: L3禁止遷移
updateReceiptStatus(approved, 'Draft');  // ✅ エラー検出
```

### パターン判定ロジック

```
すべて✅ → パターンA（完全動作）→ 選択肢B（そのまま使う）
一部❌  → パターンB（部分動作）→ 選択肢C（部分修正）
すべて❌ → パターンC（全く動かない）→ 選択肢A（書き直し）

今回の結果: ✅✅✅✅✅✅ → パターンA → 選択肢B
```

---

## 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2026-01-22 | 初版作成（シンプルアーキテクチャへの回帰、テスト結果含む） | 司令官 + AI |

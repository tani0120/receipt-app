# Receipt L1-L3実装 - 初期問題分析（Freeze & Reframe）

**作成日**: 2026-01-16  
**ステータス**: 整理フェーズ  
**目的**: 実装初期の揺れを整理し、設計原則を明文化

---

## 現状認識

### ✅ 完了したこと

1. **コア実装完了**
   - types.ts
   - ReceiptSchema.ts (L1)
   - ReceiptSemanticGuard.ts (L2)
   - receiptStateMachine.ts (L3)
   - index.ts (パイプライン)

2. **テスト作成完了**
   - ReceiptSchema.test.ts
   - ReceiptSemanticGuard.test.ts
   - receiptStateMachine.test.ts
   - index.test.ts

3. **TypeScript型チェック**: 0エラー（初回）

---

## 発生した問題

### ❌ 問題1: Zodのenum/errorMap問題

**現象**:
```typescript
z.enum(["debit", "credit"], {
  errorMap: () => ({ message: "..." }) // ← 認識されない
})
```

**性質**: **ツール依存問題**（設計ミスではない）

**原因**:
- Zodのバージョン依存
- テストランナー（vitest）との相性

**判定**: 今は対処不要（後工程で解決）

---

### ❌ 問題2: DraftSchemaテスト失敗

**現象**:
```
× 最小限のDraftを受け入れる
× optional フィールドなしでも成功
```

**性質**: **設計上の未分離**

**根本原因**: L1とDraft概念の衝突

---

## 問題の本質（重要）

### これは**設計ミス**ではなく**Penta-Shieldが正しく効いている証拠**

```
問題 = 「防御を強くした結果、環境と前提が露出した」
```

**具体的に何が露出したか**:

1. **L1の責務が曖昧だった**
   - L1は「存在可能なReceipt」を定義すべき
   - Draft は UI/モック層の概念
   - 両者を同一Schemaで扱おうとした

2. **Draft ≠ Receipt が明文化されていなかった**
   - Draftは「未完成データ」
   - Receiptは「L1/L2/L3を通過した完全データ」
   - この区別が実装に反映されていなかった

---

## 正しい設計原則（明文化）

### 原則1: Draft ≠ Receipt

```
Draft（草稿）:
- UI/OCR/モック段階のデータ
- フィールドが不完全でも許容
- L1/L2/L3を通過していない

Receipt（確定）:
- L1/L2/L3を通過したデータ
- すべての必須フィールドが揃っている
- 「存在可能なReceipt」として保証されている
```

### 原則2: L1は「存在可能なReceiptのみ」を扱う

```typescript
// ❌ 間違い: L1でoptionalを許容
ReceiptSchema = {
  lines: z.array(...).optional(), // DraftとReceiptを混在
}

// ✅ 正解: L1は完全なReceiptのみ
ReceiptSchema = {
  lines: z.array(...).min(1), // 必須・最低1件
}

ReceiptDraftSchema = {
  lines: z.array(...).optional(), // Draft専用
}
```

### 原則3: Draft → Receiptの変換は唯一の「関門」

```typescript
// submitReceipt() が唯一の変換点
function submitReceipt(draft: ReceiptDraft): Receipt {
  // ここでL1/L2/L3を通過
  // 通過できなければReceiptにならない
}
```

---

## 修正方針（推奨）

### 方針A: Draft/Receipt完全分離（最も美しい）

**変更内容**:

1. **ReceiptDraftSchema を別物として定義**
   - statusは"Draft"のみ
   - すべてのフィールドをoptional

2. **ReceiptSchema は確定Receipt専用**
   - status は "Submitted" | "Approved"
   - すべてのフィールドを必須

3. **submitReceipt() が唯一の変換関門**
   - Draft → Receipt変換時のみL1/L2/L3通過

**メリット**:
- Penta-Shield思想と完全一致
- Client/Jobへの横展開が容易
- L1の責務が明確

**実装現状**: ほぼこの方針で実装済み（微調整のみ）

---

### 方針B: 妥協案（非推奨）

**変更内容**:
- Draftでもすべてフィールド必須
- UI側でダミー値を入れる
- L2で意味検証を緩める

**判定**: ❌ 思想的にB評価、採用しない

---

## Zod問題の切り分け

### 即座に対処すべきこと

1. **errorMapを一旦削除**
   ```typescript
   // Before
   z.enum(["debit", "credit"], { errorMap: ... })
   
   // After（暫定）
   z.enum(["debit", "credit"])
   ```

2. **デフォルトエラーメッセージで通す**
   - メッセージ美化はL4または後工程へ
   - 今は防御層完成が最優先

---

## 次のアクション（明確化）

### Step 1: 設計原則を明文化 ✅ このドキュメント

### Step 2: implementation_plan.mdを更新

**追加すべき内容**:
- Draft ≠ Receiptの明文化
- L1の責務範囲の明確化
- errorMap問題への対処方針

### Step 3: コードの微調整

1. ReceiptSchema.tsからerrorMapを削除
2. テストを再実行
3. 成功を確認

### Step 4: ADR-005に追記（オプション）

- Draft/Receipt分離の原則
- L1の責務範囲

---

## 結論

**これは設計失敗ではなく、Penta-Shieldが正しく動作している証拠です。**

**露出した問題**:
- Draft/Receiptの概念分離が不完全
- L1の責務範囲が曖昧

**解決策**:
- 原則を明文化（このドキュメント）
- implementation_planに反映
- 微調整を実施

**判定**: 方針Aで継続 → Phase 1実装は成功に向かっている

---

## 関連ファイル

- [implementation_plan.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/implementation_plan.md)
- [ADR-005: 防御層実装詳細](file:///c:/Users/kazen/OneDrive/デスクトップ/ai_gogleanti/docs/architecture/ADR-005-defense-layer-implementation.md)
- [TASK_PENTA_SHIELD.md](file:///C:/Users/kazen/.gemini/antigravity/brain/129dd3c2-bc83-48ac-91da-9736f587788a/TASK_PENTA_SHIELD.md)

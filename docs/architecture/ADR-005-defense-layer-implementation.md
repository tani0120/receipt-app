# ADR-005: 防御層実装詳細（L1/L2/L3）

**Status**: Accepted（Freeze）  
**Date**: 2026-01-16  
**Owner**: Human（最終責任）  
**Scope**: Penta-Shield コア防御層の実装仕様  
**Parent**: [ADR-004: Penta-Shield](./ADR-004-penta-shield-defense-layers.md)

---

## Context（背景）

ADR-004でPenta-Shield（5層防御）を定義したが、L1/L2/L3は**コア防御層**として最も頻繁に実装・参照される。

本ADRでは、これら3層の実装詳細を明文化する。

---

## L1: Zod Guard（構造防御）

### 目的

データ構造・型の強制的な検証

### 実装要件

#### 1. すべてのエンティティにZodスキーマを定義

```typescript
// src/features/receipt/ReceiptSchema.ts
import { z } from "zod";

export const ReceiptLineSchema = z.object({
  accountCode: z.string().min(1),
  amount: z.number().int(),
});

export const ReceiptSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["Draft", "Submitted", "Approved"]),
  lines: z.array(ReceiptLineSchema).min(1),
  total: z.number().int(),
  confidence: z.number().min(0).max(1),
});

export type ReceiptInput = z.infer<typeof ReceiptSchema>;
```

#### 2. Keys定義（ADR-001準拠）

```typescript
export const ReceiptKeys = ReceiptSchema.keyof().enum;
export type ReceiptKey = keyof typeof ReceiptKeys;
```

#### 3. パイプライン強制

```typescript
// API受信時
const receipt = ReceiptSchema.parse(input); // ✅ 必須

// ❌ 禁止
const receipt = input as Receipt;
```

### エラーハンドリング

```typescript
try {
  const receipt = ReceiptSchema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    // ログ記録・Evidence ID生成
    throw new StructureValidationError(error);
  }
}
```

---

## L2: Semantic Guard（業務意味防御）

### 目的

業務ルール・意味整合性の検証

### 実装要件

#### 1. Semantic Guard クラス作成

```typescript
// src/features/receipt/ReceiptSemanticGuard.ts
export class BusinessRuleError extends Error {
  constructor(message: string, public evidenceId: string) {
    super(message);
    this.name = "BusinessRuleError";
  }
}

export class ReceiptSemanticGuard {
  static validate(receipt: Receipt): void {
    // 貸借一致
    if (!this.isBalanced(receipt.lines)) {
      throw new BusinessRuleError(
        "貸借合計が一致しません",
        generateEvidenceId()
      );
    }

    // OCR信頼度
    if (receipt.confidence < 0.8) {
      throw new BusinessRuleError(
        "OCR信頼度が不足しています",
        generateEvidenceId()
      );
    }
  }

  private static isBalanced(lines: ReceiptLine[]): boolean {
    const total = lines.reduce((sum, l) => sum + l.amount, 0);
    return total === 0; // 借方・貸方の合計が0
  }
}
```

#### 2. Zodと分離

```
❌ 禁止: Zodスキーマ内でrefineを使って業務ルールを書く
✅ 正解: Semantic Guardとして独立したクラスを作成
```

#### 3. パイプライン

```typescript
const receipt = ReceiptSchema.parse(input); // L1
ReceiptSemanticGuard.validate(receipt);    // L2
// ここを通過したものだけがDB/UIに行ける
```

---

## L3: State Guard（状態遷移防御）

### 目的

時間軸・業務フローの保護

### 問題の本質

**AIは「現在の正しさ」を最大化するが、過去との整合性・不可逆性を軽視する。**

実際に起こりうる事故：
- `Approved → Pending`（承認済みデータの巻き戻し）
- `Locked → *`（確定データの再編集）
- `Archived → Active`（履歴の再利用）

### State Model（状態定義）

```typescript
type EntityState =
  | "Draft"      // 作成途中
  | "Pending"    // 承認待ち
  | "Approved"   // 承認済
  | "Locked"     // 確定・変更不可
  | "Archived";  // 履歴保存
```

### 許可遷移

```
Draft     → Pending
Pending   → Approved
Approved  → Locked
Locked    → Archived
```

### 禁止遷移

```
Approved → Pending   ❌
Approved → Draft     ❌
Locked   → *         ❌（すべて）
Archived → *         ❌（すべて）
```

### 実装要件

#### 1. 状態遷移マシン定義（XState推奨）

```typescript
// src/features/receipt/receiptStateMachine.ts
import { createMachine } from "xstate";

export type ReceiptEvent =
  | { type: "SUBMIT" }
  | { type: "APPROVE" }
  | { type: "LOCK" };

export const receiptStateMachine = createMachine<
  { status: ReceiptStatus },
  ReceiptEvent
>({
  id: "receipt",
  initial: "Draft",
  states: {
    Draft: {
      on: { SUBMIT: "Submitted" },
    },
    Submitted: {
      on: { APPROVE: "Approved" },
    },
    Approved: {
      on: { LOCK: "Locked" },
    },
    Locked: {
      type: "final",
    },
  },
});
```

#### 2. 遷移検証関数

```typescript
export class StateTransitionError extends Error {
  constructor(
    public from: ReceiptStatus,
    public to: ReceiptStatus,
    public evidenceId: string
  ) {
    super(`禁止遷移: ${from} → ${to}`);
    this.name = "StateTransitionError";
  }
}

export function assertReceiptTransition(
  from: ReceiptStatus,
  to: ReceiptStatus
): void {
  const allowed: Record<ReceiptStatus, ReceiptStatus[]> = {
    Draft: ["Submitted"],
    Submitted: ["Approved"],
    Approved: ["Locked"],
    Locked: [],
  };

  if (!allowed[from]?.includes(to)) {
    throw new StateTransitionError(
      from,
      to,
      generateEvidenceId()
    );
  }
}
```

#### 3. 直接的な状態変更の禁止

```typescript
// ❌ 禁止
receipt.status = "Approved";

// ✅ 正解
assertReceiptTransition(receipt.status, "Approved");
receipt.status = "Approved";
```

### 人間介入条件

L3（State Guard）のみ、以下の場合に人間コメントが必須：
- 禁止遷移の復旧
- 状態修復（データ補正）
- 強制ロールバック

---

## 実装パイプライン（完全版）

```typescript
export function createReceipt(input: unknown): Receipt {
  // L1: 構造検証
  const parsed = ReceiptSchema.parse(input);
  
  // L2: 業務検証
  ReceiptSemanticGuard.validate(parsed);
  
  // L3: 状態検証（新規作成時はDraft固定）
  if (parsed.status !== "Draft") {
    throw new StateTransitionError(
      "none",
      parsed.status,
      generateEvidenceId()
    );
  }
  
  return parsed;
}

export function updateReceiptStatus(
  receipt: Receipt,
  newStatus: ReceiptStatus
): Receipt {
  // L3: 遷移検証
  assertReceiptTransition(receipt.status, newStatus);
  
  // 状態更新
  const updated = { ...receipt, status: newStatus };
  
  // L2: 更新後の業務検証
  ReceiptSemanticGuard.validate(updated);
  
  return updated;
}
```

---

## ディレクトリ構成

```
src/features/receipt/
├─ ReceiptSchema.ts           // L1
├─ ReceiptSemanticGuard.ts    // L2
├─ receiptStateMachine.ts     // L3
├─ types.ts
└─ index.ts                    // パイプライン定義
```

---

## Consequences（影響）

### 正の影響

| 観点 | 効果 |
|------|------|
| **データ破壊防止** | L1/L2で意味的に誤ったデータを完全ブロック |
| **業務フロー保護** | L3で時間軸の整合性を保証 |
| **AI暴走封殺** | 3層すべて通過しない限り存在できない |

### 負の影響

| 観点 | 影響 |
|------|------|
| **実装コスト** | L1〜L3を全エンティティに実装する工数 |
| **学習コスト** | 新規参加者が理解する必要 |

👉 **許容する（安全性を優先）**

---

## 関連ADR

- [ADR-001: 型安全マッピング戦略](./ADR-001-type-safe-mapping.md)
- [ADR-004: Penta-Shield（親ADR）](./ADR-004-penta-shield-defense-layers.md)
- [ADR-006: UI・CI統合（L4/L5）](./ADR-006-ui-ci-integration.md)

---

## 変更履歴

| 日付 | 変更内容 | 変更者 |
|------|---------|--------|
| 2026-01-16 | 初版作成（旧ADR-005を統合・拡張） | 司令官 + AI |

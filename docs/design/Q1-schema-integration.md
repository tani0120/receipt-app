# Q1: スキーマ統合方針

**日付**: 2026-01-15  
**ステータス**: 人間の承認待ち

---

## 既存ClientSchema（現在30フィールド）

```typescript
export const ClientSchema = z.object({
  // 基本情報
  clientCode: z.string(),
  companyName: z.string(),
  type: z.enum(['corp', 'individual']).optional(),
  repName: z.string().optional(),
  staffName: z.string().optional(),
  
  // 既存30フィールド
  // ...（詳細は本文参照）
});
```

---

## 新規要件（8フィールド追加）

- `companyNameKana`（会社名フリガナ）
- `repNameKana`（代表者名フリガナ）
- `establishedDate`（設立年月日）
- `phoneNumber`（電話番号）
- `advisoryFee`（顧問報酬・月額）
- `bookkeepingFee`（記帳代行・月額）
- `settlementFee`（決算報酬・年次）
- `taxFilingFee`（消費税申告報酬・年次）

---

## 選択肢

### ✅ 選択肢1：既存ClientSchemaに追加（推奨）

**実装**:
```typescript
export const ClientSchema = z.object({
  // 既存30フィールド
  // ...
  
  // 新規8フィールド
  companyNameKana: z.string().optional(),
  advisoryFee: z.number().default(0),
  // ...
});
```

**メリット**:
- シンプル（1スキーマで完結）
- マイグレーション不要
- 既存コード修正が少ない

**デメリット**:
- スキーマが38フィールドと大きい

---

### 選択肢2：別スキーマ作成

**メリット**: 既存を壊さない  
**デメリット**: 複雑、型推論が難しい

### 選択肢3：データ分割

**メリット**: 論理的分離  
**デメリット**: サブコレクション管理が複雑

---

## 推奨：選択肢1

**理由**:
1. シンプル
2. `.optional()`と`.default()`で既存データ対応
3. Firestoreの実態と一致

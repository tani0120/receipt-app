# Q1補足：指摘事項の詳細調査

**日付**: 2026-01-15  
**ステータス**: 調査中

---

## 指摘1：ジョブIDについて

### **ユーザーの指摘**
> 一意のIDを付与しないと領収書を仕訳してCSV化する際等にどの顧問先かわからないのでは？

### **調査結果**

**既存の実装**：
- `JobSchema`（領収書処理）には`jobId`が存在
- `ClientSchema`（顧問先情報）には存在しない

```typescript
// JobSchema（既存）
export const JobSchema = z.object({
  jobId: z.string().optional(), // ← 領収書処理のID
  clientCode: z.string(),        // ← 顧問先を識別
  // ...
});
```

### **解釈の問題**

**「ジョブID：自動採番」の意味**：

**解釈A**: Clientに一意のIDが必要
- → `clientCode`（3コード）が既に一意の識別子
- → 別途IDは不要？

**解釈B**: Clientに内部IDが必要
- → Firestoreドキュメントパス自体が一意（`/clients/{clientCode}`）
- → 別途IDは不要？

**解釈C**: フォーム要件の「ジョブID」は誤記
- → 実際は「顧問先ID」または「クライアントNo」？

### **質問**

1. `clientCode`（3コード）とは別に、Clientに一意のIDが必要ですか？
2. 「ジョブID」とは何を指していますか？
   - A: ClientのシステムID
   - B: Jobの処理ID（別物）
   - C: その他

---

## 指摘2：標準決済手段の変更影響

### **現状**

**既存の値**:
```typescript
z.enum(['cash', 'credit_card', 'bank_transfer'])
```

**新規要件**:
```typescript
z.enum(['cash', 'owner_loan', 'accounts_payable']) // 現金/社長借入金/未払金
```

### **影響範囲調査**

**使用箇所**：
1. `src/types/zod_schema.ts` - スキーマ定義
2. `src/types/firestore.ts` - TypeScript型定義
3. UI表示（Mapper等）

**既存Firestoreデータ**：
- 現在の値：`'cash'`, `'credit_card'`, `'bank_transfer'`
- 変更後は全て無効な値になる

### **影響**

| 影響範囲 | 詳細 |
|---------|------|
| **既存データ** | 全て無効な値になる（マイグレーション必要） |
| **型定義** | TypeScriptエラー発生（全箇所修正必要） |
| **UI表示** | Mapperのラベル変換が必要 |

### **マイグレーション必要**

```typescript
// 既存データの変換が必要
const migration = {
  'credit_card': 'accounts_payable', // クレカ → 未払金？
  'bank_transfer': 'accounts_payable', // 振込 → 未払金？
  'cash': 'cash', // 現金 → 現金
};
```

### **質問**

1. 既存データは破棄して良い？（テストデータのみ？）
2. マイグレーション方針は？
   - A: 手動で再入力
   - B: スクリプトで一括変換
   - C: UI上で「未設定」として入力を促す

---

## 指摘3：3コード重複チェック

### **実装方針**

**バリデーション**：
```typescript
const clientCodeValidator = z.string()
  .length(3, '3文字で入力してください')
  .regex(/^[A-Z]{3}$/, '大文字アルファベット3文字で入力してください')
  .refine(
    async (code) => {
      // Firestoreで重複チェック
      const exists = await checkClientCodeExists(code);
      return !exists;
    },
    '既に登録されているコードです。別のコードを入力してください。'
  );
```

**UI動作**：
1. 入力時にリアルタイム検証
2. 重複があれば赤字でエラー表示
3. 保存ボタンを無効化

**編集時の考慮**：
- 自分自身のコードは除外してチェック
  ```typescript
  const exists = await checkClientCodeExists(code, excludeClientCode);
  ```

---

## 指摘4：月次報酬合計・年間総報酬が抜けている

### **省略した理由**

**自動算出フィールドはFirestoreに保存しない方針**

**理由**：
1. **データの正規化**：元データ（顧問報酬等）から常に算出可能
2. **不整合リスク**：保存すると、元データ更新時に不整合の可能性
3. **パフォーマンス**：計算コストが低い（単純な足し算・掛け算）

**実装方針**：
```typescript
// Firestoreには保存しない
export const ClientSchema = z.object({
  advisoryFee: z.number().default(0),
  bookkeepingFee: z.number().default(0),
  settlementFee: z.number().default(0),
  taxFilingFee: z.number().default(0),
  // monthlyTotalFee: 保存しない
  // annualTotalFee: 保存しない
});

// UI表示時に算出
export const ClientUiSchema = z.object({
  advisoryFee: z.number(),
  bookkeepingFee: z.number(),
  monthlyTotalFee: z.number(), // ← Mapperで算出
  annualTotalFee: z.number(),  // ← Mapperで算出
});

// Mapperで算出
function calculateFees(client: Client): ClientUi {
  return {
    ...client,
    monthlyTotalFee: client.advisoryFee + client.bookkeepingFee,
    annualTotalFee: 
      client.advisoryFee * 12 + 
      client.bookkeepingFee * 12 + 
      client.settlementFee + 
      client.taxFilingFee,
  };
}
```

### **代替案：Firestoreに保存する**

**メリット**：
- クエリ・ソートが高速
- 集計が簡単

**デメリット**：
- 冗長データ
- 不整合リスク
- フォーム送信時に算出・保存の処理が必要

### **質問**

1. 月次報酬合計・年間総報酬をFirestoreに保存する？
   - A: 保存しない（毎回算出）← 推奨
   - B: 保存する（冗長だが高速）

---

## 他に抜けているフィールド

### **確認**

要件一覧を再チェック：

| フィールド | 既存/新規 | スキーマ名 | 状態 |
|-----------|---------|-----------|------|
| 月次報酬合計 | 算出 | - | 保存方針を確認中 |
| 年間総報酬 | 算出 | - | 保存方針を確認中 |

**他に抜けはありません。**

---

**次のアクション：人間の回答待ち**

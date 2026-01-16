# Q2: 会計ソフト選択肢の確認

**日付**: 2026-01-15  
**ステータス**: 人間の承認待ち

---

## 問題

**要件**：
> 会計ソフト：MF／Freee／弥生／**TKC**

**既存の実装**：
```typescript
export const AccountingSoftwareSchema = z.enum(['yayoi', 'freee', 'mf', 'other']);
```

**問題点**：
- TKCが選択肢にない
- `'other'`が存在する

---

## 選択肢

### **選択肢1：TKCを追加、otherを残す（推奨）**

```typescript
export const AccountingSoftwareSchema = z.enum(['yayoi', 'freee', 'mf', 'tkc', 'other']);
```

**メリット**：
- ✅ TKCが明示的な選択肢になる
- ✅ 将来的に他のソフト追加も可能（`'other'`で対応）
- ✅ 既存データ（`'other'`）も有効

**デメリット**：
- なし

---

### **選択肢2：TKCを追加、otherを削除**

```typescript
export const AccountingSoftwareSchema = z.enum(['yayoi', 'freee', 'mf', 'tkc']);
```

**メリット**：
- ✅ 選択肢が明確（4種のみ）
- ✅ データの品質向上（曖昧な`'other'`がない）

**デメリット**：
- ❌ 将来的に新ソフトが必要な場合、スキーマ変更必須
- ❌ 既存データで`'other'`があれば無効になる

---

### **選択肢3：変更なし（otherでTKCも対応）**

**メリット**：
- ✅ スキーマ変更不要

**デメリット**：
- ❌ TKCが明示的な選択肢でない
- ❌ ドロップダウンで「TKC」が表示されない

---

## 影響範囲

### **使用箇所**

1. `ClientSchema`（zod_schema.ts）
2. `Client` interface（firestore.ts）
3. UI表示（Mapper等）

### **既存データ**

現在の値を調査：
- `'yayoi'`, `'freee'`, `'mf'`, `'other'`

TKCを追加した場合：
- 既存データは全て有効（変更不要）

---

## 推奨：選択肢1

**理由**：
1. TKCが明示的な選択肢になる
2. 既存データを壊さない
3. 将来の拡張性も確保

**実装**：
```typescript
// src/types/zod_schema.ts
export const AccountingSoftwareSchema = z.enum(['yayoi', 'freee', 'mf', 'tkc', 'other']);

// src/types/firestore.ts
accountingSoftware: 'yayoi' | 'freee' | 'mf' | 'tkc' | 'other';
```

---

**この方針で良いですか？**

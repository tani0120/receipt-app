# Q3: 担当者マスタの確認

**日付**: 2026-01-15  
**ステータス**: 調査完了、人間の承認待ち

---

## 調査結果

### **現在の実装**

**担当者データ**: ハードコード（固定値）

**使用例**:
```typescript
// useAccountingSystem.ts のモックデータ
staffName: "佐藤 健太"
staffName: "山田 花子"
staffName: "鈴木 太郎"
staffName: "高天原"
```

**UIでの使用**:
- `ClientModal.vue`: テキスト入力（自由入力）
- `ScreenA_ClientList.vue`: 表示のみ

---

## 選択肢

### **選択肢1：現状維持（テキスト自由入力）**

```vue
<input type="text" v-model="form.staffName" placeholder="担当者名">
```

**メリット**：
- ✅ 実装済み
- ✅ シンプル
- ✅ 柔軟（新担当者をすぐ追加可能）

**デメリット**：
- ❌ typoの可能性
- ❌ 表記ゆれ（「佐藤健太」「佐藤 健太」）
- ❌ 統計・集計が困難

---

### **選択肢2：ドロップダウン + 新規追加（推奨）**

```vue
<select v-model="form.staffName">
  <option value="">未割当</option>
  <option value="佐藤 健太">佐藤 健太</option>
  <option value="山田 花子">山田 花子</option>
  <option value="鈴木 太郎">鈴木 太郎</option>
</select>
<button @click="openStaffModal">+ 新規追加</button>
```

**担当者マスタ（Firestore）**:
```typescript
// Collection: staffs
{
  id: string;        // 自動採番
  name: string;      // 佐藤 健太
  email?: string;    // sato@example.com
  isActive: boolean; // true
  createdAt: Timestamp;
}
```

**メリット**：
- ✅ typo防止
- ✅ 表記統一
- ✅ 集計可能（担当者別レポート等）
- ✅ 将来的に担当者詳細（メール、権限等）追加可能

**デメリット**：
- ⚠️ 実装が必要（staffsコレクション、CRUD）

---

### **選択肢3：固定リスト（ただしFirestore不使用）**

```typescript
// constants.ts
export const STAFF_LIST = [
  '佐藤 健太',
  '山田 花子',
  '鈴木 太郎',
] as const;
```

**メリット**：
- ✅ 実装が簡単
- ✅ typo防止

**デメリット**：
- ❌ 新担当者追加時にコード修正必要
- ❌ デプロイ必要

---

## 推奨：選択肢2（ドロップダウン + Firestoreマスタ）

**理由**：
1. 型安全（既存の担当者のみ選択可能）
2. 拡張性（将来的に担当者詳細追加可能）
3. ADR-001に準拠（Zodスキーマで型定義）

**実装方針**：

### **1. Staffスキーマ追加**

```typescript
// src/types/zod_schema.ts
export const StaffSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema,
});

export type Staff = z.infer<typeof StaffSchema>;
```

### **2. Firestoreコレクション**

```
/staffs/{staffId}
```

### **3. UIコンポーネント**

```vue
<!-- ドロップダウン -->
<select v-model="form.staffName">
  <option v-for="staff in activeStaffs" :key="staff.id" :value="staff.name">
    {{ staff.name }}
  </option>
</select>

<!-- 担当者管理モーダル（既存） -->
<Z_StaffModal v-if="showStaffModal" @save="createStaff" @close="showStaffModal = false" />
```

---

## 質問

**どの選択肢で進めますか？**

1. **選択肢1**：現状維持（自由入力）
2. **選択肢2**：ドロップダウン + Firestoreマスタ（推奨）
3. **選択肢3**：固定リスト（コード内定義）

---

**補足**：
- 選択肢2の場合、staffsコレクションのCRUDは後で実装可能
- まずScreen Aフォームでドロップダウンのみ実装し、担当者追加機能は後回しでもOK

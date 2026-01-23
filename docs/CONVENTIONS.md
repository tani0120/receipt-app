# 型安全性規約（AI必読）

**作成日**: 2026-01-24  
**対象**: すべての開発者・AI（Cursor, Copilot等）  
**ステータス**: Mandatory

---

## ❌ 禁止パターン

### 1. Partial + フォールバック値

```typescript
// ❌ 禁止：型契約を骨抜きにする
const client: Partial<Client> = data;
const name = client.name || 'Unknown';  // サイレント障害の温床
```

**理由**: 必須フィールドが欠落したまま処理が進み、決算直前に発覚する。

**正しい書き方**:
```typescript
// ✅ 正しい：Pick で必要なフィールドのみ抽出
const client: Pick<Client, 'id' | 'name'> = data;
if (!client.name) {
  throw new Error('Client name is required');
}
```

---

### 2. any型

```typescript
// ❌ 禁止：型システムの完全放棄
function process(data: any) {
  return data.someField;  // 型チェックなし
}
```

**理由**: TypeScriptの型安全性が完全に無効化される。

**正しい書き方**:
```typescript
// ✅ 正しい：unknown + 型ガード
function process(data: unknown) {
  if (isValidData(data)) {
    return data.someField;  // 型安全
  }
  throw new Error('Invalid data');
}

function isValidData(data: unknown): data is { someField: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'someField' in data &&
    typeof (data as any).someField === 'string'
  );
}
```

---

### 3. status フィールドの無視

```typescript
// ❌ 禁止：監査証跡の破壊
type Client = {
  id: string;
  name: string;
  // status がない → どの段階のデータか不明
};
```

**理由**: 業務状態の追跡と監査が不可能になる。

**正しい書き方**:
```typescript
// ✅ 正しい：status を必須化
type Client = {
  id: string;
  status: 'Draft' | 'Submitted' | 'Approved';
  name: string;
};
```

---

##  ✅ 正しいパターン

### 1. Pick/Omit による明示的な型定義

```typescript
// ✅ 必要なフィールドのみ抽出
type ClientSummary = Pick<Client, 'id' | 'name'>;

// ✅ 不要なフィールドを除外
type ClientWithoutMetadata = Omit<Client, 'createdAt' | 'updatedAt'>;
```

---

### 2. unknown + 型ガード

```typescript
// ✅ 外部データを安全に扱う
function processExternalData(data: unknown): JournalEntry {
  if (!isJournalEntry(data)) {
    throw new Error('Invalid journal entry');
  }
  
  // ここは型安全
  return data;
}

function isJournalEntry(data: unknown): data is JournalEntry {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'status' in data &&
    'lines' in data
  );
}
```

---

### 3. 許可される any（証跡コメント必須）

```typescript
// ✅ 外部ライブラリ由来のany（証跡コメント必須）
// @type-audit: external-library (MF Cloud API v2.1)
// @approved-by: architect
// @reason: Vendor SDKの型定義が不完全
type VendorResponse = any;
```

---

### 4. Phase 2未実装機能

```typescript
// ✅ Phase 2未実装関数（証跡コメント必須）
export class TaxCodeMapper {
  
  static toMF(code: string): string {
    // Phase 1実装
    return mapping[code];
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // @type-audit: phase2-scheduled (2026-Q2)
  // @approved-by: architect
  static toFreee(code: string): string {
    throw new Error('Phase 2 implementation');
  }
}
```

---

## 層別型安全性ポリシー

| 層 | Partial | any | unknown | 理由 |
|---|---|---|---|---|
| **src/domain/** | ❌ 禁止 | ❌ 禁止 | ✅ 許可 | 業務ロジックの中核 |
| **src/features/** | ❌ 禁止 | ❌ 禁止 | ✅ 許可 | L1-L3実装層 |
| **src/api/** | ⚠️ 警告 | ⚠️ 警告 | ✅ 許可 | 外部境界 |
| **src/types/** | ❌ 禁止 | ❌ 禁止 | ✅ 許可 | 型定義 |

---

## CI/CDによる自動検知

すべてのコミットで以下がチェックされます：

1. **TypeScript型チェック** (`tsc --noEmit`)
2. **ASTベースPartial検知** (ts-morph)
3. **Domain層厳格チェック** (grep + AST)
4. **証跡コメント確認** (@type-audit)

**違反した場合、CIが自動的にマージを拒否します。**

---

## AI向けガイダンス

### Cursor / Copilot を使う場合

1. **型エラーは無視しない**
   - IDEが赤線を表示したら、必ず修正する
   - `@ts-ignore` や `@ts-expect-error` は禁止

2. **any を使いたくなったら**
   - まず `unknown` を検討
   - 型ガードを書く
   - どうしても必要なら `@type-audit` コメントを追加

3. **Partial を使いたくなったら**
   - `Pick<T, 'field1' | 'field2'>` を使う
   - `Omit<T, 'field1'>` を使う
   - どうしても必要ならDTD層のみ

---

## よくある質問

### Q: 外部APIのレスポンスが不定な場合は？
A: `unknown` + Zodスキーマで検証

```typescript
const response: unknown = await fetch(url).then(r => r.json());
const validated = MySchema.parse(response);  // Zodで検証
```

### Q: Phase 2未実装の関数は？
A: `throw new Error()` + `@type-audit` コメント

### Q: 第三者ライブラリがany を返す場合は？
A: `@type-audit: external-library` コメントを追加

---

**このドキュメントは、AIを含むすべての開発者が絶対に守らなければならない規約です。**

**違反した場合、CIが自動的にマージを拒否します。**

# 期待層深層解析 (Rich Seed Audit)

**執行日時:** 2026-01-12
**考古学者:** Antigravity Agent
**対象:** `src/utils/seedRichJobs.ts`

本ドキュメントは、Seedデータ（初期投入データ）にのみ存在し、公式スキーマ（Zod）や仕様書から逸脱している「隠しプロパティ（Buried Keys）」を物理的に記録したものである。

---

## 1. 検出された「埋蔵キー」 (Buried Keys)

`seedRichJobs.ts` 内で定義されているが、`zod_schema.ts` の `JobSchema` や `JournalLineSchema` には明示されていない可能性が高いプロパティ。

### 1-1. `Job` オブジェクト内の埋蔵キー
*   **`detectedBank`** (Line 125)
    *   値: `'Mitsubishi_UFJ'`
    *   型: `string`
    *   文脈: 自動検知された銀行名を保持していると思われるが、公式スキーマには存在しない。
*   **`remandReason`** (Line 98)
    *   値: `'領収書が添付されていません...'`
    *   型: `string`
    *   文脈: 以前の `legacy` フィールドの生き残りか、あるいは `reviews` 配列に格納されるべきもの。

### 1-2. `JournalLine` (明細) 内の埋蔵キー
*   **`isAutoMaster`** (Line 135)
    *   値: `true`
    *   型: `boolean`
    *   文脈: 自動生成された仕訳であることを示すフラグ。非常に重要だが、Zod 定義 (`search src/types/zod_schema.ts`) には存在しない可能性が高い。
*   **`subAccount`** / **`accountItem`** (Line 20-21)
    *   値: `'Amazon'`, `'消耗品費'`
    *   文脈: これらは通常 `drSub`, `drAccount` 等にマッピングされるが、Seed データではフラットに記述されている。

### 1-3. `Client` (顧客) 内の埋蔵キー (Update Operation)
*   **`expectedMaterials`** (Line 148)
    *   値: `['領収書', '通帳コピー', '請求書', '給与台帳(未受領)']`
    *   型: `string[]`
    *   文脈: Screen C (資料回収) で使用される重要なプロパティだが、`ClientSchema` には定義されていない（`folders` プロパティ等は存在するが）。

---

## 2. 期待される完全形状 (The Ideal Shape)

Seed データから逆算される、本来あるべき「リッチ」なデータ構造（未来の Zod テンプレート）。

```typescript
interface RichJob extends Job {
  // 自動検知ロジック用
  detectedBank?: string; // 公式化すべき

  // 差戻しロジック用
  remandReason?: string; // 構造化すべき (e.g. reviews[].comment)

  lines: Array<{
    // 自動仕訳生成フラグ
    isAutoMaster?: boolean; // 公式化すべき
  } & JournalLine>;
}

interface RichClient extends Client {
  // 資料回収予定リスト
  expectedMaterials?: string[]; // Screen C のために公式化必須
}
```

## 3. 不在確認 (Absence Verification)

当初の予測にあった以下の経営管理系キーは、**Seed データ内にも存在しなかった**。

*   `metrics`: ❌ (0 hits)
*   `costs`: ❌ (0 hits)
*   `allocations`: ❌ (0 hits)
*   `unitPrice`: ❌ (0 hits)

**結論:**
Seed データは「機能（Function）」を補完するための隠しプロパティ（`isAutoMaster` 等）を持っているが、「経営（Management）」に関するデータ（コスト、単価）はここでも完全に欠落している。
これは、開発者が「動く機能」を作ることに集中し、「儲かる仕組み（原価管理）」を考慮していなかったことの物理的証拠である。

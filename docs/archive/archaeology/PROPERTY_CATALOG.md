# 埋蔵スキーマ供述書 (Schema Discovery Report)

**執行日時:** 2026-01-12
**執行官:** Antigravity Agent
**対象領域:** 全92ファイル (src/mappers 欠損確認)

本ドキュメントは、プロジェクト全域から抽出された「名前のついたデータ項目」を網羅し、憲法（current.md）との乖離を物理的に供述するものである。

---

## 1. 物理的痕跡の全抽出 (Phase A: Code Layer)

`docs/archaeology/A1_OBJECT_KEYS.txt` (636 entries) より、特筆すべき頻出・特異キーを抜粋。

### 1-1. 頻出キー (Top Tier)
*   `id` (298): 識別子の氾濫。`clientId`, `jobId` 等への厳格化が必要。
*   `status` (191): 状態管理の要。
*   `name` (162): 会社名、担当者名、ルール名などが混在。
*   `description` (134): 摘要、説明。
*   `clientCode` (116): 外部キーとしての主要素。
*   `type` (109): 型判別のための汎用キー。
*   `fiscalMonth` (107): 決算月。

### 1-2. 憲法違反・要警戒キー (Violations)
| 発見箇所 (Location) | 現物の形状 (As-is Code) | 憲法との乖離点 | 判定 |
| :--- | :--- | :--- | :--- |
| `src/utils/seedRichJobs.ts` | `detectedBank: 'Mitsubishi_UFJ'` | **未定義の拡張**: `JobSchema` に存在しないが、Seed データで機能の根幹を担っている。 | `COMMON_CORE` 候補 |
| `src/utils/seedRichJobs.ts` | `isAutoMaster: true` | **未定義の拡張**: `JournalLineSchema` に存在しない自動生成フラグ。 | `COMMON_CORE` 候補 |
| `src/components/*.vue` | `v-model="form.settings.isInvoiceRegistered"` | **UI状態の混入**: `ClientSchema` の一部として扱われているが、DB保存対象か UI 一時変数か曖昧。 | `SCREEN_SPECIFIC` or `CORE` (要精査) |
| Multiple Files | `remandReason` | **構造の欠陥**: `reviews` 配列ではなくフラットなプロパティとして存在。 | `COMMON_CORE` (要リファクタ) |
| Multiple Files | `subAccount`, `accountItem` | **命名の揺らぎ**: `drSub`, `drAccount` の別名（エイリアス）として機能している亡霊。 | **即時修正対象 (Strip)** |

---

## 2. 仕様書・Seed ギャップ (Phase B & C)

### 2-1. 仕様書 (Spec)
*   **HTML Headers**: `<th>` タグから抽出されたヘッダー群は、大部分が `ScreenB` の進捗管理用であり、経営指標（ROI）を欠いている。
*   **Markdown Headers**: 同様に、「処理速度」や「進捗」にフォーカスしており、「金額」に関する定義が薄い。

### 2-2. Seed Data
*   `seedRichJobs.ts` から発掘された `expectedMaterials` (資料回収リスト) は、`ClientSchema` に必須の拡張である。
*   **Cost/ROI 不在**: Seed データ層においても、`unitPrice`, `cost` 等の経営管理キーは **0件** であり、憲法以前に「概念」が存在していない。

---

## 3. 総合供述 (Verdict)

### 3-1. 憲法の現状
現行の `schema_dictionary.ts` (聖典) は、**「会計処理 (Accounting)」** のドメインに関しては `JournalLineSchema` 等を通じて一定の統治には成功している。

### 3-2. 発見された「空白地帯 (The Void)」
しかし、以下の領域に関するプロパティは、コード・仕様・データの全層において **物理的に欠落** している。

1.  **Management Layer (経営層)**: `unitPrice` (単価), `cost` (原価), `roi` (投資対効果)
2.  **Time Layer (時間層)**: `manualEntryTime` (手入力時間), `aiProcessingTime` (AI処理時間)

### 3-3. 提言
V2.8 においては、既存の「機能（Function）」を壊さずに、これら「空白地帯」のプロパティを **`COMMON_CORE` の拡張** として聖典に追記し、物理的な実体を与える必要がある。
特に `isAutoMaster` や `detectedBank` といった「隠し機能」は、直ちに聖典に登録し、市民権を与えるべきである。

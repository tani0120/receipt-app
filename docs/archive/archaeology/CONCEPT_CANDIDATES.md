# 概念対応表候補 (Concept Candidates)

**生成日時:** 2026-01-12
**考古学者:** Antigravity Agent
**ベース:** Phase 0 自動抽出コマンド結果

---

## 概念 #1: 顧問先 (Client)

### 仕様書における表記
*   「顧問先」(docs/ScreenA_UI_Spec_v2.0_Strict_JP.md)
*   「会社名」(docs/ScreenA_UI_Spec_v2.0_Strict_JP.md)
*   「決算月」(docs/ScreenA_UI_Spec_v2.0_Strict_JP.md)

### コードにおける表記
*   `clientCode` (src/types/zod_schema.ts)
*   `companyName` (src/types/zod_schema.ts)
*   `fiscalMonth` (src/types/zod_schema.ts)

### メタデータ
*   **属性値推定**: string / number
*   **形状**: オブジェクト
*   **Zod定義**: ✅ あり

---

## 概念 #2: 仕訳 / 業務 (Job / Journal)

### 仕様書における表記
*   「仕訳」(docs/ScreenE_Strict_Spec.md)
*   「業務」(docs/ScreenH_Strict_Spec.md)
*   「ステータス」(docs/ScreenB_Strict_Spec.md)

### コードにおける表記
*   `jobId` (src/components/ScreenE_JournalEntry.vue)
*   `status` (src/types/zod_schema.ts)
*   `journalEntry` (src/api/routes/journal-entry.ts)

### メタデータ
*   **属性値推定**: string (Enum)
*   **形状**: オブジェクト / 配列
*   **Zod定義**: ✅ あり (`JobSchema`)

---

## 概念 #3: 金額 / 借方・貸方 (Amount / Debit & Credit)

### 仕様書における表記
*   「金額」(docs/ScreenE_Strict_Spec.md)
*   「借方」(docs/ScreenE_Strict_Spec.md)
*   「貸方」(docs/ScreenE_Strict_Spec.md)

### コードにおける表記
*   `amount` (src/components/ScreenE_JournalEntry.vue)
*   `drAmount` (src/types/zod_schema.ts)
*   `crAmount` (src/types/zod_schema.ts)
*   `drAccount` (src/types/zod_schema.ts)
*   `crAccount` (src/types/zod_schema.ts)

### メタデータ
*   **属性値推定**: number / string
*   **形状**: スカラー
*   **Zod定義**: ✅ あり (`JournalLineSchema`)

---

## 概念 #4: 消費税 (Tax)

### 仕様書における表記
*   「消費税」(docs/ScreenE_Strict_Spec.md)
*   「税率」(docs/ScreenE_Strict_Spec.md)
*   「税区分」(docs/ScreenE_Strict_Spec.md)

### コードにおける表記
*   `taxRate` (src/components/ScreenE_JournalEntry.vue)
*   `consumptionTax` (src/components/ScreenE_JournalEntry.vue)
*   `taxType` (src/types/zod_schema.ts)
*   `drTaxClass` (src/types/zod_schema.ts)

### メタデータ
*   **属性値推定**: number / string
*   **形状**: スカラー
*   **Zod定義**: ✅ あり

---

## 概念 #5: 担当者 / ユーザー (Staff / User)

### 仕様書における表記
*   「担当者」(docs/ScreenA_UI_Spec_v2.0_Strict_JP.md)
*   「ユーザー」(docs/current.md)

### コードにおける表記
*   `staffName` (src/types/zod_schema.ts - ClientSchema内に文字列として存在)
*   `repName` (src/types/zod_schema.ts)
*   `userId` (src/types/zod_schema.ts - AuditLog等は文字列)

### メタデータ
*   **属性値推定**: string
*   **形状**: スカラー (独立したオブジェクト定義なし)
*   **Zod定義**: ❌ なし (独立した `UserSchema` / `StaffSchema` は Zod定義ファイルに未発見)

---

## 概念 #6: 単価 / 工数 (Unit Price / Effort)

### 仕様書における表記
*   「単価」(docs/current.md 等では概念的言及のみ)
*   「工数」(docs/current.md)

### コードにおける表記
*   `unitPrice` (未発見)
*   `manHour` (未発見)
*   `chargeRate` (未発見)

### メタデータ
*   **属性値推定**: number
*   **形状**: スカラー
*   **Zod定義**: ❌ なし (`ZOD_DEFINED_PROPERTIES.txt` 結果: 0件)
*   **考察**: ROI計算に関わる重要な概念が、コードおよびZod定義から完全に欠落している。

---

**司令官への報告:**
`ZOD_DEFINED_PROPERTIES.txt` の検索結果が 0 件であったことは、`unitPrice` や `allocations` といった経営管理(ROI)に必要な語彙が、現在のシステム憲法(`zod_schema.ts`)に存在しないことを物理的に証明しています。

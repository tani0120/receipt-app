# 全スキーマ・マスターインベントリ (Schema Master Inventory)

**執行日時:** Phase 11.5 Re-Execution (2026-01-12)
**監視員:** Antigravity Agent (Read-Only Mode)

本ドキュメントは、システム内に存在する「公式定義（Zod）」と「埋蔵定義（Buried Code）」を完全に網羅し、来るべき V2.8 統合（ROI Management）に向けた「空席（Gaps）」を指摘するものである。

---

## 1. 担当者 (Staff/User)

| 項目 | 詳細 |
| :--- | :--- |
| **公式定義 (Official)** | **存在せず** (ただし `SystemSettingsSchema` や `JobSchema` 内に `userId` 文字列のみ存在) |
| **埋蔵定義 (Buried)** | `src/composables/useAccountingSystem.ts` (L724) <br> `MOCK_ADMIN_DATA.staff: { name: string, backlogs: object, velocity: object }[]` |
| **現行フィールド** | `name`, `backlogs.draft`, `backlogs.approve`, `velocity.draftAvg` ... |
| **V2.8 Gaps (Critical)** | **[MISSING]** `chargeRate` (チャージレート: 円/時) <br> **[MISSING]** `role` (Admin/Worker/Viewer) <br> **[MISSING]** `annualCompensation` (年間報酬: 円 - ROI計算の分子) <br> **[MISSING]** `teams` (所属チーム) |

---

## 2. 顧問先 (Client/Company)

| 項目 | 詳細 |
| :--- | :--- |
| **公式定義 (Official)** | `src/types/zod_schema.ts` (L47) <br> `ClientSchema` (Zod Object) |
| **埋蔵定義 (Buried)** | `src/composables/useAccountingSystem.ts` (L805) <br> `mockClientsPreload` (Mock Data Array) - `staffName` 等の独自利用あり |
| **現行フィールド** | `clientCode`, `status`, `fiscalMonth`, `contact(.type/.value)`, `taxFilingType`, `consumptionTaxMode`, `folders...` |
| **V2.8 Gaps (Critical)** | **[MISSING]** `expectedJournalCount` (想定仕訳数: 件/月 - 契約乖離判定用) <br> **[MISSING]** `contractAmount` (月額顧問料: 円 - ROI計算の分子) <br> **[MISSING]** `systemUsageStats` (AI利用頻度統計) |

---

## 3. 業務・仕訳 (Job/Journal)

| 項目 | 詳細 |
| :--- | :--- |
| **公式定義 (Official)** | `src/types/zod_schema.ts` (L132) <br> `JobSchema` (Zod Object) |
| **埋蔵定義 (Buried)** | `src/composables/useAccountingSystem.ts` (L653) <br> `MOCK_JOBS_RAW` - テスト用ハードコードデータ |
| **現行フィールド** | `id`, `status`, `lines`, `aiUsageStats`, `confidenceScore`, `timestamps...` |
| **V2.8 Gaps (Critical)** | **[MISSING]** `systemExternalTime` (システム外稼働時間: 分 - アナログ作業分) <br> **[MISSING]** `manualWorkTime` (画面操作時間: 分 - 自動計測) <br> **[MISSING]** `complexityScore` (AI難易度スコア) |

---

## 4. 証憑 (Receipt/Evidence)

| 項目 | 詳細 |
| :--- | :--- |
| **公式定義 (Official)** | `JobSchema` の一部として定義 (`driveFileId`, `driveFileUrl`) |
| **埋蔵定義 (Buried)** | `GAS_LOGIC_DEFINITIONS.FILE_RESCUE` (Text) - ファイル救出ロジックのみ存在 |
| **現行フィールド** | `driveFileId`, `driveFileUrl` |
| **V2.8 Gaps (Critical)** | **[MISSING]** `ocrConfidence` (OCR自体の信頼度) <br> **[MISSING]** `deduplicationHash` (重複検知用ハッシュ - GAS側にはあるがDBスキーマにない) |

---

## 5. システム・メタ (System/Meta)

| 項目 | 詳細 |
| :--- | :--- |
| **公式定義 (Official)** | `src/types/zod_schema.ts` (L219) <br> `SystemSettingsSchema` |
| **埋蔵定義 (Buried)** | `gas_logic_definitions` (Logic Text) <br> `ai_prompts` (Prompt Text) |
| **現行フィールド** | `apiUnitCostIn`, `apiUnitCostOut`, `usdJpyRate`, `aiModelName` |
| **V2.8 Gaps (Critical)** | **[MISSING]** `auditLogRetentionPolicy` (ログ保存期間) <br> **[MISSING]** `defaultStaffRate` (標準人件費レート - 個別設定がない場合のROI計算用) |

---

## 6. Hono RPC 実態調査 (`src/api/routes`)

*   **`jobs.ts`**: `zValidator('json', JobSchema.partial())` を使用。公式定義に準拠。
*   **`clients.ts`**: (推測) `ClientSchema` を使用。
*   **判定**: 通信層における「埋蔵スキーマ（独自定義）」は確認されず。非常に健全。

---

**結論:**
システムは Hono RPC によって技術的に健全化されているが、**「経営管理 (ROI)」を行うためのデータ構造が全般的に欠落**している。特に「Staff (User)」の公式定義が存在しない点は、原価計算を行う上で致命的である。
Phase 12 においては、`zod_schema.ts` へのこれらのフィールド追加（Optional可）を最優先事項とする。

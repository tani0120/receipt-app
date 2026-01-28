# 現実層深層考古学監査 (Reality Layer Audit)

**執行日時:** 2026-01-12
**考古学者:** Antigravity Agent
**ベース:** Phase 1 自動抽出コマンド結果

本ドキュメントは、仕様書（理想）ではなく、実際に稼働しているコード（現実）が「どのデータ項目を」「どのように扱っているか」を物理的に記録したものである。

---

## 1. Vue `v-model` 実装実態 (Frontend Binding)

`docs/archaeology/PHASE_1_1_VUE_VMODEL.csv` より集計。ユーザーが直接操作可能なデータの全容である。

### 1-1. 顧問先 (Client) 関連 [ClientModal.vue / ScreenA_Detail_*.vue]
*   `form.name` (会社名)
*   `form.rep` (代表者名)
*   `form.staffName` (担当スタッフ)
*   `form.contact.type` / `value` (連絡先)
*   `form.fiscalMonth` (決算月)
*   `form.settings.software` (会計ソフト)
*   `form.settings.taxType` (税区分: 税込/税抜)
*   `form.settings.consumptionTax` (消費税設定)
*   `form.settings.isInvoiceRegistered` (インボイス登録)
*   **[Gap]**: ここに `contractAmount` (顧問料) や `expectedJournalCount` (想定仕訳数) の入力欄は物理的に存在しない。

### 1-2. 仕訳 (Journal) 関連 [ScreenE_JournalEntry.vue]
*   `transactionDateStr` (取引日)
*   `row.drAccount` / `crAccount` (借方/貸方科目)
*   `row.drSub` / `crSub` (補助科目)
*   `row.amount` (金額)
*   `row.drTaxClass` / `crTaxClass` (税区分)
*   `selectedJobSummary` (業務サマリ)
*   **[Observation]**: 複合仕訳等の複雑なUI入力 (`v-model`) が実装されているが、`unitPrice` (単価) や `quantity` (数量) の入力欄は存在しない。

### 1-3. その他
*   `c_config.cash` / `payroll` (ScreenC: 回収ステータス設定)
*   `localRule` (RuleDetailModal: AI学習ルール編集)

---

## 2. Service/Mapper 更新実態 (Backend Operation)

`docs/archaeology/PHASE_1_2_SERVICE_UPDATE.csv` より集計。サーバーサイドで実際に永続化されるデータ操作である。

### 2-1. Firestore 更新 (`update` / `set`)
*   `ConfigService.ts`: `settings` を `SCHEDULER_DOC_ID` にマージ保存。
*   `ConversionService.ts`: `initialLog` を保存。
*   **[Critical]**: `ClientService` や `JobService` における明示的な `update({...})` が抽出結果に見当たらない。多くは `GeneralLedgerService` 等の特化サービス経由か、あるいは `mapper` で変換されたオブジェクトを保存している可能性があるが、`PHASE_1_2` の結果としては「単純な update」は少ない。

### 2-2. 戻り値オブジェクト (`return { ... }`)
*   `WorkerService.ts`: `{ count: 0 }`, `{ jobId, status }` - ジョブ制御の結果。
*   `JournalService.ts`: `{ success, message, balanceDiff }` - 仕訳保存時の整合性チェック結果。
*   `Mapper`: 各種マッパーが DTO を変換して返却している。

---

## 3. 計算ロジックの入力前提 (Input Assumptions)

`docs/archaeology/PHASE_1_3_CALC_LOGIC.csv` より集計。ロジックが「存在すると信じている」プロパティ群。

### 3-1. 検出ロジック (`DetectionLogic.ts`)
*   `item.transactionDate`: 日付計算に使用。
*   `item.description`: キーワード検索 (`includes`)、ベンダー特定に使用。
*   `historyBalances`: 残高突合に使用。
*   **[Gap]**: `complexity` や `ai_difficulty` を計算するロジックは見当たらない。

### 3-2. 総勘定元帳 (`GeneralLedgerService.ts`)
*   Excel/CSV入力 (`row['日付']`, `row['借方金額']`, `row['借方補助科目']`) に依存。
*   `balanceMap`: `{ [month: number]: number }` 形式で月次残高を集計。
*   **[Observation]**: 完全に「金額 (Amount)」ベースの集計であり、時間 (Time) や労力 (Effort) を集計するロジックは存在しない。

### 3-3. ジャーナル編集 (`useJournalEditor.ts`)
*   `JournalEntry` 型に依存。
*   `validation`: 貸借一致 (`balanceDiff`) を計算。
*   **[Gap]**: ここでも「入力にかかった時間」を計測・保存するロジック (`manualEntryTime`) は存在しない。

---

## 4. 統計 (Statistics)

*   **確認されたプロパティ総数 (Approx)**: 50+ (Vue v-model + Service Logic)
*   **Zod 定義済み**: 大部分は `JobSchema`, `ClientSchema` に準拠。
*   **未定義 (Undefined/Gap)**:
    *   経営管理に必要な **Time (時間)**, **Cost (原価)**, **ROI (投資対効果)** 関連のプロパティは、UI (Vue)、DB操作 (Service)、計算 (Logic) の**全レイヤーにおいて物理的に不在**である。
    *   「単価 (Unit Price)」や「工数 (Man Hour)」もコード上に存在しない。

**結論:**
現実層（Reality Layer）は、**「会計処理（Accounting）」に過剰適応**しており、「経営管理（Management）」を行う能力を完全に欠落させている。V2.8 でこれらを実装するには、UIへの入力欄追加、DBスキーマの拡張、そしてロジックへの計算式導入という、全レイヤーに渡る外科手術が必要である。

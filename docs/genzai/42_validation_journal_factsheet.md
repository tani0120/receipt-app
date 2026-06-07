# バリデーション・仕訳一覧 — 統合ファクトシート

> 調査日: 2026-05-30（最終更新: 2026-05-30 23:25）
> 対象: `c:\dev\receipt-app`

---

## 1. バリデーション3系統の実態 — ✅ SSOT統合完了

### 1-1. 統合後の構成

| # | ファイル | 行数 | 役割 |
|---|---------|------|------|
| **SSOT** | [journalValidationCore.ts](file:///c:/dev/receipt-app/src/shared/validation/journalValidationCore.ts) | 632行 | **全13種チェック + セルハイライト情報の統合ロジック** |
| **A** | [journalValidation.ts](file:///c:/dev/receipt-app/src/api/services/journalValidation.ts) (API側) | ~90行 | sharedの薄いラッパー（非破壊コピー + Set→配列変換） |
| **B** | [journalWarningSync.ts](file:///c:/dev/receipt-app/src/utils/journalWarningSync.ts) (フロント共通) | ~24行 | sharedへのre-export（後方互換） |
| **C** | [JournalListLevel3Mock.vue syncWarningLabels L3164](file:///c:/dev/receipt-app/src/components/JournalListLevel3Mock.vue#L3164) (Vue内) | ~60行 | sharedの`syncWarningLabelsCore`呼出 + UI固有制御 + `ValidationContext`渡し |

### 1-2. 統合後の依存関係

```
C（仕訳一覧内 syncWarningLabels L3164）
  └── syncWarningLabelsCore() ← shared/validation/journalValidationCore.ts（SSOT）✅
      ├── context: { fiscalMonth } ← activeClientFull.value.fiscalMonth
      └── result.categoryConflicts / voucherTypeConflicts / sameAccountBothSides → Map更新（UI固有）
      └── result.addedLabels / removedLabels → モーダル表示（UI固有）

B（フロント共通utility）
  └── re-export → shared/validation/journalValidationCore.ts（SSOT）✅

A（API側）
  └── syncWarningLabelsCore() ← shared/validation/journalValidationCore.ts（SSOT）✅
      └── 非破壊ラッパー（labelsコピー後に呼出）
```

### 1-3. A/B/C 差異一覧 — ✅ 全統一済み

| # | チェック | SSOT | A (API) | B (re-export) | C (Vue) |
|---|---------|:---:|:---:|:---:|:---:|
| 1 | 科目不明 `ACCOUNT_UNKNOWN` | ✅ | ✅ | ✅ | ✅ |
| 2 | 税区分不明 `TAX_UNKNOWN` | ✅ | ✅ | ✅ | ✅ |
| 3 | 摘要不明 `DESCRIPTION_UNKNOWN` | ✅ | ✅ | ✅ | ✅ |
| 4 | 日付不明 `DATE_UNKNOWN` | ✅ | ✅ | ✅ | ✅ |
| 5 | 金額不明 `AMOUNT_UNCLEAR` | ✅ | ✅ | ✅ | ✅ |
| 6 | 貸借不一致 `DEBIT_CREDIT_MISMATCH` | ✅ | ✅ | ✅ | ✅ |
| 7 | 貸借科目矛盾 `CATEGORY_CONFLICT` | ✅ | ✅ | ✅ | ✅ |
| 7b | 同一科目借貸 `SAME_ACCOUNT_BOTH_SIDES` | ✅ | ✅ | ✅ | ✅ |
| 8 | 証票意味矛盾 `VOUCHER_TYPE_CONFLICT` | ✅ | ✅ | ✅ | ✅ |
| 9 | 科目×税区分不整合 `TAX_ACCOUNT_MISMATCH` | ✅ | ✅ | ✅ | ✅ |
| 10 | 未来日付 `FUTURE_DATE` | ✅ | ✅ | ✅ | ✅ |
| 11 | 期外日付 `DATE_OUT_OF_RANGE` | ✅ | ✅ | ✅ | ✅ |
| 12 | 役員貸付金 `DIRECTOR_LOAN` | ✅ | ✅ | ✅ | ✅ |
| 13 | 少額適格 `AUTO_INVOICE_SMALL` | ✅ | ✅ | ✅ | ✅ |
| — | セルハイライト（`SyncWarningResult`） | ✅ | ✅ | ✅ | ✅ |
| — | モーダル表示 | — | — | — | ✅ (C固有) |
| — | `warning_dismissals`対応 | ✅ | ✅ | ✅ | ✅ |
| — | `warning_details`詳細メッセージ | ✅ | ✅ | ✅ | ✅ |
| — | `ValidationContext`（fiscalMonth等） | ✅ | — | — | ✅ (context渡し) |

> [!NOTE]
> 全チェックがSSOT（`journalValidationCore.ts`）に統合済み。
> A/B/Cの差異は**ゼロ**。B→sharedのre-export。C→shared呼出+UI制御のみ。
> A側は現時点でcontextを渡していない（#11-#13はcontextがない場合スキップされる設計）。

### 1-4. syncWarningLabelsCore シグネチャ

```typescript
export function syncWarningLabelsCore(
  journal: JournalForValidation,
  accounts: AccountForValidation[],
  taxCategories: TaxCategoryForValidation[],
  voucherRules: Record<string, VoucherTypeRule> = {},
  context?: ValidationContext  // ← 2026-05-30追加
): SyncWarningResult
```

`ValidationContext`（オプショナル）:
```typescript
export interface ValidationContext {
  fiscalMonth?: number              // 決算月（1-12）。個人=12。
  directorLoanAccountIds?: string[] // 役員貸付金科目IDリスト（デフォルト: ['OFFICER_LOANS']）
}
```

### 1-5. 統合前の旧構成（参考）

<details>
<summary>クリックで展開: 統合前の問題点</summary>

- CがBの`syncWarningLabelsCore`を**使わずに独自で再実装**していた
- `getMegaGroup`, `validateDebitCreditCombination`, `isContraAccount` が3箇所で重複
- Bには`warning_dismissals`（確認済みスキップ）と`warning_details`（詳細メッセージ）があったが、Cにはなかった
- FUTURE_DATE (#10) がBに未実装だった
- 合計 ~1,034行 → 統合後 ~484行（**-550行**）

</details>

---

## 2. 13種チェックのフィールド依存

### 2-1. 科目フィールド依存

| フィールド | 依存チェック | UI表示状況 |
|-----------|-----------|:---:|
| `id`（マスタID） | #1 科目不明, #7b 同一科目, #8 証票意味矛盾, #12 役員貸付金 | ✅ |
| `accountGroup`（大分類） | #7 貸借科目矛盾, #8 証票意味矛盾 | ✅ |
| `category`（科目分類） | #8 証票意味矛盾 | ✅ |
| `taxDetermination`（税区分判定） | #9 科目×税区分不整合 | ✅ |
| `defaultTaxCategoryId`（デフォルト税区分） | #9 固定税区分照合 | ✅ |

### 2-2. 税区分フィールド依存

| フィールド | 依存チェック |
|-----------|-----------|
| `id`（マスタID） | #2 税区分不明（存在チェック） |
| `direction`（方向） | #9 科目×税区分不整合 |

### 2-3. 顧問先コンテキスト依存

| フィールド | 依存チェック |
|-----------|-----------|
| `fiscalMonth`（決算月） | #11 期外日付（会計年度範囲判定） |
| `directorLoanAccountIds` | #12 役員貸付金（デフォルト: `OFFICER_LOANS`） |

### 2-4. 仕訳フィールド依存

| フィールド | 依存チェック |
|-----------|-----------|
| `voucher_date` | #4 日付不明, #10 未来日付, #11 期外日付, #13 少額適格（期限判定） |
| `amount` | #5 金額不明, #6 貸借不一致, #13 少額適格 |
| `invoice_status` | #13 少額適格（未設定時のみ対象） |

### 2-5. TAX_ACCOUNT_MISMATCH の判定ロジック詳細

```
entry.account の taxDetermination を参照:
  ├── 'fixed'         → defaultTaxCategoryId と厳密一致必須
  ├── 'auto_purchase'  → 税区分のdirection='sales' なら矛盾
  └── 'auto_sales'     → 税区分のdirection='purchase' なら矛盾
```

### 2-6. 新チェック判定ロジック（#11-#13）

```
#11 DATE_OUT_OF_RANGE:
  fiscalMonth(例:3) → 会計年度 4/1〜3/31
  voucher_date が当期外 → 警告

#12 DIRECTOR_LOAN:
  debit/credit に OFFICER_LOANS → 「税務リスク注意」警告

#13 AUTO_INVOICE_SMALL:
  金額 < 10,000 && invoice_status == null
  && voucher_date < INVOICE_TRANSITION_0_DATE(2029-10-01)
  → 「少額特例: インボイス不要」通知
```

---

## 3. 証票意味（voucher_type）

### 3-1. 導出チェーン

```
証票画像 → source_type（証票種別 11種）
        → direction（入出金方向）
        → voucher_type = resolveVoucherType(source_type, direction, isCreditCardPayment)
```

実装: [lineItemToJournalMock.ts L188-226](file:///c:/dev/receipt-app/src/utils/lineItemToJournalMock.ts#L188-L226)

### 3-2. マッピング表

| source_type | direction | → voucher_type |
|---|---|---|
| `receipt` | expense | `経費` |
| `receipt`(クレカ) | expense | `クレカ` |
| `credit_card` | expense | `クレカ` |
| `bank_statement` | expense | `経費` |
| `bank_statement` | income | **null**（人間判断） |
| `invoice_received` | expense | `経費` |
| `tax_payment` | expense | `経費` |
| `cash_ledger` | expense | `経費` |
| `cash_ledger` | income | **null**（人間判断） |
| `journal_voucher` | * | `振替` |

### 3-3. 証票意味ルール（VOUCHER_TYPE_RULES）

定義: [voucherTypeRules.ts](file:///c:/dev/receipt-app/src/data/master/voucherTypeRules.ts)

7種の証票意味ごとに、借方/貸方で許容される科目を定義（ホワイトリスト方式）。

```typescript
VOUCHER_TYPE_RULES = {
  '経費':     { debit: { allowedGroups: ['PL_EXPENSE'] },         credit: { allowedIds: [...] } },
  '売上':     { debit: { allowedIds: [...] },                    credit: { allowedGroups: ['PL_REVENUE'] } },
  'クレカ':    { debit: { allowedGroups: ['PL_EXPENSE'] },         credit: { allowedIds: ['ACCRUED_EXPENSES'] } },
  'クレカ引落': { debit: { allowedIds: ['ACCRUED_EXPENSES'] },       credit: { allowedIds: [...] } },
  '給与':     { debit: { allowedGroups: ['PL_EXPENSE'], ... },    credit: { allowedIds: [...] } },
  '立替経費':  { debit: { allowedGroups: ['PL_EXPENSE'] },         credit: { allowedIds: [...] } },
  '振替':     { debit: { allowedIds: [...], allowedCategories: [...] }, credit: { ... } },
}
```

---

## 4. 警告ラベルシステム

### 4-1. WARNING_LABEL_MAP — 全量

定義: [journalConstants.ts L120-192](file:///c:/dev/receipt-app/src/constants/journalConstants.ts#L120-L192)

| ラベル | レベル | UI表示 | weight | 科目依存 |
|--------|:---:|--------|:---:|:---:|
| `DEBIT_CREDIT_MISMATCH` | 🔴 | 借方貸方の合計額不一致 | 17 | — |
| `DATE_UNKNOWN` | 🔴 | 日付が不明 | 16 | — |
| `ACCOUNT_UNKNOWN` | 🔴 | 勘定科目が不明 | 15 | `id` |
| `TAX_UNKNOWN` | 🔴 | 税区分が不明 | 14.5 | — |
| `AMOUNT_UNCLEAR` | 🔴 | 金額が不明 | 14 | — |
| `DUPLICATE_CONFIRMED` | 🔴 | 完全重複（同一画像） | 13 | — |
| `MULTIPLE_VOUCHERS` | 🔴 | 複数の証票あり | 12 | — |
| `FUTURE_DATE` | 🔴 | 未来日付 | 9 | — |
| `DATE_OUT_OF_RANGE` | 🟡 | 日付が当期の範囲外 | 8 | — |
| `TAX_ACCOUNT_MISMATCH` | 🟡 | 税区分と勘定科目が矛盾 | 7.5 | `taxDetermination`, `defaultTaxCategoryId` |
| `CATEGORY_CONFLICT` | 🟡 | 借方/貸方の区分が矛盾 | 7 | `accountGroup` |
| `SAME_ACCOUNT_BOTH_SIDES` | 🟡 | 同一科目が借方/貸方の両方 | 6.7 | `id` |
| `VOUCHER_TYPE_CONFLICT` | 🟡 | 証票意味と科目が不整合 | 6.5 | `accountGroup`, `category`, `id` |
| `DUPLICATE_SUSPECT` | 🟡 | 重複疑い | 6 | — |
| `DIRECTOR_LOAN` | 🟡 | 役員貸付金（税務リスク注意） | 5 | `id` |
| `UNREADABLE_ESTIMATED` | 🟡 | 判読困難（AI推測値） | 4 | — |
| `MEMO_DETECTED` | 🟡 | 手書きメモ検出 | 3 | — |
| `DESCRIPTION_UNKNOWN` | 🟡 | 摘要が不明 | 2 | — |
| `AUTO_INVOICE_SMALL` | 🔵 | 少額特例（インボイス不要） | 1 | — |

### 4-2. JournalLabelMock — 追加ラベル

[journal_phase5_mock.type.ts L38-63](file:///c:/dev/receipt-app/src/types/journal_phase5_mock.type.ts#L38-L63) で定義。

WARNING_LABEL_MAPに含まれないラベル（Phase B/Cで除去予定）:
- `NEED_DOCUMENT`, `NEED_INFO`, `REMINDER`, `NEED_CONSULT` — `staff_notes`に移行済み（B4で廃止）
- `EXPORT_EXCLUDE` — Phase Cで`export_exclude`カラムに移行予定

> [!NOTE]
> 廃止済みラベル3種（`MISSING_FIELD`, `TAX_CALCULATION_ERROR`, `UNREADABLE_FAILED`）は
> 2026-05-30に型定義から削除済み。`field-nullable-spec.ts`で廃止宣言済み。

### 4-3. API側ソート重み（WARNING_WEIGHTS）

定義: [journalListService.ts L174-189](file:///c:/dev/receipt-app/src/api/services/journalListService.ts#L174-L189)

フロント側のWARNING_LABEL_MAP.weightとは**別定義**（API側はソート専用の整数重み）。

```typescript
const WARNING_WEIGHTS = {
  DEBIT_CREDIT_MISMATCH: 90,
  CATEGORY_CONFLICT: 80,
  SAME_ACCOUNT_BOTH_SIDES: 75,
  VOUCHER_TYPE_CONFLICT: 70,
  TAX_ACCOUNT_MISMATCH: 65,
  ACCOUNT_UNKNOWN: 60,
  TAX_UNKNOWN: 55,
  AMOUNT_UNCLEAR: 50,
  DATE_UNKNOWN: 45,
  DESCRIPTION_UNKNOWN: 40,
  DATE_OUT_OF_RANGE: 35,
  FUTURE_DATE: 30,       // ← 2026-05-30追加（バグ修正: 欠落していた）
  DIRECTOR_LOAN: 25,     // ← 2026-05-30追加
  AUTO_INVOICE_SMALL: 5, // ← 2026-05-30追加
}
```

---

## 5. ヒントモーダル（修正候補生成）

### 5-1. 実装

[journalHintService.ts](file:///c:/dev/receipt-app/src/api/services/journalHintService.ts) — API側。

### 5-2. 2つの機能

| 機能 | 関数 | 入力 | 出力 |
|------|------|------|------|
| バリデーション結果 | `generateHintValidations()` | `JournalForHint` + `AccountForHint[]` | `HintValidation[]`（error/warn + メッセージ） |
| 修正候補 | `generateHintSuggestions()` | 同上 + `TaxCategoryForHint[]` | `HintSuggestion[]`（代替科目・税区分候補） |

### 5-3. 修正候補の生成ロジック（3パターン）

| パターン | トリガー | 生成方法 |
|---------|---------|---------| 
| A: 科目修正 | `VOUCHER_TYPE_CONFLICT` or `ACCOUNT_UNKNOWN` | `VOUCHER_TYPE_RULES`のsideRuleから`buildAlternatives()`で許容科目を全列挙 |
| B: 税区分修正 | `TAX_ACCOUNT_MISMATCH` or `TAX_UNKNOWN` | `defaultTaxCategoryId`をデフォルト値として提案 |
| C: 金額修正 | `DEBIT_CREDIT_MISMATCH` | 1:N仕訳の場合、合計合わせの金額を提案 |

---

## 6. セルハイライト

### 6-1. 実装

[JournalListLevel3Mock.vue `getWarningCellClass()` L3232](file:///c:/dev/receipt-app/src/components/JournalListLevel3Mock.vue#L3232)

### 6-2. ラベル→セル対応

| ラベル | ハイライト対象セル | 色 |
|--------|----------------|-----|
| `DEBIT_CREDIT_MISMATCH` | 全金額セル | 🔴赤 |
| `AMOUNT_UNCLEAR` | nullの金額セル | 🔴赤 |
| `ACCOUNT_UNKNOWN` | null or マスタ外の科目セル | 🔴赤 |
| `TAX_UNKNOWN` | nullの税区分セル | 🔴赤 |
| `DATE_UNKNOWN` | 日付セル | 🔴赤 |
| `FUTURE_DATE` | 日付セル | 🔴赤 |
| `DESCRIPTION_UNKNOWN` | 摘要セル | 🔴赤 |
| `CATEGORY_CONFLICT` | 矛盾科目セル（`categoryConflictMap`で特定） | 🔴赤 |
| `VOUCHER_TYPE_CONFLICT` | 証票意味セル + 矛盾科目セル（`voucherTypeConflictMap`で特定） | 🔴赤 |
| `TAX_ACCOUNT_MISMATCH` | 全税区分セル | 🔴赤 |
| `SAME_ACCOUNT_BOTH_SIDES` | 該当科目セル（`sameAccountBothSidesMap`で特定） | 🟡黄 |

### 6-3. C固有のMap（セルハイライト用）

| Map | 定義位置 | 用途 |
|-----|---------|------|
| `categoryConflictMap` | L3680 | 貸借科目矛盾の対象科目 |
| `voucherTypeConflictMap` | L3157 | 証票意味矛盾の対象科目 |
| `sameAccountBothSidesMap` | L3682 | 借方貸方に同一科目 |

---

## 7. 仕訳一覧の追加バリデーション

### 7-1. 科目選択確定時（`runAccountValidation()`）

[JournalListLevel3Mock.vue L3085](file:///c:/dev/receipt-app/src/components/JournalListLevel3Mock.vue#L3085)

```
科目選択確定
  ├── syncWarningLabels()  → ラベル同期
  ├── validateDebitCreditCombination() → 5分類矛盾チェック → モーダル表示
  └── validateByVoucherType() → 証票意味ルールチェック → モーダル表示
```

### 7-2. 税区分フィルタ連動

[JournalListLevel3Mock.vue `getTaxGroupsForEntry()` L2962](file:///c:/dev/receipt-app/src/components/JournalListLevel3Mock.vue#L2962)

```
選択中の科目のcategory → getCategoryDirection()
  ├── 'sales'    → 売上系 + 共通のみ表示
  ├── 'purchase' → 仕入系 + 共通のみ表示
  └── 'common'   → 全表示
```

---

## 8. UI列追加の実績

### 8-1. 追加した列一覧

| # | 列名 | 列キー | フィールド / 導出方法 |
|---|------|--------|---------------------|
| 1 | マスタID | `masterId` | `id` |
| 2 | 事業形態 | `target` | `target` → `targetLabel()` |
| 3 | 大分類 | `accountGroup` | `accountGroup` → `accountGroupLabel()` |
| 4 | 方向 | `direction` | `getCategoryDirection(category)` → `directionLabel()` |
| 5 | 証票意味許容 | `allowedVoucherTypes` | `VOUCHER_TYPE_RULES`全走査 → `getAllowedVoucherTypes()` |

---

## 9. 問題点 — 全解消

| # | 問題 | 状態 |
|---|------|:---:|
| P1 | バリデーションロジック3重重複 | ✅ SSOT統合。-550行 |
| P2 | BとCでwarning_dismissals/warning_details対応が異なる | ✅ SSOT呼出で統一 |
| P3 | FUTURE_DATE (#10) がBに未実装 | ✅ SSOTに追加 |
| P4 | DATE_OUT_OF_RANGEが型定義のみ | ✅ **#11として実装完了**（2026-05-30） |
| P5 | FUTURE_DATEがAPI側WARNING_WEIGHTSに欠落 | ✅ **バグ修正完了**（2026-05-30） |
| P6 | 廃止ラベル3種が型定義に残存 | ✅ **削除完了**（2026-05-30） |

---

## 10. consumptionTaxMode型統一

### 10-1. 修正結果

| ファイル | 修正内容 |
|---------|----------|
| [account-settings.types.ts](file:///c:/dev/receipt-app/src/features/account-settings/types/account-settings.types.ts) | `individual`/`proportional`追加 |
| [useAccountSettings.ts](file:///c:/dev/receipt-app/src/features/account-settings/composables/useAccountSettings.ts) | `normalizedMode`で正規化 |
| [taxCategoryRoutes.ts](file:///c:/dev/receipt-app/src/api/routes/taxCategoryRoutes.ts) | パース型拡張 |
| [accountMasterStore.ts](file:///c:/dev/receipt-app/src/api/services/accountMasterStore.ts) | `TaxCategoryFilterParams.taxMethod`型拡張 |

---

## 11. 変更履歴（2026-05-30）

| 変更 | 対象ファイル |
|------|------------|
| #11 DATE_OUT_OF_RANGE 実装 | journalValidationCore.ts, journalConstants.ts, journalListService.ts, validationMessages.ts |
| #12 DIRECTOR_LOAN 実装 | 同上 |
| #13 AUTO_INVOICE_SMALL 実装 | 同上 + mfApiConstants.ts（INVOICE_TRANSITION_0_DATE参照） |
| ValidationContext型追加 | journalValidationCore.ts |
| C側にcontext渡し | JournalListLevel3Mock.vue L3164 |
| 廃止ラベル3種削除 | journal_phase5_mock.type.ts |
| FUTURE_DATE WEIGHTS追加 | journalListService.ts |

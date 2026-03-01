# 仮説 v1: AI仕訳生成ルールの網羅的定義

日付: 2026-02-28
前バージョン: v0（ベースライン）

---

## 仮説

> AI仕訳生成に必要なルール（total_amount定義、控除種別、消費税処理、仕訳パターン、税区分、摘要）を
> 網羅的に定義してプロンプト・スキーマに反映すれば、Geminiの出力精度が安定する。

## 対応課題（課題単位テスト）

| 順番 | 課題 | 内容 | 専用テスト画像 |
|:---:|---|---|---|
| 1 | **D-1** | total_amount定義＋控除種別 | #1(源泉), #5(手数料), ダミー(値引き/ポイント等) |
| 2 | **P-4** | 消費税経理処理（禁止科目） | #5(TAX_PAID), ダミー(非課税売上等) |
| 3 | **D-2** | 仕訳摘要ルール | 任意の証票 |

### 実装手段（独立課題ではない）

| ID | 内容 | 親課題 | 実施方法 |
|---|---|---|---|
| P-1 | スキーマ・プロンプトにtotal_amount定義反映 | D-1 | スキーマdescription変更＋プロンプト追加 |
| S-2 | スキーマ説明強化 | D-1 | スキーマdescription変更 |
| T-2 | 出力形式チェック新設 | P-4 | 後処理にTAX_PAID禁止チェック追加 |
| S-6 | スキーマ全体再定義（部分対応） | D-1 | adjustmentsフィールド追加 |

---

## 1. total_amount 定義

### 定義

> total_amount = 契約上の対価総額（値引き反映後）で、支払・控除前の金額。
> 事業者の経理方式に従って出力する。入金額ではない。

### 経理方式別の出力

| 経理方式 | total_amountの出力 | 例（本体10,000 + 税1,000） |
|---|---|---:|
| 税込経理 | 税込金額 | 11,000 |
| 税抜経理 | 税抜本体額 | 10,000 |
| 免税事業者 | 税込金額 | 11,000 |

### 禁止事項

- 入金額をtotal_amountとする
- 源泉控除後金額をtotal_amountとする
- 振込手数料差引後金額をtotal_amountとする

### adjustmentsフィールド（S-6部分対応）

証票上に控除がある場合、Geminiが認識した内容を`adjustments`に出力させる。
これにより「源泉を正しく認識して控除前を出した」のか「たまたま合っただけ」かを検証可能。

| type | 日本語 | 例 |
|---|---|---|
| withholding_tax | 源泉徴収 | 報酬15,823円×10.21% |
| transfer_fee | 振込手数料 | 振込手数料660円 |
| offset | 相殺 | 買掛金との相殺 |
| points_self | ポイント充当（自社） | 楽天ポイント500円 |
| points_third | ポイント充当（第三者） | クーポン500円 |
| discount_contract | 契約時値引き | 初回割引10% |
| discount_post | 事後値引き | リベート |
| advance_pure | 立替精算（純粋） | 切手代の立替 |
| advance_incidental | 立替精算（付随費用） | 輸送費立替 |

スキーマ: `adjustments: AdjustmentEntry[] | null`
```typescript
export interface AdjustmentEntry {
  type: string;
  amount: number;
  description: string;
}
```

---

## 2. 控除種別（全9パターン）

| # | 控除種別 | total_amountに含むか | 判定理由 | 仕訳での扱い |
|---|---|:---:|---|---|
| 1 | 源泉徴収 | ✅含む | 契約対価は変わらない | 入金時差額処理（事業主貸/預り金） |
| 2 | 振込手数料 | ✅含む | 支払方法による費用 | 借方:支払手数料 |
| 3 | 相殺（債権債務） | ✅含む | 支払方法の一種 | 相殺仕訳 |
| 4 | ポイント充当（自社発行） | ❌含まない | 実質的値引き | 値引き処理（売上減額） |
| 5 | ポイント充当（第三者負担） | ✅含む | 対価は変わらない。第三者が負担 | 雑収入 or 売上 |
| 6 | 値引き（契約時） | ❌含まない | 契約対価の減少 | 売上減額 |
| 7 | 事後値引き | ❌含まない | 契約対価の修正 | 売上値引 |
| 8 | 立替精算（純粋立替） | ❌含まない | 対価ではない | 立替金/預り金 |
| 9 | 立替精算（実質付随費用） | ✅含む | 実質的に対価の一部 | 費用計上 |

### 判定ロジック（4ステップ）

```
1. 契約上の対価か？       YES → 含む / NO → 2へ
2. 支払方法による差額か？ YES → 含む（別仕訳） / NO → 3へ
3. 実質的値引きか？       YES → 含まない / NO → 4へ
4. 単なる資金移動か？     YES → 含まない / NO → 含む
```

---

## 3. 消費税経理処理（全方式網羅）

### 勘定科目の使用可否

| 勘定科目 | 免税事業者 | 税込経理 | 税抜経理 |
|---|:---:|:---:|:---:|
| 仮払消費税 | ×禁止 | ×禁止 | ○使用 |
| 仮受消費税 | ×禁止 | ×禁止 | ○使用 |
| 未払消費税 | ×禁止 | ○（決算/MF） | ○（決算/MF） |
| 租税公課（消費税） | ×禁止 | ○（納付/MF） | ×禁止 |
| 雑収入/雑損失（端数） | ×禁止 | ×禁止 | ○（決算/MF） |

### 金額の出力

| 経理方式 | 日常仕訳の金額 | 固定資産取得価額 | 減価償却基準 |
|---|---|---|---|
| 免税 | 税込 | 税込 | 税込 |
| 税込経理 | 税込 | 税込 | 税込 |
| 税抜経理 | 本体＋仮払/仮受を分離 | 税抜 | 税抜 |

### v1前提（ユーザー設定）

- **経理方式: 税込経理**
- 日常仕訳で消費税勘定は一切使わない
- 金額は全て税込で1行出力
- 決算仕訳・消費税計算・納付仕訳はMFが処理

### config動的反映（P-4の実装）

v0ではプロンプト（`classify_test.ts` L142-237 `REQUEST_PROMPT`）に事業者設定がハードコードされている。
v1では`test_config.ts`の`AccountingConfig`からプロンプトを動的生成する。

```typescript
// v0: ハードコード
const REQUEST_PROMPT = `...経理方式: 税込経理...`;

// v1: config依存に変更
import { CONFIGS, type AccountingConfig } from './test_config';

function buildRequestPrompt(config: AccountingConfig): string {
  const methodLabel = {
    tax_included: '税込経理',
    tax_excluded: '税抜経理',
    exempt: '免税（税込処理）',
  }[config.accounting_method];

  const forbiddenAccounts = config.accounting_method === 'tax_excluded'
    ? '（税抜経理のため制限なし）'
    : '仮払消費税（TAX_PAID）、仮受消費税（TAX_RECEIVED）は使用禁止';

  return `以下の証票を解析し、会計処理用JSONを生成せよ。
## 会計コンテキスト
- **事業者種別**: ${config.entity_type === 'individual' ? '個人事業主' : '法人'}
- **経理方式**: ${methodLabel}
- **禁止科目**: ${forbiddenAccounts}
...
`;
}
```

後処理（`classify_postprocess.ts`）にもconfigのaccounting_methodを渡す:
```typescript
// v0: 引数なし（ハードコード前提）
runPostProcess(geminiResult, i, allResults, tokenUsage);

// v1: config依存に変更
runPostProcess(geminiResult, i, allResults, tokenUsage, config.accounting_method);
```

### AI（Gemini）の責務 vs MFの責務

| 処理 | AI | MF |
|---|:---:|:---:|
| 日常仕訳（取引発生時） | ✅ | — |
| 税込金額の出力 | ✅ | — |
| 税区分の付与 | ✅ | — |
| 決算仕訳（未払消費税等） | — | ✅ |
| 消費税計算 | — | ✅ |
| 納付仕訳（租税公課） | — | ✅ |
| 端数処理（雑損益） | — | ✅ |
| 減価償却計算 | — | ✅ |
| 確定申告連動 | — | ✅ |

---

## 4. 仕訳パターン（網羅）

### 経費（仕入）

```
借方: 費用科目    税込金額    TAXABLE_PURCHASE_10
貸方: 現金/未払金  税込金額    OUT_OF_SCOPE_PURCHASE
```

例: 消耗品110,000円
```
借方: 消耗品費    110,000    TAXABLE_PURCHASE_10
貸方: 現金        110,000    OUT_OF_SCOPE_PURCHASE
```

### 経費（軽減税率）

```
借方: 費用科目    税込金額    TAXABLE_PURCHASE_8
貸方: 現金/未払金  税込金額    OUT_OF_SCOPE_PURCHASE
```

### 経費（非課税仕入）

```
借方: 費用科目    金額    NON_TAXABLE_PURCHASE
貸方: 現金/未払金  金額    OUT_OF_SCOPE_PURCHASE
```

例: 保険料50,000円
```
借方: 保険料      50,000    NON_TAXABLE_PURCHASE
貸方: 普通預金    50,000    OUT_OF_SCOPE_PURCHASE
```

### 経費（対象外仕入）

```
借方: 費用科目    金額    OUT_OF_SCOPE_PURCHASE
貸方: 現金/未払金  金額    OUT_OF_SCOPE_PURCHASE
```

例: 印紙代400円
```
借方: 租税公課    400    OUT_OF_SCOPE_PURCHASE
貸方: 現金        400    OUT_OF_SCOPE_PURCHASE
```

### 売上（課税10%）

```
借方: 売掛金/預金  税込金額    OUT_OF_SCOPE_SALES
貸方: 売上高       税込金額    TAXABLE_SALES_10
```

### 売上（非課税 — 住宅貸付）

```
借方: 売掛金/預金  金額    OUT_OF_SCOPE_SALES
貸方: 受取家賃     金額    NON_TAXABLE_SALES
```

### 売上（課税売上 — 事業用ビル等）

```
借方: 売掛金/預金  税込金額    OUT_OF_SCOPE_SALES
貸方: 受取家賃     税込金額    TAXABLE_SALES_10
```

### 入金（源泉あり。源泉義務なし前提）

```
借方: 普通預金    入金額    OUT_OF_SCOPE_PURCHASE
借方: 事業主貸    源泉額    OUT_OF_SCOPE_PURCHASE
貸方: 売掛金      total     OUT_OF_SCOPE_SALES
```

### 入金（振込手数料差引）

```
借方: 普通預金    入金額    OUT_OF_SCOPE_PURCHASE
借方: 支払手数料  手数料    TAXABLE_PURCHASE_10
貸方: 売掛金      total     OUT_OF_SCOPE_SALES
```

### 収支報告書（管理会社精算）

```
借方: 普通預金    振込額      OUT_OF_SCOPE_PURCHASE
借方: 支払手数料  振込手数料  TAXABLE_PURCHASE_10
借方: 支払手数料  管理手数料  TAXABLE_PURCHASE_10
貸方: 受取家賃    収入総額    NON_TAXABLE_SALES
```

### 立替金（純粋立替）

```
借方: 立替金      金額    OUT_OF_SCOPE_PURCHASE
貸方: 現金/預金    金額    OUT_OF_SCOPE_PURCHASE
```

### 相殺

```
借方: 買掛金      金額    OUT_OF_SCOPE_PURCHASE
貸方: 売掛金      金額    OUT_OF_SCOPE_SALES
```

### 資金移動（振替）

```
借方: 普通預金    金額    OUT_OF_SCOPE_PURCHASE
貸方: 現金        金額    OUT_OF_SCOPE_PURCHASE
```

### 事業外支出（私的支出・医療費）

```
借方: 事業主貸    金額    OUT_OF_SCOPE_PURCHASE
貸方: 現金/預金    金額    OUT_OF_SCOPE_PURCHASE
```

---

## 5. 税区分（8値enum）マッピング

| 税区分 | 用途 | 適用例 |
|---|---|---|
| TAXABLE_PURCHASE_10 | 課税仕入10% | 消耗品、通信費、家賃（事業用）、手数料 |
| TAXABLE_PURCHASE_8 | 課税仕入8%（軽減） | 飲食料品、定期購読新聞 |
| NON_TAXABLE_PURCHASE | 非課税仕入 | 保険料、利息、土地代、行政手数料 |
| OUT_OF_SCOPE_PURCHASE | 対象外（仕入側） | 給与、税金、寄付金、慶弔、貸方科目（現金/預金等） |
| TAXABLE_SALES_10 | 課税売上10% | 一般売上、事業用ビル賃料 |
| TAXABLE_SALES_8 | 課税売上8%（軽減） | 飲食料品売上 |
| NON_TAXABLE_SALES | 非課税売上 | 住宅貸付、有価証券譲渡 |
| OUT_OF_SCOPE_SALES | 対象外（売上側） | 配当金、損害賠償、借方科目（預金/売掛金等） |

---

## 6. 仕訳摘要ルール（D-2）

| 項目 | ルール |
|---|---|
| 形式 | 取引先名＋用途（20文字以内） |
| 例 | 「ドトール モーニング」「〇〇会計事務所 顧問料」 |
| 正規化 | しない（画像に記載の通りに記入） |
| 推測 | 禁止（画像から読み取れる事実のみ） |

---

## ファイル一覧

| 役割 | ファイル |
|---|---|
| スキーマ（マスター） | [classify_schema.ts](../classify_schema.ts) |
| プロンプト＋API（マスター） | [classify_test.ts](../classify_test.ts) |
| 後処理（マスター） | [classify_postprocess.ts](../classify_postprocess.ts) |
| 事業者設定（マスター） | [test_config.ts](../test_config.ts) |
| 正解データ（税込課税） | ground_truth_v1_kojin_aoiro_tax_included.ts（未作成） |
| 正解データ（税抜課税） | ground_truth_v1_kojin_aoiro_tax_excluded.ts（未作成） |
| 正解データ（免税） | ground_truth_v1_kojin_menzei.ts（未作成） |
| 正解データ（法人税込） | ground_truth_v1_houjin_tax_included.ts（未作成） |
| 正解データ（法人税抜） | ground_truth_v1_houjin_tax_excluded.ts（未作成） |

---

## 期待する効果（検証可能な予測）

| # | v0の出力 | v1で期待する出力 | 検証項目 |
|---|---:|---:|---|
| 1 | total_amount=154,677 | **170,500** | 源泉控除前を拾う |
| 5 | total_amount=100,675 | **107,000** | 手数料控除前を拾う |
| 5 | TAX_PAID出力 | **出力されない** | 税込経理で消費税勘定禁止 |
| 5 | has_multiple_tax_rates=true | **false** | 副作用確認 |

## 棄却条件

1. #1, #5ともにtotal_amountが期待値と不一致
2. TAX_PAIDが引き続き出力される
3. 他の画像で新たなエラーパターンが大量発生
4. Geminiが「契約対価」の判断を大幅に誤る

## テスト結果まとめ

（未実施）

### 1回目（#1, #5のみ）

- 日時:
- 結果:
- v0との差分:
- 期待との差分:

### 2回目（18件全体）

（仮説が支持された場合）

---

## 後処理アーキテクチャ（v1）

### ワンショット設計（v1 1回目テスト）

```
画像 + プロンプト(config依存) → Gemini API(1回) → JSON出力 → 後処理(コード側) → 結果
                                                              ↑
                                                        Geminiに戻らない
```

- v1 1回目はワンショット。後処理結果をGeminiにフィードバックしない
- 後処理は**検出のみ**。修正は人間が行う
- 後処理で検出されたエラー（TAX_PAID禁止違反等）は結果レポートに記録

### フィードバックループ（v1 1回目の結果次第で検証）

```
1回目: 画像+プロンプト → Gemini → JSON → 後処理 → エラー検出
2回目: JSON+後処理エラー+「TAX_PAIDは禁止。修正せよ」→ Gemini → 修正JSON → 後処理 → 最終結果
```

- 1回目テストで後処理エラーが頻発する場合、**v1内で**フィードバックループを追加検証する
- 2回目呼び出しのコスト増（API料金×2）と精度改善のトレードオフを評価する
- フィードバックで改善しない場合 → プロンプト自体の見直し（v2へ）

---

## 課題→マスター対応表

| 課題ID | 課題名 | スキーマ | プロンプト | 後処理 |
|:---:|---|:---:|:---:|:---:|
| D-1 | total_amount定義 | ✅description変更 + adjustments追加 | ✅定義明示 + 控除種別表 + 判定ロジック | ✅adjustments整合 |
| P-1 | total_amount曖昧 | ✅description変更 | ✅定義明示 | — |
| S-2 | スキーマ説明不足 | ✅description変更 | — | — |
| P-4 | 税込/税抜出力定義なし | — | ✅禁止科目一覧 + config反映 | ✅TAX_PAID禁止 + 禁止科目チェック |
| T-2 | 出力形式チェック新設 | — | — | ✅TAX_PAID禁止（T-2の実装） |
| D-2 | 仕訳摘要ルール | — | ✅摘要ルール | — |
| S-6 | スキーマ全体再定義 | ✅adjustments追加（部分対応） | — | — |

---

## 次の仮説への入力

（テスト結果から導出）

# 仮説 v0: ベースライン（原案）

日付: 2026-02-27（Run A実行日）
仮説: 現行スキーマ・プロンプトで証票分類が正しく動作する

## 仮説と目的

現行の`classify_schema.ts`と`classify_test.ts`で18件のテスト画像を分類し、AIの挙動パターンを把握する。

## ファイル一覧

| 役割 | ファイル | 元ファイル |
|---|---|---|
| スキーマ | [classify_schema_v0.ts](./classify_schema_v0.ts) | `src/scripts/classify_schema.ts` |
| プロンプト＋後処理 | [classify_test_v0.ts](./classify_test_v0.ts) | `src/scripts/classify_test.ts` |
| 正解データ | [ground_truth_v0.ts](./ground_truth_v0.ts) | `src/scripts/ground_truth.ts` |

## total_amountの定義（v0）

```
total_amount: '税込合計'
```

4文字。未定義に等しい。

## テスト結果まとめ

- Run A: 18/18 API成功、エラー0件
- コスト: $0.183、平均18.0秒/件
- 生データ: `src/scripts/test_results/run_a_first/`

## 検証済み画像

| # | 主な発見 |
|---|---------|
| #1 (1.pdf) | total_amount=154,677（源泉後）。正解は170,500（請求額） |
| #5 (5.jpg) | total_amount=100,675（送金額）。正解は107,000（家賃収入）。TAX_PAID出力。has_multiple_tax_rates矛盾 |

---

## 発見した課題（26課題）

v0テストで以下5カテゴリ・26課題を発見:
- 🔴 プロンプト最適化: P-1〜P-5（P-3は削除）
- 🟡 スキーマ最適化: S-1〜S-6
- 🟢 前提条件最適化: C-1〜C-3
- 🔵 後処理最適化: T-1〜T-3
- 🟣 設計未決事項: D-1〜D-9

→ 課題詳細・優先順位・実行順序は [issues_master.md](../issues_master.md) に集約

## 次の仮説への入力

- D-1決定済み: total_amount = 主取引の税込総額（控除前）
- #5のtotal_amount正解値: 107,000（家賃収入）
- 税込モードでTAX_PAID禁止を明示すべき

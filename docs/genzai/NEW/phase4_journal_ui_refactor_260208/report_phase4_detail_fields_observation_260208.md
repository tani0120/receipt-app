# 仕訳明細入力項目の観測結果（確定資料）

## 観測日時
2026-02-08 21:50

## 対象ファイル
`c:\dev\receipt-app\src\views\ScreenE_Workbench.vue`

## v-for内のinput/select要素（7項目）

| No | 行番号 | 種別 | v-model | 区分 |
|----|--------|------|---------|------|
| 1 | L95 | input | `line.drAccount` | 借方 |
| 2 | L97 | select | `line.drTaxClass` | 借方 |
| 3 | L113 | input | `line.drAmount` | 借方 |
| 4 | L118 | input | `line.crAccount` | 貸方 |
| 5 | L120 | select | `line.crTaxClass` | 貸方 |
| 6 | L134 | input | `line.crAmount` | 貸方 |
| 7 | L139 | input | `line.description` | 共通 |

## 実装方針（設計確定後）
各項目に `:disabled="uiMode === 'readonly'"` を追加

## 保留理由
status/label/readonly再定義およびStreamed互換設計の確定を待つ

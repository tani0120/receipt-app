# status / label / readonly 再定義ドラフト v0.1

## 0. 前提（重要）

本システムは 厳密な会計監査フローを目的としない

主目的は
「仕訳できるものを早く仕訳する」
「判断できないものを忘れない」

差戻しは「ミス修正」ではなく
判断不能・情報不足の可視化が中心

## 1. status（状態）

### 定義

status は「この仕訳が今、会計判断としてどの段階にあるか」を表す単一状態

原則：1エントリに1つ

UI制御の基軸

ラベル（label）とは役割が違う

### 想定 status 一覧（v0.1）

| status | 意味 | 編集可否 | 備考 |
|--------|------|---------|------|
| READY_FOR_WORK | 仕訳判断が可能 | 編集可 | 通常作業状態 |
| NEEDS_INFO | 判断不能（情報不足） | 編集可 | 差戻しというより「保留」 |
| SUBMITTED | 仕訳判断完了 | 原則不可 | 上席確認待ち |
| APPROVED | 確定 | 不可 | ここでのみ readonly 発生 |

※ Draft は UI 内部状態であり、業務 status には含めない（Phase 5で検討）

## 2. label（判断メモ / タグ）

### 定義

label は「なぜ判断できないか／何を待っているか」を表す付加情報

status とは独立

複数付与可能

UI上はバッジ・タグ・メモとして表示

### label の役割

顧問先への確認事項の備忘

追加資料待ちの可視化

担当者自身の作業メモ

### 代表的なラベル例（非固定）

領収書不足

用途不明

取引先確認中

課税区分未確定

後でまとめて判断

👉 label があるから status を増やさなくて済む

## 3. readonly（編集不可状態）

### 定義

readonly は UI / UX 上の状態であり、業務状態そのものではない

### readonly が意味するもの

人は触らない

判断は終わっている

計算や表示は動いてよい

### readonly 発生条件（v0.1）

| 条件 | readonly |
|------|----------|
| status = APPROVED | YES |
| status = SUBMITTED | 原則 YES |
| status = READY_FOR_WORK | NO |
| status = NEEDS_INFO | NO |

👉 readonly は「承認後のみ」

## 4. remanded 再定義（重要）

### v0.1 結論

「remanded」という status は持たない

### 理由：

実態は「判断できない」か「情報待ち」

差戻し＝ミス修正前提の語彙は合わない

NEEDS_INFO + label の方が表現力が高い

## 5. UI への影響（指針）

### 編集可否の基本ルール

status が READY_FOR_WORK / NEEDS_INFO
→ 編集可能

status が SUBMITTED / APPROVED
→ 編集不可（readonly）

### UI の役割分担

status：全体の段階を示す（大きなバッジ）

label：理由・背景を示す（小さなタグ）

readonly：触れるかどうかを決めるだけ

## 6. このドラフトで達成していること

差戻し＝失敗 という前提を捨てた

状態爆発を label に逃がした

readonly を 最小限・意味論的に限定

ストリームド互換の余地を残した

## 7. 未決事項（v0.2 以降）

SUBMITTED を readonly にするかどうかの最終判断

label の保存粒度（entry単位 / line単位）

label のライフサイクル（自動解除するか）

Streamed 概念との正式マッピング

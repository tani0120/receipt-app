# 分析系コマンド レシピ集

> 各コマンドの部品組み合わせ手順。
> コマンド一覧: [34_command_catalog.md](34_command_catalog.md)
> 部品定義: [35_parts_catalog.md](35_parts_catalog.md)
> 最終更新: 2026-05-25
>
> …… 再編対応表 ……
> 以下の全コマンドは **P7: 財務分析** (`financial_analysis`) に統合。
> 実行方式: **ai_fc**（層3 FC。データ取得はMCP直叩き、AI解釈はGemini FC）
> コスト: ¥1〜5/回
> 将来構想: 定型化し、顧問先への報告フォーマットをAPI直叩きで自動生成（設計未定）

## 売上ランキング ✅

```
入力: getPL（PL試算表）+ fetchJournals（摘要別集計用）
処理: aggregate（売上科目を金額降順で集計）+ nayose(AI)（取引先名寄せ）
出力先: 画面
出力UI: tableView（テーブル）
```

---

## 経費ランキング ✅

```
入力: getPL（PL試算表）+ fetchJournals
処理: aggregate（経費科目を金額降順で集計）
出力先: 画面
出力UI: tableView
```

---

## 月次変動科目 ✅

```
入力: getTransitionPL（PL推移表）+ fetchJournals
処理: aggregateByMonth（月別集計）
      → 平均と比較し ±{threshold}% 以上を検出
      → aiReason(AI)（摘要から変動理由を推定）
出力先: 画面
出力UI: tableView（変動テーブル）+ textView（理由推定）
```

---

## ビジネスモデル概況 🔧

```
入力: getPL + getTermSettings
処理: aiSummarize(AI)（PL構成比から業種・収益構造を要約）
出力先: 画面
出力UI: textView
```

---

## 売上先・仕入先・外注先一覧 🔧

```
入力: fetchJournals + fetchAccounts
処理: aggregate（取引先別集計）+ nayose(AI)（取引先名寄せ）
出力先: 画面
出力UI: tableView
```

---

## 給与・役員報酬月次推移 🔧

```
入力: getTransitionPL
処理: 人件費科目を抽出 + aggregateByMonth
出力先: 画面
出力UI: tableView
```

---

## 口座カードリスト 🔧

```
入力: getConnectedAccounts
処理: なし
出力先: 画面
出力UI: tableView
```

---

## 過去3期計画 🔧

```
入力: getPL × 3期分
処理: aggregate（期別PL比較）+ calcChange + aiSummarize(AI)（成長率→月次計画）
出力先: 画面
出力UI: textView
```

---

## 回収/支払サイト 🔧

```
入力: fetchJournals（売掛/買掛の発生日と入出金日）
処理: dateDiff（発生日→入出金日の日数算出）
出力先: 画面
出力UI: tableView
```

---

## 口座役割と資金の流れ 🔧

```
入力: fetchJournals + getConnectedAccounts
処理: aggregate（口座別入出金集計）+ aiSummarize(AI)（役割推定）
出力先: 画面
出力UI: textView
```

---

## バッチ損益マージ 🔧

```
入力: getPL + アプリ内部PL
処理: diffCompare（MF PLとアプリPLの統合）
出力先: 画面
出力UI: tableView
```

---

## 売上増減ランキング ✅

```
入力: getPL × 2期 + fetchJournals
処理: aggregate + calcChange + nayose(AI)
出力先: 画面
出力UI: tableView
```

---

## 売上ランキング（部門別） 🔧

```
入力: fetchJournals + getDepartments
処理: aggregateByDepartment
出力先: 画面
出力UI: tableView
```

---

## 売上増減（部門別） 🔧

```
入力: fetchJournals × 2期 + getDepartments
処理: aggregateByDepartment + calcChange
出力先: 画面
出力UI: tableView
```

---

## 仕入ランキング 🔧

```
入力: fetchJournals + fetchAccounts
処理: aggregate（仕入科目フィルタ）
出力先: 画面
出力UI: tableView
```

---

## 仕入増減ランキング 🔧

```
入力: fetchJournals × 2期
処理: aggregate + calcChange
出力先: 画面
出力UI: tableView
```

---

## 外注ランキング 🔧

```
入力: fetchJournals + fetchAccounts
処理: aggregate（外注科目フィルタ）
出力先: 画面
出力UI: tableView
```

---

## 外注増減ランキング 🔧

```
入力: fetchJournals × 2期
処理: aggregate + calcChange
出力先: 画面
出力UI: tableView
```

---

## 連携不備全社リスト ❌

```
入力: getConnectedAccounts × 全テナント
処理: フィルタ（不備検出）
出力先: 画面
出力UI: tableView
備考: 全テナントループが必要。現行MCPでは困難
```

---

## 現金領収書未受領リスト ❌

```
入力: アプリ受領管理データ
処理: 日付比較（期日超過検出）
出力先: 画面
出力UI: tableView
備考: アプリ側の受領管理機能が必要
```

---

## 未連携口座未受領リスト ❌

```
入力: getConnectedAccounts + アプリデータ
処理: diffCompare
出力先: 画面
出力UI: tableView
備考: 同上
```
